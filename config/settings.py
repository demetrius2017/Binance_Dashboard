"""
Базовые настройки проекта Binance Adviser.

Этот модуль содержит все основные настройки системы, включая параметры торговли,
управления рисками, AI настройки и конфигурацию логирования.
Адаптировано под pydantic v2 и pydantic-settings v2.
"""

from enum import Enum
from typing import Optional, List
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class TradingMode(str, Enum):
    """Режимы торговли."""
    TESTNET = "testnet"
    MAINNET = "mainnet"


class RiskTolerance(str, Enum):
    """Уровни толерантности к риску."""
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class LogLevel(str, Enum):
    """Уровни логирования."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Settings(BaseSettings):
    """Главный класс настроек приложения."""
    
    # ====================
    # BINANCE API SETTINGS
    # ====================
    # Продакшен ключи (mainnet)
    binance_api_key: Optional[str] = Field(
        default=None,
        description="Binance API ключ (mainnet)",
        validation_alias=AliasChoices("BINANCE_API_KEY", "binance_api_key")
    )
    binance_secret_key: Optional[str] = Field(
        default=None,
        description="Binance секретный ключ (mainnet)",
        validation_alias=AliasChoices("BINANCE_SECRET_KEY", "binance_secret_key")
    )

    # Тестовые ключи (spot testnet)
    binance_test_api_key: Optional[str] = Field(
        default=None,
        description="Binance API ключ (testnet)",
        validation_alias=AliasChoices("BINANCE_TEST_API_KEY", "binance_test_api_key")
    )
    binance_test_secret_key: Optional[str] = Field(
        default=None,
        description="Binance секретный ключ (testnet)",
        validation_alias=AliasChoices("BINANCE_TEST_SECRET_KEY", "binance_test_secret_key")
    )
    
    # Base URL (переопределение для futures API)
    binance_base_url: Optional[str] = Field(
        default=None,
        description="Binance Base URL (spot: api.binance.com, futures: fapi.binance.com)",
        validation_alias=AliasChoices("BINANCE_BASE_URL", "binance_base_url")
    )
    
    # ====================
    # TRADING SETTINGS
    # ====================
    trading_mode: TradingMode = Field(
        default=TradingMode.TESTNET,
        description="Режим торговли: testnet или mainnet",
        validation_alias=AliasChoices("TRADING_MODE", "TRADING_MODEL", "trading_mode")
    )
    max_risk_percent: float = Field(
        default=2.0, 
        ge=0.1, 
        le=20.0,
        description="Максимальный риск на сделку (%)"
    )
    default_currency: str = Field(
        default="USDT",
        description="Базовая валюта для операций"
    )
    max_order_size_usdt: float = Field(
        default=1000.0,
        ge=10.0,
        description="Максимальный размер ордера в USDT"
    )
    
    # ====================
    # RISK MANAGEMENT
    # ====================
    stop_loss_percent: float = Field(
        default=5.0,
        ge=1.0,
        le=25.0,
        description="Стоп-лосс в процентах"
    )
    take_profit_percent: float = Field(
        default=10.0,
        ge=2.0,
        le=50.0,
        description="Тейк-профит в процентах"
    )
    risk_tolerance: RiskTolerance = Field(
        default=RiskTolerance.CONSERVATIVE,
        description="Толерантность к риску"
    )
    
    # ====================
    # AI SETTINGS
    # ====================
    market_analysis_interval: int = Field(
        default=300,
        ge=60,
        le=3600,
        description="Интервал анализа рынка (секунды)"
    )
    text_processing_model: str = Field(
        default="gpt-4o",
        description="Модель для обработки текста (gpt-4o, gpt-5, gpt-4o-mini)",
        validation_alias=AliasChoices("TEXT_PROCESSING_MODEL", "text_processing_model")
    )
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API ключ для AI функций",
        validation_alias=AliasChoices("OPENAI_API_KEY", "openai_api_key")
    )
    # Внешние ключи: CoinGlass, TwitterAPI.io
    coinglass_api_key: Optional[str] = Field(
        default=None,
        description="CoinGlass API ключ для метрик (open-api.coinglass.com)",
        validation_alias=AliasChoices("COINGLASS_API_KEY", "coinglass_api_key")
    )
    twitter_api_io_key: Optional[str] = Field(
        default=None,
        description="TwitterAPI.io ключ для доступа к X/Twitter постам (deprecated)",
        validation_alias=AliasChoices("TWITTER_API_IO_KEY", "twitter_api_io_key")
    )
    twitter_bearer_token: Optional[str] = Field(
        default=None,
        description="Twitter API v2 Bearer Token для официального API",
        validation_alias=AliasChoices("TWITTER_BEARER_TOKEN", "twitter_bearer_token")
    )
    apify_api_token: Optional[str] = Field(
        default=None,
        description="Apify API токен для скрейпинга соцсетей",
        validation_alias=AliasChoices("APIFY_API_TOKEN", "apify_api_token")
    )
    # Polygon.io News/Insights
    polygon_api_key: Optional[str] = Field(
        default=None,
        description="Polygon.io API ключ для новостей и инсайтов",
        validation_alias=AliasChoices("POLYGON_API_KEY", "polygon_api_key")
    )
    # Santiment API key (GraphQL)
    santiment_api_key: Optional[str] = Field(
        default=None,
        description="Santiment SanAPI GraphQL ключ (SANTIMENT_API_KEY)",
        validation_alias=AliasChoices("SANTIMENT_API_KEY", "santiment_api_key")
    )
    # Finnhub API key (для S&P500 и других индексов)
    finnhub_api_key: Optional[str] = Field(
        default=None,
        description="Finnhub API ключ для индексов (FINNHUB_API_KEY)",
        validation_alias=AliasChoices("FINNHUB_API_KEY", "finnhub_api_key")
    )
    # Явное сопоставление торговых пар Binance → Santiment slug, например {"SOLUSDT":"solana","BTCUSDT":"bitcoin"}
    pair_slug_map: dict[str, str] = Field(
        default_factory=lambda: {"BTCUSDT": "bitcoin", "ETHUSDT": "ethereum", "SOLUSDT": "solana"},
        description="Сопоставление Binance пары → Santiment slug (используется для Trending Stories)",
        validation_alias=AliasChoices("PAIR_SLUG_MAP", "pair_slug_map")
    )
    # Нормализация целевой серии для Trending Stories: raw|zscore|logz
    stories_norm_mode: str = Field(
        default="zscore",
        description="Нормализация target-серии stories: raw|zscore|logz",
        validation_alias=AliasChoices("STORIES_NORM_MODE", "stories_norm_mode")
    )

    # ====================
    # TREND/STORIES PERFORMANCE CONTROLS
    # ====================
    # Конкуррентность загрузки новостей (общая и специфичная)
    news_concurrency: int = Field(
        default=8,
        ge=1,
        le=64,
        description="Ограничение одновременных запросов новостей (общая)",
        validation_alias=AliasChoices("NEWS_CONCURRENCY", "news_concurrency")
    )
    news_concurrency_heat: int = Field(
        default=8,
        ge=1,
        le=64,
        description="Ограничение одновременных запросов новостей для Trend Heat",
        validation_alias=AliasChoices("NEWS_CONCURRENCY_HEAT", "news_concurrency_heat", "NEWS_CONCURRENCY")
    )
    news_concurrency_stories: int = Field(
        default=6,
        ge=1,
        le=64,
        description="Ограничение одновременных запросов новостей для Trending Stories",
        validation_alias=AliasChoices("NEWS_CONCURRENCY_STORIES", "news_concurrency_stories", "NEWS_CONCURRENCY")
    )

    # Управление GPT: батч‑режимы и конкуррентность/таймауты
    gpt_batch_heat: bool = Field(
        default=False,
        description="Использовать батч‑оценку GPT для Trend Heat",
        validation_alias=AliasChoices("GPT_BATCH_HEAT", "gpt_batch_heat", "GPT_BATCH")
    )
    gpt_batch_stories: bool = Field(
        default=False,
        description="Использовать батч‑оценку GPT для Trending Stories",
        validation_alias=AliasChoices("GPT_BATCH_STORIES", "gpt_batch_stories")
    )
    gpt_concurrency: int = Field(
        default=3,
        ge=1,
        le=32,
        description="Ограничение одновременных GPT‑вызовов (для небатчевых путей)",
        validation_alias=AliasChoices("GPT_CONCURRENCY", "gpt_concurrency")
    )
    no_gpt: bool = Field(
        default=False,
        description="Отключить GPT‑оценку (быстрый режим)",
        validation_alias=AliasChoices("NO_GPT", "no_gpt")
    )
    gpt_timeout_sec: int = Field(
        default=20,
        ge=2,
        le=60,
        description="Таймаут единичного GPT‑вызова (сек)",
        validation_alias=AliasChoices("GPT_TIMEOUT_SEC", "gpt_timeout_sec")
    )
    gpt_budget_sec: int = Field(
        default=40,
        ge=5,
        le=120,
        description="Бюджет на все попытки GPT (сек) для долгих операций",
        validation_alias=AliasChoices("GPT_BUDGET_SEC", "gpt_budget_sec")
    )
    gpt_cache_ttl_minutes: int = Field(
        default=12 * 60,
        ge=5,
        le=7 * 24 * 60,
        description="TTL кэша GPT‑оценок тренд‑элементов (мин)",
        validation_alias=AliasChoices("GPT_CACHE_TTL_MINUTES", "gpt_cache_ttl_minutes")
    )
    gpt_full_snapshot_cache_ttl_minutes: int = Field(
        default=5,
        ge=1,
        le=24 * 60,
        description="TTL кэша полноразмерного GPT‑снапшота (мин)",
        validation_alias=AliasChoices("GPT_FULL_SNAPSHOT_TTL_MINUTES", "gpt_full_snapshot_cache_ttl_minutes")
    )

    # Управление объёмом/выводом
    gpt_full_max_tokens: int = Field(
        default=1200,
        ge=256,
        le=4000,
        description="Максимум токенов для ответа full_snapshot (chat.completions)",
        validation_alias=AliasChoices("GPT_FULL_MAX_TOKENS", "gpt_full_max_tokens")
    )
    ai_score_target_scale: int = Field(
        default=30,
        ge=1,
        le=100,
        description="Целевая шкала отображения AI‑оценки в Telegram (например, 30 → диапазон −30..+30)",
        validation_alias=AliasChoices("AI_SCORE_TARGET_SCALE", "ai_score_target_scale")
    )
    decision_brief_max_chars: int = Field(
        default=4050,
        ge=200,
        le=4096,
        description="Максимальная длина Decision Brief для Telegram (символов; лимит ~4096)",
        validation_alias=AliasChoices("DECISION_BRIEF_MAX_CHARS", "decision_brief_max_chars")
    )
    decision_brief_max_words: int = Field(
        default=90,
        ge=50,
        le=450,
        description="Максимальная длина Decision Brief для Telegram (слов)",
        validation_alias=AliasChoices("DECISION_BRIEF_MAX_WORDS", "decision_brief_max_words")
    )

    # ====================
    # DECISION ENGINE (Stress Memory / Echo / A-B-C-D)
    # ====================
    decision_enable: bool = Field(
        default=False,
        description="Включить Decision Engine (историческая память, эхо-фильтр, категории A/B/C/D)",
        validation_alias=AliasChoices("DECISION_ENABLE", "decision_enable")
    )
    decay_mode: str = Field(
        default="onread",
        description="Режим затухания очков: onread|cron",
        validation_alias=AliasChoices("DECAY_MODE", "decay_mode")
    )
    echo_embed_tau: float = Field(
        default=0.84,
        ge=0.0,
        le=1.0,
        description="Порог близости эмбеддингов для 'эхо' (0..1)",
        validation_alias=AliasChoices("ECHO_EMBED_TAU", "echo_embed_tau")
    )
    promote_min_score: int = Field(
        default=18,
        ge=0,
        le=30,
        description="Минимальный балл для промоушена событий в категорию A",
        validation_alias=AliasChoices("PROMOTE_MIN_SCORE", "promote_min_score")
    )
    promote_allow_sources: list[str] = Field(
        default_factory=list,
        description="Белый список источников для промоушена (запятая-разделённые в ENV)",
        validation_alias=AliasChoices("PROMOTE_ALLOW_SOURCES", "promote_allow_sources")
    )
    promote_deny_sources: list[str] = Field(
        default_factory=list,
        description="Чёрный список источников для промоушена (запятая-разделённые в ENV)",
        validation_alias=AliasChoices("PROMOTE_DENY_SOURCES", "promote_deny_sources")
    )
    echo_gpt_timeout_sec: int = Field(
        default=8,
        ge=1,
        le=60,
        description="Таймаут GPT-классификатора эхо (сек)",
        validation_alias=AliasChoices("ECHO_GPT_TIMEOUT_SEC", "echo_gpt_timeout_sec")
    )
    echo_gpt_max_batch: int = Field(
        default=8,
        ge=1,
        le=64,
        description="Максимальный размер батча для GPT-классификатора эхо",
        validation_alias=AliasChoices("ECHO_GPT_MAX_BATCH", "echo_gpt_max_batch")
    )
    stress_db_url: Optional[str] = Field(
        default=None,
        description="URL БД для Stress Memory (если не задан, используется database_url)",
        validation_alias=AliasChoices("STRESS_DB_URL", "stress_db_url")
    )
    
    # Настройки оптимизации стоимости Apify
    apify_use_persistent_actors: bool = Field(
        default=True,
        description="Использовать persistent Actor'ы для экономии (в 80+ раз дешевле)",
        validation_alias=AliasChoices("APIFY_USE_PERSISTENT_ACTORS", "apify_use_persistent_actors")
    )
    apify_max_run_hours: int = Field(
        default=8,
        ge=1,
        le=24,
        description="Максимальное время работы persistent Actor (часы)",
        validation_alias=AliasChoices("APIFY_MAX_RUN_HOURS", "apify_max_run_hours")
    )
    apify_memory_mb: int = Field(
        default=256,
        ge=128,
        le=32768,
        description="Объем памяти для Apify Actor (MB, меньше = дешевле)",
        validation_alias=AliasChoices("APIFY_MEMORY_MB", "apify_memory_mb")
    )
    
    # GPT gating для входа
    gpt_required: bool = Field(
        default=True,
        description="Требовать положительный GPT-вердикт для входа",
        validation_alias=AliasChoices("GPT_REQUIRED", "gpt_required")
    )
    gpt_strong_neg_max: int = Field(
        default=0,
        ge=0,
        le=10,
        description="Допустимое число сильных негативов в GPT-метриках",
        validation_alias=AliasChoices("GPT_STRONG_NEG_MAX", "gpt_strong_neg_max")
    )
    
    # ====================
    # API LIMITS
    # ====================
    api_calls_per_minute: int = Field(
        default=1200,
        ge=100,
        le=2400,
        description="Лимит API вызовов в минуту"
    )
    order_timeout: int = Field(
        default=30,
        ge=5,
        le=300,
        description="Таймаут исполнения ордера (секунды)"
    )
    
    # ====================
    # LOGGING SETTINGS
    # ====================
    log_level: LogLevel = Field(
        default=LogLevel.INFO,
        description="Уровень логирования"
    )
    log_to_file: bool = Field(
        default=True,
        description="Записывать логи в файл"
    )
    log_to_console: bool = Field(
        default=True,
        description="Выводить логи в консоль"
    )
    
    # ====================
    # NOTIFICATIONS
    # ====================
    telegram_bot_token: Optional[str] = Field(
        default=None,
        description="Токен Telegram бота"
    )
    telegram_chat_id: Optional[str] = Field(
        default=None,
        description="ID чата для Telegram уведомлений"
    )
    
    # Интервал мониторинга оптимизирован для торговли с учётом Twitter API Essential лимитов
    monitoring_interval_seconds: int = Field(
        default=180,  # 3 минуты - баланс скорости реагирования и API лимитов (50% использования)
        description="Интервал проверки сигналов в секундах (баланс скорости торговли и API лимитов)"
    )

    # ТРИГГЕР ПО ДВИЖЕНИЮ ЦЕНЫ (экономия лимитов):
    trigger_symbol: str = Field(
        default="SOLUSDT",
        description="Символ для мониторинга 5-минутного движения"
    )
    price_move_interval_minutes: int = Field(
        default=5,
        ge=1,
        le=60,
        description="Окно анализа движения цены (минуты)"
    )
    price_move_trigger_percent: float = Field(
        default=1.0,
        ge=0.1,
        le=10.0,
        description="Порог сильного движения за окно (%) для запуска сбора источников"
    )
    trigger_cooldown_seconds: int = Field(
        default=120,
        ge=0,
        le=3600,
        description="Минимальная пауза между срабатываниями триггера (секунды)"
    )
    price_check_interval_seconds: int = Field(
        default=60,
        ge=1,
        le=300,
        description="Интервал проверки цены для триггера (секунды)"
    )
    # Новый основной триггер: рост за L минут на 1m close
    growth_lookback_minutes: int = Field(
        default=2,
        ge=1,
        le=30,
        description="Окно L для роста на 1m закрытиях (минуты)",
        validation_alias=AliasChoices("GROWTH_LOOKBACK_MINUTES", "growth_lookback_minutes")
    )
    growth_enter_threshold: float = Field(
        default=0.011,
        ge=0.0001,
        le=0.1,
        description="Порог входа по росту за L минут (доля, например 0.011 = 1.1%)",
        validation_alias=AliasChoices("GROWTH_ENTER_THR", "growth_enter_threshold")
    )
    
    discord_webhook: Optional[str] = Field(
        default=None,
        description="Discord webhook для уведомлений"
    )
    # Внешний сервер уведомлений (совместим с примерами /link-telegram и /send-notification)
    notification_server_url: Optional[str] = Field(
        default=None,
        description="Базовый URL notification-сервера (например, http://localhost:3000)",
        validation_alias=AliasChoices("NOTIFICATION_SERVER", "notification_server_url")
    )
    
    # ====================
    # DATABASE SETTINGS
    # ====================
    database_url: str = Field(
        default="sqlite:///./binance_adviser.db",
        description="URL базы данных"
    )
    
    # ====================
    # ADVANCED TRADING
    # ====================
    enable_futures: bool = Field(
        default=False,
        description="Включить торговлю фьючерсами"
    )
    enable_margin: bool = Field(
        default=False,
        description="Включить маржинальную торговлю"
    )
    leverage: int = Field(
        default=1,
        ge=1,
        le=10,
        description="Плечо для маржинальной торговли"
    )
    
    # ====================
    # MONITORING
    # ====================
    enable_performance_monitoring: bool = Field(
        default=True,
        description="Включить мониторинг производительности"
    )
    save_trade_history: bool = Field(
        default=True,
        description="Сохранять историю торгов"
    )
    max_log_files: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Максимальное количество лог файлов"
    )
    
    # Конфигурация pydantic-settings v2
    model_config = SettingsConfigDict(
        env_file=("copilot-runner/.env.production", ".env.production"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        validate_assignment=True,
        extra="ignore",
    )
        
    def get_binance_base_url(self) -> str:
        """Возвращает базовый URL для Binance API в зависимости от режима.
        
        Приоритет:
        1. Если BINANCE_BASE_URL установлен в env → используем его (для futures/spot)
        2. Иначе: testnet → testnet.binance.vision
        3. Иначе: mainnet → api.binance.com (spot)
        """
        # Приоритет 1: явно указанный BASE_URL (для futures или custom endpoints)
        if self.binance_base_url:
            return self.binance_base_url
        
        # Приоритет 2: автовыбор по режиму
        if self.trading_mode == TradingMode.TESTNET:
            return "https://testnet.binance.vision"
        return "https://api.binance.com"
        
    def is_production_mode(self) -> bool:
        """Проверяет, запущен ли бот в продакшен режиме."""
        return self.trading_mode == TradingMode.MAINNET

    def get_effective_api_keys(self) -> tuple[Optional[str], Optional[str]]:
        """Возвращает пару (api_key, secret_key) в зависимости от режима торговли."""
        if self.trading_mode == TradingMode.TESTNET:
            return self.binance_test_api_key, self.binance_test_secret_key
        return self.binance_api_key, self.binance_secret_key
        
    def get_supported_currencies(self) -> List[str]:
        """Возвращает список поддерживаемых валют."""
        return ["USDT", "BUSD", "BTC", "ETH", "BNB"]
        
    def validate_api_keys(self) -> bool:
        """Проверяет наличие и формат API ключей."""
        api_key, secret_key = self.get_effective_api_keys()
        if not api_key or not secret_key:
            return False
        
        # Базовая проверка формата ключей
        if len(api_key) < 32 or len(secret_key) < 32:
            return False
            
        return True


# Глобальный экземпляр настроек
settings = Settings()