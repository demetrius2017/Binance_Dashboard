# Deployment and Usage Guide

## 🚀 Quick Start Guide

### Local Development

1. **Clone and Navigate**
   ```bash
   git clone https://github.com/demetrius2017/Binance_Dashboard.git
   cd Binance_Dashboard
   ```

2. **Run Setup Script**
   ```bash
   ./setup.sh
   ```

3. **Start Dashboard**
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   source venv/bin/activate
   python app.py
   ```

4. **Access Dashboard**
   Open your browser to: `http://localhost:5000`

### Docker Deployment

1. **Build and Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Or Build Manually**
   ```bash
   docker build -t binance-dashboard .
   docker run -p 5000:5000 binance-dashboard
   ```

## 📖 Using the Dashboard

### Dashboard Features

#### Summary Cards
- **Total Pairs Monitored**: Shows how many trading pairs you're tracking
- **24h Gainers**: Number of pairs with positive price movement
- **24h Losers**: Number of pairs with negative price movement
- **Last Update**: Timestamp of the most recent data refresh

#### Trading Pairs Section
Each trading pair card displays:
- Current price
- 24-hour price change percentage (color-coded: green for gains, red for losses)
- 24-hour high/low prices
- 24-hour trading volume
- Number of trades in the last 24 hours

#### Price History Chart
- Click any trading pair card to view its detailed price history
- Shows real-time price trends with interactive line chart
- Automatically updates as new data arrives

#### Volume Comparison Chart
- Bar chart comparing 24-hour trading volumes across all monitored pairs
- Helps identify the most actively traded pairs

#### Order Book
- Real-time bid and ask orders
- Shows top 10 orders on each side
- Color-coded: green for bids (buy orders), red for asks (sell orders)

### Adding Trading Pairs

1. Click the **"+ Add Pair"** button
2. Enter the trading pair symbol (e.g., `DOGEUSDT`, `XRPUSDT`)
3. Click **"Add Pair"**
4. The new pair will immediately appear in your dashboard

**Valid Symbols**: Use Binance trading pair format (e.g., BTCUSDT, ETHUSDT)

### Removing Trading Pairs

1. Hover over any trading pair card
2. Click the **"×"** button in the top-right corner
3. Confirm the removal
4. The pair will be removed from monitoring

## 🔧 Configuration

### Environment Variables

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit the `.env` file to customize:
- `SECRET_KEY`: Flask secret key (change for production)
- `DEBUG`: Enable/disable debug mode
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 5000)

### Custom Configuration

Edit `config.py` to customize:
- Default trading pairs to monitor
- Update intervals for market data
- Price history length
- API rate limiting

## 🧪 Testing

Run the test suite:
```bash
source venv/bin/activate
python -m pytest test_app.py -v
```

## 🛠️ Troubleshooting

### Connection Issues

**Problem**: Dashboard shows "Disconnected"
- **Solution**: Check that the server is running on port 5000
- Ensure WebSocket connections are allowed (not blocked by firewall)

### No Data Displayed

**Problem**: Trading pairs show no prices
- **Solution**: Check internet connection
- Verify Binance API is accessible
- Wait a few seconds for initial data fetch

### Cannot Add Trading Pair

**Problem**: Error when adding a new pair
- **Solution**: Ensure the symbol is valid (check Binance.com for correct symbols)
- Use uppercase format (e.g., BTCUSDT, not btcusdt)
- Pair must exist on Binance

### Port Already in Use

**Problem**: Error: "Address already in use"
- **Solution**: Change the port in `config.py` or kill the process using port 5000:
  ```bash
  lsof -ti:5000 | xargs kill -9
  ```

## 📊 API Reference

### REST Endpoints

- `GET /` - Dashboard interface
- `GET /api/pairs` - List monitored pairs
- `GET /api/market` - All market data
- `GET /api/market/<symbol>` - Specific pair data
- `GET /api/history/<symbol>` - Price history
- `GET /api/orderbook/<symbol>` - Order book
- `GET /api/klines/<symbol>?interval=1h&limit=24` - Candlestick data
- `POST /api/add_pair` - Add trading pair
- `POST /api/remove_pair` - Remove trading pair

### WebSocket Events

**Client → Server:**
- `connect` - Establish connection
- `subscribe` - Subscribe to specific pair

**Server → Client:**
- `connection_response` - Connection confirmation
- `market_update` - Real-time market data updates

## 🔐 Security Considerations

### For Production Deployment

1. **Change Secret Key**: Update `SECRET_KEY` in `config.py`
2. **Use HTTPS**: Deploy behind a reverse proxy (nginx/Apache) with SSL
3. **Disable Debug Mode**: Set `DEBUG=False` in production
4. **Use Production WSGI Server**: Replace Flask dev server with gunicorn or uWSGI
5. **Environment Variables**: Use environment variables for sensitive config

### Production WSGI Server Example

```bash
pip install gunicorn
gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:5000 app:app
```

## 📈 Performance Tips

1. **Limit Trading Pairs**: Monitor only pairs you actively trade
2. **Adjust Update Intervals**: Increase intervals in `config.py` to reduce API calls
3. **Use Caching**: Implement Redis for caching market data (future enhancement)
4. **Load Balancing**: Use multiple instances behind a load balancer for high traffic

## 🔄 Updating the Dashboard

```bash
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## 📝 Logging

Application logs are output to console. To save logs:
```bash
python app.py > dashboard.log 2>&1 &
```

## 🆘 Getting Help

- Check the [README.md](README.md) for overview
- Review this guide for detailed instructions
- Open an issue on GitHub for bugs or feature requests
- Check Binance API status: https://www.binance.com/en/support/announcement

## 📋 System Requirements

- Python 3.8 or higher
- 512MB RAM minimum (1GB recommended)
- Internet connection for Binance API access
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🌐 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile Support

The dashboard is responsive and works on mobile devices. However, for the best experience, use a desktop or tablet.
