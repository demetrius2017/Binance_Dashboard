"""
Binance Real-Time Monitoring and Analytics Dashboard
Main Flask application with WebSocket support for real-time updates
"""

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
import threading
import time
from datetime import datetime, timedelta
from collections import defaultdict
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'binance-dashboard-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for storing data
market_data = {}
trading_pairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']
price_history = defaultdict(list)
volume_data = defaultdict(dict)

# Binance API endpoints
BINANCE_API_BASE = 'https://api.binance.com/api/v3'
BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws'


class BinanceDataFetcher:
    """Fetches and manages Binance market data"""
    
    def __init__(self):
        self.running = False
        self.thread = None
    
    def start(self):
        """Start fetching data in background thread"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._fetch_loop, daemon=True)
            self.thread.start()
    
    def stop(self):
        """Stop fetching data"""
        self.running = False
        if self.thread:
            self.thread.join()
    
    def _fetch_loop(self):
        """Main loop for fetching market data"""
        while self.running:
            try:
                self._fetch_market_data()
                self._fetch_24h_stats()
                socketio.emit('market_update', market_data)
                time.sleep(5)  # Update every 5 seconds
            except Exception as e:
                print(f"Error fetching data: {e}")
                time.sleep(10)
    
    def _fetch_market_data(self):
        """Fetch current prices for all trading pairs"""
        try:
            response = requests.get(f'{BINANCE_API_BASE}/ticker/price')
            if response.status_code == 200:
                prices = response.json()
                for price_data in prices:
                    symbol = price_data['symbol']
                    if symbol in trading_pairs:
                        price = float(price_data['price'])
                        timestamp = datetime.now().isoformat()
                        
                        if symbol not in market_data:
                            market_data[symbol] = {}
                        
                        # Store previous price for change calculation
                        if 'price' in market_data[symbol]:
                            prev_price = market_data[symbol]['price']
                            change = ((price - prev_price) / prev_price) * 100
                            market_data[symbol]['change'] = change
                        
                        market_data[symbol]['price'] = price
                        market_data[symbol]['timestamp'] = timestamp
                        
                        # Store price history (keep last 100 points)
                        price_history[symbol].append({
                            'time': timestamp,
                            'price': price
                        })
                        if len(price_history[symbol]) > 100:
                            price_history[symbol].pop(0)
        except Exception as e:
            print(f"Error fetching market data: {e}")
    
    def _fetch_24h_stats(self):
        """Fetch 24-hour statistics for all trading pairs"""
        try:
            response = requests.get(f'{BINANCE_API_BASE}/ticker/24hr')
            if response.status_code == 200:
                stats = response.json()
                for stat in stats:
                    symbol = stat['symbol']
                    if symbol in trading_pairs:
                        if symbol not in market_data:
                            market_data[symbol] = {}
                        
                        market_data[symbol].update({
                            'high_24h': float(stat['highPrice']),
                            'low_24h': float(stat['lowPrice']),
                            'volume_24h': float(stat['volume']),
                            'quote_volume_24h': float(stat['quoteVolume']),
                            'price_change_24h': float(stat['priceChange']),
                            'price_change_percent_24h': float(stat['priceChangePercent']),
                            'trades_24h': int(stat['count'])
                        })
        except Exception as e:
            print(f"Error fetching 24h stats: {e}")


# Initialize data fetcher
data_fetcher = BinanceDataFetcher()


@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('dashboard.html')


@app.route('/api/pairs')
def get_pairs():
    """Get list of trading pairs being monitored"""
    return jsonify({'pairs': trading_pairs})


@app.route('/api/market/<symbol>')
def get_market_data(symbol):
    """Get market data for specific trading pair"""
    if symbol in market_data:
        return jsonify(market_data[symbol])
    return jsonify({'error': 'Symbol not found'}), 404


@app.route('/api/market')
def get_all_market_data():
    """Get market data for all trading pairs"""
    return jsonify(market_data)


@app.route('/api/history/<symbol>')
def get_price_history(symbol):
    """Get price history for specific trading pair"""
    if symbol in price_history:
        return jsonify(price_history[symbol])
    return jsonify([])


@app.route('/api/orderbook/<symbol>')
def get_orderbook(symbol):
    """Get orderbook data for specific trading pair"""
    try:
        response = requests.get(f'{BINANCE_API_BASE}/depth', params={'symbol': symbol, 'limit': 20})
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'bids': [[float(price), float(qty)] for price, qty in data['bids']],
                'asks': [[float(price), float(qty)] for price, qty in data['asks']]
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Failed to fetch orderbook'}), 500


@app.route('/api/klines/<symbol>')
def get_klines(symbol):
    """Get candlestick data for specific trading pair"""
    interval = request.args.get('interval', '1h')
    limit = request.args.get('limit', 24)
    try:
        response = requests.get(f'{BINANCE_API_BASE}/klines', params={
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        })
        if response.status_code == 200:
            klines = response.json()
            formatted_klines = []
            for k in klines:
                formatted_klines.append({
                    'time': datetime.fromtimestamp(k[0] / 1000).isoformat(),
                    'open': float(k[1]),
                    'high': float(k[2]),
                    'low': float(k[3]),
                    'close': float(k[4]),
                    'volume': float(k[5])
                })
            return jsonify(formatted_klines)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Failed to fetch klines'}), 500


@app.route('/api/add_pair', methods=['POST'])
def add_trading_pair():
    """Add a new trading pair to monitor"""
    data = request.get_json()
    symbol = data.get('symbol', '').upper()
    
    if not symbol:
        return jsonify({'error': 'Symbol required'}), 400
    
    if symbol not in trading_pairs:
        trading_pairs.append(symbol)
        return jsonify({'success': True, 'pairs': trading_pairs})
    
    return jsonify({'error': 'Symbol already exists'}), 400


@app.route('/api/remove_pair', methods=['POST'])
def remove_trading_pair():
    """Remove a trading pair from monitoring"""
    data = request.get_json()
    symbol = data.get('symbol', '').upper()
    
    if symbol in trading_pairs:
        trading_pairs.remove(symbol)
        if symbol in market_data:
            del market_data[symbol]
        if symbol in price_history:
            del price_history[symbol]
        return jsonify({'success': True, 'pairs': trading_pairs})
    
    return jsonify({'error': 'Symbol not found'}), 404


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connection_response', {'status': 'connected'})
    # Send initial data
    emit('market_update', market_data)


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


@socketio.on('subscribe')
def handle_subscribe(data):
    """Handle subscription to specific trading pair"""
    symbol = data.get('symbol')
    print(f'Client subscribed to {symbol}')


if __name__ == '__main__':
    # Start background data fetching
    data_fetcher.start()
    
    # Run the Flask app with SocketIO
    print("Starting Binance Real-Time Dashboard...")
    print("Dashboard will be available at: http://localhost:5000")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
