"""Модуль конфигурации Binance Adviser."""

__version__ = "1.0.0"
__author__ = "Dmitrij Nazarov"

from .settings import Settings
from .api_config import APIConfig

__all__ = ['Settings', 'APIConfig']
