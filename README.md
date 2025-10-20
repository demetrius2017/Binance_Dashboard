# Binance Real-time Trading Dashboard

A comprehensive real-time monitoring and analytics dashboard for Binance trading. Track live prices, manage your portfolio, calculate PnL (Profit & Loss), and analyze market trends.

## Features

✨ **Real-time Price Monitoring**
- Live price updates for major cryptocurrencies (BTC, ETH, BNB, SOL, XRP)
- 24-hour price changes, highs, lows, and volume
- WebSocket-based real-time updates

📊 **Analytics & Insights**
- Total PnL tracking
- Win rate calculations
- Trade statistics (total trades, profitable/losing trades)
- Real-time price trend charts

💼 **Portfolio Management**
- Track your crypto holdings
- Automatic PnL calculations
- Average entry price tracking
- Real-time portfolio valuation

📈 **Market Overview**
- Top gainers and losers
- Highest volume pairs
- Market-wide statistics

🔄 **Trade Management**
- Add buy/sell trades manually
- Automatic portfolio updates
- Complete trade history
- PnL calculation on each trade

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/demetrius2017/Binance_Dashboard.git
cd Binance_Dashboard
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Set up Binance API credentials:
```bash
export BINANCE_API_KEY="your_api_key_here"
export BINANCE_API_SECRET="your_api_secret_here"
```

Note: The dashboard works without API credentials using Binance's public API, but some features may be limited.

## Usage

1. Start the dashboard:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. The dashboard will automatically connect and start displaying real-time price data.

## How to Use

### Adding Trades
1. Fill in the trade form with:
   - Symbol (BTC/USDT, ETH/USDT, etc.)
   - Side (BUY or SELL)
   - Quantity
   - Price
2. Click "Add Trade"
3. Your portfolio and PnL will update automatically

### Monitoring Prices
- Real-time prices update every 2 seconds
- Color-coded changes (green for gains, red for losses)
- View 24h high, low, and volume

### Portfolio Tracking
- View all your holdings
- See real-time PnL for each position
- Track average entry prices

### Market Analysis
- Switch between Top Gainers, Top Losers, and Top Volume tabs
- Discover trending cryptocurrencies
- Monitor market-wide movements

## Configuration

### Environment Variables

- `BINANCE_API_KEY`: Your Binance API key (optional)
- `BINANCE_API_SECRET`: Your Binance API secret (optional)
- `SECRET_KEY`: Flask secret key for sessions (auto-generated if not set)

### Customizing Tracked Symbols

Edit `app.py` and modify the `symbols` list in the `BinanceDataFetcher` class:

```python
self.symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']
```

## Architecture

### Backend (Flask + SocketIO)
- **Flask**: Web server and REST API
- **Flask-SocketIO**: Real-time WebSocket communication
- **python-binance**: Binance API client
- **Threading**: Background data fetching

### Frontend
- **HTML/CSS/JavaScript**: Responsive web interface
- **Socket.IO Client**: Real-time data updates
- **Chart.js**: Interactive price charts

### Data Flow
1. Backend fetches data from Binance API every 2 seconds
2. Data is broadcast to all connected clients via WebSocket
3. Frontend updates UI in real-time
4. User actions (adding trades) update server state and broadcast changes

## API Endpoints

### REST API
- `GET /`: Main dashboard page
- `GET /api/prices`: Get current prices for all symbols
- `GET /api/trades`: Get recent trade history
- `GET /api/portfolio`: Get current portfolio
- `GET /api/analytics`: Get trading analytics
- `POST /api/add_trade`: Add a new trade
- `GET /api/market_overview`: Get market overview data

### WebSocket Events
- `connect`: Client connection established
- `disconnect`: Client disconnected
- `price_update`: Real-time price updates
- `trade_update`: New trade added
- `analytics_update`: Analytics data updated

## Security Notes

⚠️ **Important**: 
- Never commit your API keys to version control
- Use environment variables for sensitive data
- The dashboard is for monitoring and manual tracking only
- Does not execute actual trades on Binance

## Troubleshooting

### Connection Issues
- Ensure port 5000 is not blocked by firewall
- Check if Binance API is accessible from your network

### No Price Updates
- Verify internet connection
- Check Binance API status
- Ensure WebSocket connection is established (green indicator)

### Module Not Found Errors
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.8+)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This dashboard is for informational and educational purposes only. It does not constitute financial advice. Always do your own research before making investment decisions.

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for crypto traders
