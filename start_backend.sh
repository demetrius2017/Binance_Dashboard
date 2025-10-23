#!/bin/bash
cd "$(dirname "$0")"
BINANCE_SYMBOL=${BINANCE_SYMBOL:-BTCUSDT}
export BINANCE_SYMBOL
source venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --log-level info
