"""
Binance Real-time Monitoring and Analytics Dashboard
Main application file with Flask backend and WebSocket support
"""

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from binance.client import Client
import threading
import time
import os
from datetime import datetime, timedelta
from collections import deque
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'binance-dashboard-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for storing data
price_data = {}
trade_history = deque(maxlen=100)
portfolio = {}
analytics_data = {
    'total_trades': 0,
    'profitable_trades': 0,
    'losing_trades': 0,
    'total_pnl': 0.0,
    'win_rate': 0.0
}

# Binance client (use test credentials or set via environment variables)
API_KEY = os.environ.get('BINANCE_API_KEY', '')
API_SECRET = os.environ.get('BINANCE_API_SECRET', '')
DEMO_MODE = os.environ.get('DEMO_MODE', 'false').lower() == 'true'

# Initialize client (will work in public mode without credentials)
binance_client = None
try:
    if API_KEY and API_SECRET:
        binance_client = Client(API_KEY, API_SECRET)
    else:
        binance_client = Client("", "")  # Public API access
    # Test connection
    binance_client.ping()
    print("✓ Connected to Binance API")
except Exception as e:
    print(f"⚠ Warning: Cannot connect to Binance API: {e}")
    print("  Running in DEMO MODE with simulated data")
    DEMO_MODE = True
    binance_client = None


