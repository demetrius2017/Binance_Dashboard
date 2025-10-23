"""FastAPI backend orchestrating Binance data streaming for the dashboard.

Назначение:
        - WebSocket `/ws`: публикует live события `price_update`, `heartbeat`,
            `account_snapshot`, `metrics_snapshot`, `ticker_snapshot`, `position_update`,
                        `trade_executed`, `trades_snapshot`, `equity_snapshot` (содержит баланс и unrealized PnL, а цена — bid/ask).
        - REST-фоны: периодически опрашивают Binance Futures API для расчёта equity,
            метрик (win-rate, sharpe, profit factor по последним сделкам, нормализованных
            относительно базового equity при запуске), тикеров, позиций и pnl24h (по
            `/fapi/v1/income` за последние 24 часа).

Контракт:
    - WS сообщения соответствуют типам, описанным в `frontend/src/types/index.ts`.
    - Периодичность: `price_update` до 60/s; `heartbeat` каждые 5s; прочие
      снапшоты — 5–10s.
    - Ошибки: при сетевых сбоях перезапускаем фоновые задачи и логируем.

CLI/Примеры:
    `BINANCE_SYMBOL=BTCUSDT uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`

Ограничения/Политики:
    - Live-only: реальные данные Binance Futures (или testnet при `BINANCE_TESTNET=true`).
    - Не совмещаем публичный и приватный ключи с моками; при отсутствии ключей
      выдаём предупреждения и отправляем только price/heartbeat.
    - Без `BINANCE_API_KEY`/`BINANCE_API_SECRET` отключаются REST-пулы (account, ticker, trades).

ENV/Файлы состояния:
    - `BINANCE_SYMBOL` — пара Binance Futures (default `BTCUSDT`).
    - `BINANCE_API_KEY` / `BINANCE_API_SECRET` — для подписанных запросов.
    - `BINANCE_TESTNET` — переключение на тестовую среду.

Интеграции:
    - `BinanceBookTickerClient` и `BinanceFuturesRestClient` из `backend.binance_client`.
    - `python-dotenv` подхватывает `.env` до чтения переменных окружения.
    - async фоновые таски: ценовой стрим, heartbeat, REST-полы.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional, Set

from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .binance_client import BinanceBookTickerClient, BinanceFuturesRestClient
from .metrics import compute_metrics

# Robustly load .env from current working directory or project root
_dotenv_path = find_dotenv(usecwd=True)
if _dotenv_path:
    load_dotenv(_dotenv_path)
else:
    load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logger = logging.getLogger(__name__)


class Hub:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def add(self, ws: WebSocket):
        async with self._lock:
            self.clients.add(ws)

    async def remove(self, ws: WebSocket):
        async with self._lock:
            self.clients.discard(ws)

    async def broadcast(self, message: dict):
        data = json.dumps(message)
        async with self._lock:
            to_remove = []
            for ws in self.clients:
                try:
                    await ws.send_text(data)
                except Exception:
                    to_remove.append(ws)
            for ws in to_remove:
                self.clients.discard(ws)


hub = Hub()
STREAM_SYMBOL = os.getenv("BINANCE_SYMBOL", "BTCUSDT").upper()
API_KEY = os.getenv("BINANCE_API_KEY")
API_SECRET = os.getenv("BINANCE_API_SECRET")
USE_TESTNET = os.getenv("BINANCE_TESTNET", "false").lower() == "true"


BASELINE_EQUITY: Optional[float] = None
INCOME_TYPES_24H = {"REALIZED_PNL", "FUNDING_FEE", "COMMISSION", "INSURANCE_CLEAR"}


def _to_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _rest_client_factory() -> Optional[BinanceFuturesRestClient]:
    if not API_KEY or not API_SECRET:
        return None
    return BinanceFuturesRestClient(API_KEY, API_SECRET, testnet=USE_TESTNET)


def _normalize_symbol(raw: str) -> str:
    raw = raw.upper()
    if raw.endswith("USDT"):
        return raw[:-4]
    return raw


def _isoformat(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def _format_trade(symbol: str, trade: dict) -> dict:
    trade_id_raw = trade.get("id") or trade.get("tradeId")
    if trade_id_raw is None:
        raise ValueError("Trade id missing")
    trade_id = int(trade_id_raw)
    price = _to_float(trade.get("price"))
    quantity = _to_float(trade.get("qty"), _to_float(trade.get("quantity")))
    quote_qty = _to_float(trade.get("quoteQty"), price * quantity)
    realized_pnl = _to_float(trade.get("realizedPnl"))
    commission = _to_float(trade.get("commission"))
    side_raw = (trade.get("side") or "BUY").upper()
    side = "LONG" if side_raw == "BUY" else "SHORT"
    ts = int(_to_float(trade.get("time"), time.time())) // 1000

    payload = {
        "id": trade_id,
        "model": "maker" if trade.get("maker", False) else "taker",
        "side": side,
        "symbol": _normalize_symbol(symbol),
        "entryPrice": price,
        "exitPrice": price,
        "quantity": quantity,
        "entryTime": _isoformat(ts),
        "exitTime": _isoformat(ts),
        "holdingTime": "0s",
        "notional": f"{quote_qty:.2f} USDT",
        "pnlNet": realized_pnl,
        "pnlPercent": (realized_pnl / quote_qty * 100) if quote_qty else 0,
        "commission": commission,
    }
    return payload


async def binance_pump(symbol: str):
    client = BinanceBookTickerClient(symbol)
    try:
        async for event in client.run():
            payload = {
                "type": "price_update",
                "symbol": event["symbol"],
                "price": event["price"],
                "ts": event["ts"] // 1000,
            }
            if "bid" in event:
                payload["bid"] = event["bid"]
            if "ask" in event:
                payload["ask"] = event["ask"]
            await hub.broadcast(payload)
    except asyncio.CancelledError:
        await client.stop()
        raise
    finally:
        await client.stop()


async def account_polling_loop(symbol: str, interval: float = 5.0):
    client = _rest_client_factory()
    if client is None:
        logger.warning("Binance API credentials absent; account snapshots disabled")
        return

    last_metrics_ts = 0
    last_ticker_ts = 0
    last_income_ts = 0
    cached_pnl24h = 0.0

    try:
        while True:
            now = time.time()
            positions_symbols = {symbol.upper()}

            # Account snapshot + positions
            try:
                account = await client.get_account_overview()
                positions = await client.get_positions()
            except Exception as exc:  # noqa: broad-except (логируем и продолжаем)
                logger.warning("Account polling error: %s", exc)
                await asyncio.sleep(interval)
                continue

            wallet_balance = _to_float(account.get("totalWalletBalance"))
            available = _to_float(account.get("availableBalance"), _to_float(account.get("totalAvailableBalance")))
            total_unrealized = _to_float(account.get("totalUnrealizedProfit"), _to_float(account.get("totalCrossUnPnl")))
            initial_margin = _to_float(account.get("totalInitialMargin"))
            margin_balance = _to_float(account.get("totalMarginBalance"), wallet_balance)

            margin_ratio = (initial_margin / margin_balance * 100) if margin_balance else 0.0
            leverage = (margin_balance / initial_margin) if initial_margin else 0.0
            income_interval = 60
            if now - last_income_ts >= income_interval:
                last_income_ts = now
                start_window = int((now - 86_400) * 1000)
                try:
                    income_records = await client.get_income_history(
                        symbol=symbol.upper(),
                        start_time=start_window,
                        end_time=int(now * 1000),
                        limit=1000,
                    )
                except Exception as exc:  # noqa: broad-except
                    logger.warning("Income history fetch error: %s", exc)
                else:
                    pnl_sum = 0.0
                    for record in income_records:
                        try:
                            income_type = (record.get("incomeType") or "").upper()
                            if income_type and income_type not in INCOME_TYPES_24H:
                                continue
                            ts_raw = record.get("time") or record.get("updateTime")
                            if ts_raw is None:
                                continue
                            ts_ms = int(ts_raw)
                            if ts_ms < start_window:
                                continue
                            pnl_sum += _to_float(record.get("income"))
                        except (TypeError, ValueError):
                            continue
                    cached_pnl24h = pnl_sum

            pnl_24h = cached_pnl24h

            equity = wallet_balance + total_unrealized
            global BASELINE_EQUITY
            if BASELINE_EQUITY is None:
                BASELINE_EQUITY = equity

            await hub.broadcast({
                "type": "account_snapshot",
                "account": {
                    "balance": wallet_balance,
                    "availableBalance": available,
                    "marginRatio": margin_ratio,
                    "leverage": leverage,
                    "pnl24h": pnl_24h,
                },
                "ts": int(now),
            })

            unrealized_total = 0.0
            for pos in positions or []:
                symbol_u = pos.get("symbol", "")
                if not symbol_u:
                    continue
                positions_symbols.add(symbol_u)
                raw_qty = _to_float(pos.get("positionAmt"))
                quantity = abs(raw_qty)
                mark_price = _to_float(pos.get("markPrice"), _to_float(pos.get("entryPrice")))
                entry_price = _to_float(pos.get("entryPrice"))
                unrealized_pnl = _to_float(pos.get("unRealizedProfit"))
                unrealized_percent = _to_float(pos.get("marginRatio")) * 100
                notional = mark_price * quantity

                if quantity == 0:
                    notional = 0.0
                    unrealized_pnl = 0.0
                    unrealized_percent = 0.0
                else:
                    direction = 1 if raw_qty >= 0 else -1
                    if unrealized_percent == 0 and entry_price:
                        price_diff = (mark_price - entry_price) * direction
                        unrealized_percent = (price_diff / entry_price) * 100

                position_payload = {
                    "id": f"{symbol_u}-{pos.get('positionSide', 'BOTH')}",
                    "symbol": _normalize_symbol(symbol_u),
                    "side": "LONG" if raw_qty >= 0 else "SHORT",
                    "entryPrice": entry_price,
                    "currentPrice": mark_price,
                    "quantity": quantity,
                    "unrealizedPnl": unrealized_pnl,
                    "unrealizedPnlPercent": unrealized_percent,
                    "notional": notional,
                }
                if quantity > 0:
                    unrealized_total += position_payload["unrealizedPnl"]
                await hub.broadcast({"type": "position_update", "position": position_payload})

            await hub.broadcast({
                "type": "equity_snapshot",
                "time": int(now),
                "equity": equity,
                "balance": wallet_balance,
                "unrealizedPnl": unrealized_total,
            })

            # Metrics snapshot (reuse account totals)
            metrics_interval = 5
            if now - last_metrics_ts >= metrics_interval:
                last_metrics_ts = now
                try:
                    recent_trades = await client.get_recent_trades(symbol.upper(), limit=500)
                except Exception as exc:  # noqa: broad-except
                    logger.warning("Metrics trade fetch error: %s", exc)
                    recent_trades = []

                metrics_payload = compute_metrics(
                    recent_trades,
                    equity=equity,
                    baseline_equity=BASELINE_EQUITY,
                    unrealized_total=unrealized_total,
                )

                total_pnl = cached_pnl24h + unrealized_total
                reference_equity = wallet_balance - cached_pnl24h
                if reference_equity <= 0:
                    reference_equity = wallet_balance or equity or 1.0

                metrics_payload.update({
                    "realizedPnL": cached_pnl24h,
                    "unrealizedPnL": unrealized_total,
                    "totalPnL": total_pnl,
                    "totalPnLPercent": (total_pnl / reference_equity * 100) if reference_equity else 0.0,
                })
                await hub.broadcast({
                    "type": "metrics_snapshot",
                    "metrics": metrics_payload,
                    "ts": int(now),
                })

            # Ticker snapshot
            ticker_interval = 10
            if now - last_ticker_ts >= ticker_interval:
                last_ticker_ts = now
                tickers = await client.get_ticker_24h(positions_symbols or {symbol})
                payload = []
                for item in tickers:
                    sym = item.get("symbol", "")
                    if not sym:
                        continue
                    payload.append({
                        "symbol": _normalize_symbol(sym),
                        "price": float(item.get("lastPrice", 0)),
                        "change24h": float(item.get("priceChangePercent", 0)),
                    })
                if payload:
                    await hub.broadcast({"type": "ticker_snapshot", "tickers": payload, "ts": int(now)})

            await asyncio.sleep(interval)
    finally:
        if client:
            await client.close()


async def trades_polling_loop(symbol: str, interval: float = 5.0):
    client = _rest_client_factory()
    if client is None:
        logger.warning("Binance API credentials absent; trade snapshots disabled")
        return

    symbol = symbol.upper()
    last_trade_id: Optional[int] = None
    snapshot_sent = False

    try:
        while True:
            try:
                trades = await client.get_recent_trades(symbol, limit=50)
            except Exception as exc:  # noqa: broad-except
                logger.warning("Trade polling error: %s", exc)
                await asyncio.sleep(interval)
                continue

            if not trades:
                await asyncio.sleep(interval)
                continue

            ordered = sorted(trades, key=lambda t: int(t.get("id") or t.get("tradeId") or 0))
            if last_trade_id is None and ordered:
                last_trade_id = int(ordered[-1].get("id") or ordered[-1].get("tradeId") or 0)
                if not snapshot_sent:
                    snapshot_trades = []
                    for trade in ordered[-100:]:
                        try:
                            snapshot_trades.append(_format_trade(symbol, trade))
                        except ValueError:
                            continue
                    if snapshot_trades:
                        await hub.broadcast({
                            "type": "trades_snapshot",
                            "trades": list(reversed(snapshot_trades)),
                            "ts": int(time.time()),
                        })
                        snapshot_sent = True
                await asyncio.sleep(interval)
                continue

            for trade in ordered:
                trade_id_raw = trade.get("id") or trade.get("tradeId")
                if trade_id_raw is None:
                    continue
                trade_id = int(trade_id_raw)
                if last_trade_id is not None and trade_id <= last_trade_id:
                    continue

                try:
                    payload = _format_trade(symbol, trade)
                except ValueError:
                    continue
                await hub.broadcast({"type": "trade_executed", "trade": payload})
                last_trade_id = trade_id

            await asyncio.sleep(interval)
    finally:
        if client:
            await client.close()


async def heartbeat_pump():
    while True:
        await hub.broadcast({"type": "heartbeat", "ts": int(time.time())})
        await asyncio.sleep(5)


_background_tasks: Set[asyncio.Task] = set()


@app.on_event("startup")
async def on_startup():
    # Re-read credentials at startup to avoid stale module-level env
    global API_KEY, API_SECRET
    API_KEY = os.getenv("BINANCE_API_KEY")
    API_SECRET = os.getenv("BINANCE_API_SECRET")

    # Запускаем фоновые задачи и сохраняем ссылки
    task1 = asyncio.create_task(binance_pump(STREAM_SYMBOL))
    task2 = asyncio.create_task(heartbeat_pump())
    _background_tasks.add(task1)
    _background_tasks.add(task2)
    task1.add_done_callback(_background_tasks.discard)
    task2.add_done_callback(_background_tasks.discard)

    if API_KEY and API_SECRET:
        account_task = asyncio.create_task(account_polling_loop(STREAM_SYMBOL))
        trades_task = asyncio.create_task(trades_polling_loop(STREAM_SYMBOL))
        for task in (account_task, trades_task):
            _background_tasks.add(task)
            task.add_done_callback(_background_tasks.discard)
    else:
        logger.warning(
            "Binance API credentials are not configured; account, ticker and trade streams are disabled"
        )
        logger.warning("ENV check BINANCE_API_KEY=%s BINANCE_API_SECRET=%s", bool(API_KEY), bool(API_SECRET))


@app.on_event("shutdown")
async def on_shutdown():
    for task in list(_background_tasks):
        task.cancel()
    if _background_tasks:
        await asyncio.gather(*_background_tasks, return_exceptions=True)
    _background_tasks.clear()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    await hub.add(websocket)
    try:
        while True:
            # Поддерживаем соединение живым, входящие сообщения не требуются
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        pass
    finally:
        await hub.remove(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
