# Quick Start Guide

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/demetrius2017/Binance_Dashboard.git
   cd Binance_Dashboard
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Optional - Configure Binance API:**
   ```bash
   # Copy the example config
   cp config.example.env .env
   
   # Edit .env and add your Binance API credentials
   # BINANCE_API_KEY=your_api_key_here
   # BINANCE_API_SECRET=your_api_secret_here
   ```

   **Note:** The dashboard works without API credentials in demo mode with simulated data.

## Running the Dashboard

Start the application:
```bash
python app.py
```

The dashboard will be available at: **http://localhost:5000**

## Testing the Setup

Run the test script to verify everything is installed correctly:
```bash
python test_setup.py
```

## Using the Dashboard

### 1. Monitor Real-time Prices
- The main dashboard shows live prices for BTC, ETH, BNB, SOL, and XRP
- Prices update every 2-3 seconds automatically
- Green = price up, Red = price down

### 2. Add Trades
- Use the "Add Trade" form to record your trades
- Select symbol, side (BUY/SELL), quantity, and price
- Click "Add Trade" to save

### 3. Track Portfolio
- View your current holdings in the Portfolio section
- See real-time PnL based on current market prices
- Portfolio updates automatically as prices change

### 4. View Analytics
- Total PnL: Your overall profit/loss
- Win Rate: Percentage of profitable trades
- Total Trades: Number of completed trades
- Profitable Trades: Count of winning trades

### 5. Market Overview
- Switch between "Top Gainers", "Top Losers", and "Top Volume"
- Discover trending cryptocurrencies
- Monitor market-wide movements

## Demo Mode

If you see "Connected (Demo Mode)" in the header, the dashboard is running with simulated data. This happens when:
- No Binance API credentials are provided
- The Binance API is not accessible
- You want to test the dashboard without real data

Demo mode provides all features with realistic simulated price movements.

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, you can change it in `app.py`:
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5001)  # Change 5000 to 5001
```

### Module Not Found
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt --upgrade
```

### Connection Issues
- Check if your firewall allows port 5000
- Try accessing via `http://127.0.0.1:5000` instead of `localhost`

## Example Trading Workflow

1. **Buy some BTC:**
   - Symbol: BTC/USDT
   - Side: BUY
   - Quantity: 0.1
   - Price: 90000
   - Click "Add Trade"

2. **Watch your portfolio:**
   - Portfolio now shows 0.1 BTC
   - PnL updates with current price

3. **Sell when profitable:**
   - Symbol: BTC/USDT
   - Side: SELL
   - Quantity: 0.1
   - Price: 95000
   - Click "Add Trade"

4. **View results:**
   - Total PnL: +$500
   - Win Rate: 100%
   - Trade history shows both transactions

## Support

For issues or questions, please open an issue on GitHub:
https://github.com/demetrius2017/Binance_Dashboard/issues

---

Happy Trading! 📈
