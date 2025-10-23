# Backend (FastAPI) — WebSocket Bridge

Минимальный сервер FastAPI, ретранслирующий публичные котировки Binance Futures (bookTicker) в формат фронтенда.

## Запуск локально

```bash
# 1) создать и активировать venv (опционально)
python3 -m venv venv
source venv/bin/activate

# 2) установить зависимости
pip install -r backend/requirements.txt

# 3) старт сервера
BINANCE_SYMBOL=BTCUSDT uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

WebSocket: ws://localhost:8000/ws

## Примечания
- По умолчанию стримит `BTCUSDT`; изменить пару можно через переменную окружения `BINANCE_SYMBOL`.
- Сообщения:
  - price_update { type, symbol, price, ts }
  - heartbeat { type, ts }
- Расширение (позиции/сделки) добавим в следующих итерациях.