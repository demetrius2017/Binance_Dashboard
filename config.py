"""
Configuration file for Binance Dashboard
Customize these settings according to your needs
"""

# Flask Configuration
SECRET_KEY = 'binance-dashboard-secret-key-change-in-production'
DEBUG = True
HOST = '0.0.0.0'
PORT = 5000

# Binance API Configuration
BINANCE_API_BASE = 'https://api.binance.com/api/v3'
BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws'

# Default Trading Pairs to Monitor
DEFAULT_TRADING_PAIRS = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'ADAUSDT',
    'SOLUSDT'
]

# Update Intervals (in seconds)
MARKET_DATA_UPDATE_INTERVAL = 5
ORDERBOOK_UPDATE_INTERVAL = 10

# Chart Configuration
PRICE_HISTORY_LENGTH = 100  # Number of price points to keep in history
CHART_UPDATE_INTERVAL = 5000  # milliseconds

# API Rate Limiting
RATE_LIMIT_ENABLED = False
RATE_LIMIT_PER_MINUTE = 60
