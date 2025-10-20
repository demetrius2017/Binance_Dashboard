# Binance Real-Time Monitoring & Analytics Dashboard 🚀

A comprehensive, real-time monitoring and analytics dashboard for tracking Binance cryptocurrency trading pairs. This dashboard provides live price updates, historical charts, order book visualization, and 24-hour statistics for multiple trading pairs.

![Dashboard Preview](https://img.shields.io/badge/status-active-success.svg)
![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### Real-Time Monitoring
- **Live Price Updates**: WebSocket-based real-time price updates every 5 seconds
- **Multiple Trading Pairs**: Monitor multiple cryptocurrency pairs simultaneously
- **Auto-refresh**: Automatic data refresh with visual connection status indicator

### Analytics & Visualization
- **Price History Charts**: Interactive line charts showing price trends
- **Volume Comparison**: Bar charts comparing 24-hour trading volumes
- **Order Book**: Real-time bid/ask order book visualization
- **24-Hour Statistics**: High/low prices, volume, and trade counts

### User Interface
- **Modern Dark Theme**: Eye-friendly dark mode design inspired by Binance
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Interactive Cards**: Click-to-focus trading pair cards with detailed stats
- **Summary Dashboard**: Quick overview of gainers, losers, and total pairs monitored

### Dynamic Pair Management
- **Add Pairs**: Dynamically add new trading pairs to monitor
- **Remove Pairs**: Remove pairs you no longer want to track
- **Persistent Monitoring**: Continuously updated data for all active pairs

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Internet connection (for Binance API access)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/demetrius2017/Binance_Dashboard.git
cd Binance_Dashboard
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the application**
```bash
python app.py
```

4. **Access the dashboard**
Open your browser and navigate to:
```
http://localhost:5000
```

## 📁 Project Structure

```
Binance_Dashboard/
├── app.py                  # Main Flask application with WebSocket support
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── templates/
│   └── dashboard.html     # Main dashboard HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Dashboard styles
│   └── js/
│       └── dashboard.js  # Dashboard JavaScript logic
└── README.md             # This file
```

## 🔧 Configuration

Edit `config.py` to customize the dashboard:

```python
# Default trading pairs
DEFAULT_TRADING_PAIRS = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'ADAUSDT',
    'SOLUSDT'
]

# Update intervals
MARKET_DATA_UPDATE_INTERVAL = 5  # seconds
ORDERBOOK_UPDATE_INTERVAL = 10   # seconds
```

## 📊 API Endpoints

The dashboard provides several REST API endpoints:

- `GET /` - Main dashboard interface
- `GET /api/pairs` - List of monitored trading pairs
- `GET /api/market` - All market data
- `GET /api/market/<symbol>` - Market data for specific pair
- `GET /api/history/<symbol>` - Price history for specific pair
- `GET /api/orderbook/<symbol>` - Order book for specific pair
- `GET /api/klines/<symbol>` - Candlestick data for specific pair
- `POST /api/add_pair` - Add a new trading pair
- `POST /api/remove_pair` - Remove a trading pair

## 🎯 Usage Examples

### Adding a Trading Pair
1. Click the "+ Add Pair" button
2. Enter the trading pair symbol (e.g., "DOGEUSDT")
3. Click "Add Pair"

### Viewing Detailed Charts
- Click on any trading pair card to view its detailed price history and order book

### Monitoring Multiple Pairs
- The summary cards show real-time statistics across all monitored pairs
- Volume chart compares 24-hour volumes for all pairs

## 🛠️ Technology Stack

### Backend
- **Flask**: Web framework for Python
- **Flask-SocketIO**: WebSocket support for real-time updates
- **Requests**: HTTP library for Binance API calls
- **Flask-CORS**: Cross-Origin Resource Sharing support

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Client-side logic
- **Socket.IO**: WebSocket client library
- **Chart.js**: Interactive charts and visualizations

### Data Source
- **Binance API**: Real-time cryptocurrency market data

## 🔐 Security Notes

- This dashboard uses public Binance API endpoints (no authentication required)
- No trading functionality - monitoring only
- Change the `SECRET_KEY` in `config.py` before deployment
- Consider using environment variables for sensitive configuration

## 🚦 Performance

- **Real-time Updates**: 5-second intervals for market data
- **Efficient Data Management**: Only keeps last 100 price points in memory
- **WebSocket Connections**: Minimal bandwidth usage for live updates
- **Responsive UI**: Optimized for fast rendering and smooth animations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Binance for providing free public API access
- Chart.js for excellent charting library
- Flask and Socket.IO communities

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🔮 Future Enhancements

- [ ] Portfolio tracking with PnL calculations
- [ ] Price alerts and notifications
- [ ] Historical data export
- [ ] Advanced technical indicators
- [ ] Mobile app version
- [ ] Multi-exchange support
- [ ] Trading signals
- [ ] Customizable dashboards

---

**Disclaimer**: This dashboard is for monitoring purposes only. It does not provide trading functionality. Always do your own research before making trading decisions.