class BinanceDataFetcher:
    """Handles fetching and processing Binance data"""
    
    def __init__(self):
        self.running = False
        self.symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']
        self.demo_prices = {
            'BTCUSDT': 95000.0,
            'ETHUSDT': 3500.0,
            'BNBUSDT': 620.0,
            'SOLUSDT': 180.0,
            'XRPUSDT': 2.5
        }
        
    def start(self):
        """Start fetching real-time data"""
        self.running = True
        thread = threading.Thread(target=self._fetch_prices)
        thread.daemon = True
        thread.start()
        
    def _fetch_prices(self):
        """Continuously fetch price data"""
        import random
        
        while self.running:
            try:
                if DEMO_MODE or binance_client is None:
                    # Simulate price updates in demo mode
                    for symbol in self.symbols:
                        # Add some random variation to demo prices
                        base_price = self.demo_prices[symbol]
                        variation = random.uniform(-0.02, 0.02)  # ±2% variation
                        current_price = base_price * (1 + variation)
                        
                        price_data[symbol] = {
                            'symbol': symbol,
                            'price': current_price,
                            'timestamp': datetime.now().isoformat(),
                            'change_24h': random.uniform(-10, 10),
                            'high_24h': current_price * 1.05,
                            'low_24h': current_price * 0.95,
                            'volume_24h': random.uniform(10000, 100000)
                        }
                else:
                    # Fetch real data from Binance
                    for symbol in self.symbols:
                        ticker = binance_client.get_symbol_ticker(symbol=symbol)
                        price_data[symbol] = {
                            'symbol': symbol,
                            'price': float(ticker['price']),
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        # Get 24h stats
                        stats = binance_client.get_ticker(symbol=symbol)
                        price_data[symbol].update({
                            'change_24h': float(stats['priceChangePercent']),
                            'high_24h': float(stats['highPrice']),
                            'low_24h': float(stats['lowPrice']),
                            'volume_24h': float(stats['volume'])
                        })
                
                # Emit updated data to connected clients
                socketio.emit('price_update', price_data)
                time.sleep(2)  # Update every 2 seconds
                
            except Exception as e:
                print(f"Error fetching prices: {e}")
                time.sleep(5)
    
    def stop(self):
        """Stop fetching data"""
        self.running = False


# Initialize data fetcher
data_fetcher = BinanceDataFetcher()


@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')


@app.route('/api/prices')
def get_prices():
    """Get current prices for all tracked symbols"""
    return jsonify(price_data)


@app.route('/api/trades')
def get_trades():
    """Get recent trade history"""
    return jsonify(list(trade_history))


@app.route('/api/portfolio')
def get_portfolio():
    """Get current portfolio holdings"""
    return jsonify(portfolio)


@app.route('/api/analytics')
def get_analytics():
    """Get trading analytics and PnL data"""
    return jsonify(analytics_data)


@app.route('/api/add_trade', methods=['POST'])
def add_trade():
    """Add a new trade to track PnL"""
    data = request.json
    trade = {
        'id': len(trade_history) + 1,
        'symbol': data.get('symbol'),
        'side': data.get('side'),  # BUY or SELL
        'quantity': float(data.get('quantity')),
        'price': float(data.get('price')),
        'timestamp': datetime.now().isoformat()
    }
    
    trade_history.append(trade)
    
    # Update portfolio
    symbol = trade['symbol']
    if symbol not in portfolio:
        portfolio[symbol] = {'quantity': 0, 'avg_price': 0, 'total_cost': 0}
    
    if trade['side'] == 'BUY':
        old_total = portfolio[symbol]['quantity'] * portfolio[symbol]['avg_price']
        new_total = old_total + (trade['quantity'] * trade['price'])
        portfolio[symbol]['quantity'] += trade['quantity']
        portfolio[symbol]['avg_price'] = new_total / portfolio[symbol]['quantity'] if portfolio[symbol]['quantity'] > 0 else 0
        portfolio[symbol]['total_cost'] += trade['quantity'] * trade['price']
    else:  # SELL
        portfolio[symbol]['quantity'] -= trade['quantity']
        pnl = (trade['price'] - portfolio[symbol]['avg_price']) * trade['quantity']
        analytics_data['total_pnl'] += pnl
        analytics_data['total_trades'] += 1
        if pnl > 0:
            analytics_data['profitable_trades'] += 1
        else:
            analytics_data['losing_trades'] += 1
    
    # Calculate win rate
    if analytics_data['total_trades'] > 0:
        analytics_data['win_rate'] = (analytics_data['profitable_trades'] / analytics_data['total_trades']) * 100
    
    socketio.emit('trade_update', trade)
    socketio.emit('analytics_update', analytics_data)
    
    return jsonify({'status': 'success', 'trade': trade})


@app.route('/api/market_overview')
def market_overview():
    """Get market overview with top gainers/losers"""
    try:
        if DEMO_MODE or binance_client is None:
            # Return demo data
            import random
            demo_symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
                           'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT']
            
            demo_data = []
            for symbol in demo_symbols:
                demo_data.append({
                    'symbol': symbol,
                    'priceChangePercent': str(random.uniform(-15, 15)),
                    'lastPrice': str(random.uniform(0.1, 100000)),
                    'quoteVolume': str(random.uniform(1000000, 1000000000))
                })
            
            # Sort for different categories
            gainers = sorted(demo_data, key=lambda x: float(x['priceChangePercent']), reverse=True)[:10]
            losers = sorted(demo_data, key=lambda x: float(x['priceChangePercent']))[:10]
            by_volume = sorted(demo_data, key=lambda x: float(x['quoteVolume']), reverse=True)[:10]
            
            return jsonify({
                'gainers': gainers,
                'losers': losers,
                'by_volume': by_volume
            })
        else:
            # Get tickers for multiple symbols
            tickers = binance_client.get_ticker()
            
            # Filter USDT pairs and sort by volume
            usdt_pairs = [t for t in tickers if t['symbol'].endswith('USDT')]
            
            # Top gainers
            gainers = sorted(usdt_pairs, key=lambda x: float(x['priceChangePercent']), reverse=True)[:10]
            
            # Top losers
            losers = sorted(usdt_pairs, key=lambda x: float(x['priceChangePercent']))[:10]
            
            # Top volume
            by_volume = sorted(usdt_pairs, key=lambda x: float(x['quoteVolume']), reverse=True)[:10]
            
            return jsonify({
                'gainers': gainers,
                'losers': losers,
                'by_volume': by_volume
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connection_response', {'status': 'connected'})
    # Send current data on connect
    emit('price_update', price_data)
    emit('analytics_update', analytics_data)


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


@socketio.on('subscribe')
def handle_subscribe(data):
    """Handle subscription to specific symbols"""
    symbol = data.get('symbol')
    print(f'Client subscribed to {symbol}')
    if symbol in price_data:
        emit('price_update', {symbol: price_data[symbol]})


if __name__ == '__main__':
    # Start data fetcher
    data_fetcher.start()
    
    # Run the application
    print("Starting Binance Dashboard...")
    print("Access the dashboard at http://localhost:5000")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
