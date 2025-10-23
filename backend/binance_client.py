"""Binance connectivity helpers (WebSocket + REST) for the FastAPI backend.

Назначение:
        - `BinanceBookTickerClient`: слушает публичный Futures stream `bookTicker` и
            выдаёт среднюю цену bid/ask плюс отдельные котировки для фронтенда.
        - `BinanceFuturesRestClient`: выполняет подписанные REST-запросы (account,
            positions, trades) и публичные 24h tickers для расчёта equity/метрик.

Контракт:
        - BookTicker: асинхронный итератор событий `{'symbol': str, 'price': float, 'bid': float,
            'ask': float, 'ts': int}`.
        - REST-клиент: асинхронные методы `get_account_overview`, `get_positions`,
            `get_recent_trades`, `get_ticker_24h`. Все возвращают реальные данные Binance
            либо бросают `RuntimeError` при ошибках HTTP/подписи.

Ограничения/Политики:
        - Live-only: запросы к реальному Binance Futures (либо testnet при `BINANCE_TESTNET=true`).
        - Ограничение на частоту запросов соблюдаем через backoff в вызывающем коде.

ENV/Файлы состояния:
        - `BINANCE_API_KEY` / `BINANCE_API_SECRET` — для подписанных запросов.
        - `BINANCE_TESTNET` — если `true`, используем тестовую базу `https://testnet.binancefuture.com`.

Интеграции:
        - websockets==12.* для WS.
        - httpx==0.27.* для REST (с HMAC-SHA256 подписью).
"""

from __future__ import annotations

import asyncio
import hmac
import hashlib
import json
import logging
import time
from typing import AsyncIterator, Dict, Iterable, List, Optional
from urllib.parse import urlencode

import httpx
import websockets

logger = logging.getLogger(__name__)


class BinanceBookTickerClient:
    def __init__(self, symbol: str, reconnect_delay: float = 3.0):
        self.symbol = symbol.lower()
        self.stream_url = f"wss://fstream.binance.com/ws/{self.symbol}@bookTicker"
        self.reconnect_delay = reconnect_delay
        self._stop = asyncio.Event()

    async def stop(self):
        self._stop.set()

    async def run(self) -> AsyncIterator[dict]:
        while not self._stop.is_set():
            try:
                async with websockets.connect(self.stream_url, ping_interval=20, ping_timeout=20) as ws:
                    async for msg in ws:
                        if self._stop.is_set():
                            break
                        try:
                            data = json.loads(msg)
                            s = data.get("s") or data.get("S")
                            b = data.get("b")
                            a = data.get("a")
                            t = data.get("E") or data.get("T") or int(time.time() * 1000)
                            if s is not None and b is not None and a is not None:
                                bid = float(b)
                                ask = float(a)
                                mid = (bid + ask) / 2.0
                                yield {"symbol": s, "price": mid, "bid": bid, "ask": ask, "ts": t}
                        except Exception:
                            continue
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(self.reconnect_delay)


class BinanceFuturesRestClient:
    """Minimal async REST client for Binance Futures signed + public endpoints."""

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        *,
        testnet: bool = False,
        recv_window: int = 5_000,
        timeout: float = 10.0,
    ) -> None:
        base_url = "https://testnet.binancefuture.com" if testnet else "https://fapi.binance.com"
        self._api_key = api_key
        self._api_secret = api_secret.encode()
        self._recv_window = recv_window
        self._client = httpx.AsyncClient(base_url=base_url, timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def get_account_overview(self) -> Dict:
        """Return account wallet balances and equity snapshot."""

        data = await self._signed_request("GET", "/fapi/v2/account")
        return data

    async def get_positions(self, symbols: Optional[Iterable[str]] = None) -> List[Dict]:
        """Return position risk data (mark price, unrealizedPnL etc.)."""

        params = {}
        if symbols:
            # Binance expects single symbol; iterate to stay under weight limits
            results: List[Dict] = []
            for symbol in symbols:
                response = await self._signed_request("GET", "/fapi/v2/positionRisk", {"symbol": symbol})
                if isinstance(response, list):
                    results.extend(response)
            return results
        response = await self._signed_request("GET", "/fapi/v2/positionRisk")
        return response if isinstance(response, list) else []

    async def get_recent_trades(
        self,
        symbol: str,
        *,
        from_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Dict]:
        params = {"symbol": symbol, "limit": limit}
        if from_id is not None:
            params["fromId"] = from_id
        response = await self._signed_request("GET", "/fapi/v1/userTrades", params)
        return response if isinstance(response, list) else []

    async def get_ticker_24h(self, symbols: Iterable[str]) -> List[Dict]:
        """Fetch 24h statistics for provided symbols (public endpoint)."""

        stats: List[Dict] = []
        for symbol in symbols:
            try:
                resp = await self._public_get("/fapi/v1/ticker/24hr", {"symbol": symbol})
                stats.append(resp)
            except RuntimeError:
                logger.exception("Failed to fetch 24h ticker for %s", symbol)
        return stats

    async def get_income_history(
        self,
        *,
        symbol: Optional[str] = None,
        income_type: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        limit: int = 1000,
    ) -> List[Dict]:
        """Return income records (realized PnL, funding, commissions) for the account."""

        params: Dict[str, int | str] = {"limit": limit}
        if symbol:
            params["symbol"] = symbol
        if income_type:
            params["incomeType"] = income_type
        if start_time:
            params["startTime"] = int(start_time)
        if end_time:
            params["endTime"] = int(end_time)

        response = await self._signed_request("GET", "/fapi/v1/income", params)
        return response if isinstance(response, list) else []

    async def _public_get(self, path: str, params: Optional[Dict] = None) -> Dict:
        try:
            response = await self._client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Binance public request failed: {exc}") from exc

    async def _signed_request(self, method: str, path: str, params: Optional[Dict] = None) -> Dict:
        params = params.copy() if params else {}
        params.setdefault("recvWindow", self._recv_window)
        params["timestamp"] = int(time.time() * 1000)
        query = urlencode(params, doseq=True)
        signature = hmac.new(self._api_secret, query.encode(), hashlib.sha256).hexdigest()
        headers = {"X-MBX-APIKEY": self._api_key}

        try:
            response = await self._client.request(
                method,
                path,
                params={**params, "signature": signature},
                headers=headers,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Binance signed request failed: {exc}") from exc

    async def __aenter__(self) -> "BinanceFuturesRestClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.close()
