# Quick Reference Guide

## 🚀 Installation

```bash
# One-line setup
git clone https://github.com/demetrius2017/Binance_Dashboard.git && cd Binance_Dashboard && ./setup.sh && ./start.sh
```

## 📝 Common Commands

### Start Dashboard
```bash
./start.sh
# OR
source venv/bin/activate && python app.py
```

### Stop Dashboard
```bash
# Press Ctrl+C in the terminal
# OR find and kill the process
lsof -ti:5000 | xargs kill -9
```

### Run Tests
```bash
source venv/bin/activate
python -m pytest test_app.py -v
```

### Docker Commands
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

## 🔧 Configuration Quick Reference

### Default Trading Pairs (config.py)
```python
DEFAULT_TRADING_PAIRS = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'ADAUSDT',
    'SOLUSDT'
]
```

### Update Intervals (config.py)
```python
MARKET_DATA_UPDATE_INTERVAL = 5   # seconds
ORDERBOOK_UPDATE_INTERVAL = 10     # seconds
```

### Server Settings (config.py)
```python
HOST = '0.0.0.0'  # Listen on all interfaces
PORT = 5000        # Default port
DEBUG = True       # Enable debug mode
```

## 🌐 URLs

- **Dashboard**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/pairs

## 📊 API Quick Reference

### Get All Pairs
```bash
curl http://localhost:5000/api/pairs
```

### Get Market Data
```bash
curl http://localhost:5000/api/market
curl http://localhost:5000/api/market/BTCUSDT
```

### Get Price History
```bash
curl http://localhost:5000/api/history/BTCUSDT
```

### Get Order Book
```bash
curl http://localhost:5000/api/orderbook/BTCUSDT
```

### Add Trading Pair
```bash
curl -X POST http://localhost:5000/api/add_pair \
  -H "Content-Type: application/json" \
  -d '{"symbol":"DOGEUSDT"}'
```

### Remove Trading Pair
```bash
curl -X POST http://localhost:5000/api/remove_pair \
  -H "Content-Type: application/json" \
  -d '{"symbol":"DOGEUSDT"}'
```

## 🐛 Quick Troubleshooting

### Dashboard shows "Disconnected"
```bash
# Restart the server
./start.sh
```

### Port 5000 already in use
```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9
# OR change port in config.py
```

### Module not found error
```bash
# Reinstall dependencies
source venv/bin/activate
pip install -r requirements.txt
```

### Cannot access from another machine
```bash
# Ensure HOST is set to 0.0.0.0 in config.py
# Check firewall allows port 5000
```

## 📦 File Structure Reference

```
Key Files:
- app.py              → Main application
- config.py           → Configuration
- requirements.txt    → Dependencies
- templates/dashboard.html → UI
- static/js/dashboard.js   → Frontend logic
- static/css/style.css     → Styling

Documentation:
- README.md          → Overview
- DEPLOYMENT.md      → Deployment guide
- CONTRIBUTING.md    → Contributing guide
- CHANGELOG.md       → Version history

Scripts:
- setup.sh           → Initial setup
- start.sh           → Start server

Testing:
- test_app.py        → Test suite
```

## 🎨 UI Components Reference

### Summary Cards
- Total Pairs Monitored
- 24h Gainers
- 24h Losers
- Last Update

### Trading Pair Card
- Symbol name
- Current price
- 24h change %
- 24h high/low
- 24h volume
- Trade count

### Charts
- Price History (line chart)
- Volume Comparison (bar chart)

### Order Book
- Top 10 asks (sell orders)
- Top 10 bids (buy orders)

## 💡 Tips

1. **Add pairs you trade**: Click "+ Add Pair" button
2. **Focus on a pair**: Click any trading pair card
3. **Monitor changes**: Watch the summary cards
4. **Check connection**: Look for green indicator
5. **Use Docker**: For production deployment

## 🔗 Useful Links

- Binance API: https://binance-docs.github.io/apidocs/spot/en/
- Flask Docs: https://flask.palletsprojects.com/
- Socket.IO: https://socket.io/docs/
- Chart.js: https://www.chartjs.org/docs/

## 📞 Support

- GitHub Issues: Report bugs or request features
- README.md: General information
- DEPLOYMENT.md: Detailed setup instructions
