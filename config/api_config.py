"""
Конфигурация для работы с Binance API.

Этот модуль содержит специфичные настройки для подключения к Binance API,
включая эндпоинты, лимиты и параметры соединения.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class APIEndpoints:
    """Эндпоинты Binance API."""
    
    # Spot Trading Endpoints
    spot_base_url: str = "https://api.binance.com"
    spot_testnet_url: str = "https://testnet.binance.vision"
    
    # Futures Endpoints
    futures_base_url: str = "https://fapi.binance.com"
    futures_testnet_url: str = "https://testnet.binancefuture.com"
    
    # WebSocket Endpoints
    spot_ws_url: str = "wss://stream.binance.com:9443/ws/"
    futures_ws_url: str = "wss://fstream.binance.com/ws/"
    
    # API Paths
    account_info: str = "/api/v3/account"
    order_book: str = "/api/v3/depth"
    ticker_price: str = "/api/v3/ticker/price"
    new_order: str = "/api/v3/order"
    order_status: str = "/api/v3/order"
    cancel_order: str = "/api/v3/order"
    open_orders: str = "/api/v3/openOrders"
    all_orders: str = "/api/v3/allOrders"
    my_trades: str = "/api/v3/myTrades"
    
    def get_base_url(self, is_testnet: bool = False, is_futures: bool = False) -> str:
        """Возвращает базовый URL в зависимости от настроек."""
        if is_futures:
            return self.futures_testnet_url if is_testnet else self.futures_base_url
        return self.spot_testnet_url if is_testnet else self.spot_base_url


@dataclass
class APILimits:
    """Лимиты Binance API."""
    
    # Rate Limits (requests per minute)
    spot_requests_per_minute: int = 1200
    futures_requests_per_minute: int = 2400
    
    # Order Limits
    max_orders_per_second: int = 10
    max_orders_per_day: int = 200000
    
    # Data Limits
    max_klines_limit: int = 1000
    max_depth_limit: int = 5000
    
    # WebSocket Limits
    max_ws_connections: int = 5
    max_streams_per_connection: int = 1024
    
    # Request Weights
    account_info_weight: int = 10
    new_order_weight: int = 1
    cancel_order_weight: int = 1
    order_book_weight: int = 1


@dataclass 
class APIConfig:
    """Главная конфигурация для Binance API."""
    
    # API Credentials
    api_key: str = ""
    secret_key: str = ""
    
    # Connection Settings
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    
    # SSL Settings
    verify_ssl: bool = True
    ssl_cert_path: Optional[str] = None
    
    # Proxy Settings
    proxy_host: Optional[str] = None
    proxy_port: Optional[int] = None
    proxy_auth: Optional[str] = None
    
    # Trading Settings
    is_testnet: bool = True
    enable_futures: bool = False
    enable_margin: bool = False
    
    # Instance objects
    endpoints: APIEndpoints = field(default_factory=APIEndpoints)
    limits: APILimits = field(default_factory=APILimits)
    
    def get_headers(self) -> Dict[str, str]:
        """Возвращает заголовки для API запросов."""
        return {
            "X-MBX-APIKEY": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "BinanceAdviser/1.0.0"
        }
        
    def get_base_params(self) -> Dict[str, Any]:
        """Возвращает базовые параметры для запросов."""
        return {
            "timestamp": None,  # Будет заполнено во время запроса
            "recvWindow": 5000,
        }
        
    def is_valid(self) -> bool:
        """Проверяет валидность конфигурации API."""
        if not self.api_key or not self.secret_key:
            return False
            
        if len(self.api_key) < 64 or len(self.secret_key) < 64:
            return False
            
        if self.timeout <= 0 or self.max_retries < 0:
            return False
            
        return True
        
    def get_trading_pairs_filters(self) -> Dict[str, Any]:
        """Возвращает фильтры для торговых пар."""
        return {
            "status": "TRADING",
            "permissions": ["SPOT"],
            "quote_assets": ["USDT", "BUSD", "BTC", "ETH"],
            "min_notional": 10.0,  # Минимальная стоимость ордера
            "max_position": 1000000.0,  # Максимальная позиция
        }
        
    def get_order_types(self) -> Dict[str, str]:
        """Возвращает поддерживаемые типы ордеров."""
        return {
            "MARKET": "MARKET",
            "LIMIT": "LIMIT", 
            "STOP_LOSS": "STOP_LOSS",
            "STOP_LOSS_LIMIT": "STOP_LOSS_LIMIT",
            "TAKE_PROFIT": "TAKE_PROFIT",
            "TAKE_PROFIT_LIMIT": "TAKE_PROFIT_LIMIT",
            "LIMIT_MAKER": "LIMIT_MAKER"
        }
        
    def get_time_in_force_options(self) -> Dict[str, str]:
        """Возвращает опции времени действия ордера."""
        return {
            "GTC": "GTC",  # Good Till Cancel
            "IOC": "IOC",  # Immediate or Cancel
            "FOK": "FOK"   # Fill or Kill
        }


# Константы для работы с API
BINANCE_API_VERSION = "v3"
BINANCE_FUTURES_API_VERSION = "v1"

# Поддерживаемые интервалы для свечей
KLINE_INTERVALS = [
    "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h",
    "1d", "3d", "1w", "1M"
]

# Статусы ордеров
ORDER_STATUSES = [
    "NEW", "PARTIALLY_FILLED", "FILLED", "CANCELED", "PENDING_CANCEL",
    "REJECTED", "EXPIRED"
]

# Типы ордеров по направлению
ORDER_SIDES = ["BUY", "SELL"]

# Популярные торговые пары
POPULAR_PAIRS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "DOTUSDT",
    "XRPUSDT", "LTCUSDT", "LINKUSDT", "SOLUSDT", "MATICUSDT"
]