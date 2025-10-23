# Session Log — Backend WS Integration (2025-10-21)

## Scope
- Removed mock equity/metric generators on the frontend; now hydrates purely from live WebSocket payloads.
- Refined Zustand store to rely on backend-calculated PnL/equity, deduplicate equity stream points, and purge closed positions.
- Extended WebSocket types + client handling for bid/ask propagation, balance/unrealized PnL tracking, and ticker/account snapshots.
- Updated FastAPI broadcaster to include bid/ask in `price_update`, balance/unrealized PnL в `equity_snapshot`, а метрики (win rate, profit factor, sharpe, drawdown) теперь вычисляются из Binance REST `userTrades` при каждом опросе.

## Outstanding
- Need integration test with real Binance keys to verify REST pollers (`get_account_overview`, positions, trades) and price stream reconnection.
- Проверить рассчитанные на backend метрики (win rate, profit factor, sharpe, drawdown) на живых данных Binance; возможны расхождения из-за лимита 500 REST-сделок и разных режимов маржи.
- No historical equity backfill endpoint yet; chart starts with first live point.
- Dependency check flagged missing modules (`fastapi`, `uvicorn`, `httpx`, `websockets`) in local venv — install before runtime test.

## Testing
- Automated tests not executed (no test suite provided).
- `scripts/main.py` smoke test not run — file absent in repository; requires clarification or implementation before compliance.
