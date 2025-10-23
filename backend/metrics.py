"""Portfolio metrics utilities for the Binance dashboard backend.

Назначение:
        - Нормализует сделки Binance Futures (`userTrades`) и рассчитывает агрегированные
            показатели производительности (win rate, Sharpe, profit factor, drawdown),
            отфильтровывая микро-сделки (комиссии/частичные fill'ы) в отдельную категорию `flat`.
    - Используется `backend.main` при формировании событий `metrics_snapshot`.

Контракт:
    - `compute_metrics(trades, equity, baseline_equity, unrealized_total)` возвращает
      словарь метрик с ключами, ожидаемыми фронтендом.
    - Функция устойчиво обрабатывает пропуски полей и некорректные значения,
      пропуская нечитаемые сделки вместо выброса исключений.

CLI/Примеры:
    Не предоставляет CLI; модуль подключается из FastAPI сервиса.

Ограничения/Политики:
    - Live-only: работает только с реальными сделками Binance, не создаёт мок-данные.
    - Считает метрики по последним N сделкам, переданным вызывающей стороной.

ENV/Файлы состояния:
    - Использует только данные, переданные в параметрах; состояние окружения не читает.

Интеграции:
    - Не выполняет HTTP/WS запросов, оперирует чисто Python-логикой.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from statistics import mean, pstdev
from typing import Iterable, List, Sequence


@dataclass(frozen=True)
class TradeSample:
    pnl: float
    quote_volume: float
    timestamp: int


def _normalize_user_trades(trades: Iterable[dict]) -> List[TradeSample]:
    """Convert raw Binance userTrades payloads into typed trade samples."""

    samples: List[TradeSample] = []
    for raw in trades:
        try:
            pnl_raw = raw.get("realizedPnl")
            if pnl_raw is None:
                pnl_raw = raw.get("realizedProfit")
            if pnl_raw is None:
                continue
            pnl = float(pnl_raw)

            quote_raw = raw.get("quoteQty")
            if quote_raw is None:
                price_raw = raw.get("price")
                qty_raw = raw.get("qty") or raw.get("quantity")
                if price_raw is None or qty_raw is None:
                    quote_volume = 0.0
                else:
                    quote_volume = float(price_raw) * float(qty_raw)
            else:
                quote_volume = float(quote_raw)

            timestamp_raw = raw.get("time") or raw.get("updateTime")
            if timestamp_raw is None:
                continue
            timestamp = int(int(timestamp_raw) // 1000)
        except (TypeError, ValueError):
            continue

        if not math.isfinite(pnl) or not math.isfinite(quote_volume):
            continue

        samples.append(TradeSample(pnl=pnl, quote_volume=abs(quote_volume), timestamp=timestamp))
    return samples


def _calculate_drawdown(samples: Sequence[TradeSample]) -> float:
    if not samples:
        return 0.0

    cumulative = 0.0
    peak = 0.0
    max_drawdown = 0.0

    for sample in sorted(samples, key=lambda s: s.timestamp):
        cumulative += sample.pnl
        peak = max(peak, cumulative)
        drawdown = cumulative - peak
        if drawdown < max_drawdown:
            max_drawdown = drawdown

    if peak <= 0:
        return 0.0
    return (max_drawdown / peak) * 100


def compute_metrics(
    trades: Sequence[dict],
    *,
    equity: float,
    baseline_equity: float | None,
    unrealized_total: float,
) -> dict:
    """Return metrics expected by the frontend given recent user trades."""

    samples = _normalize_user_trades(trades)

    filtered_wins: List[float] = []
    filtered_losses: List[float] = []
    flat_trades = 0

    for sample in samples:
        dynamic_threshold = max(0.05, 0.0005 * sample.quote_volume)
        if abs(sample.pnl) < dynamic_threshold:
            flat_trades += 1
            continue
        if sample.pnl > 0:
            filtered_wins.append(sample.pnl)
        elif sample.pnl < 0:
            filtered_losses.append(sample.pnl)
        else:
            flat_trades += 1

    winning_trades = len(filtered_wins)
    losing_trades = len(filtered_losses)
    total_trades = winning_trades + losing_trades

    realized_sum = sum(filtered_wins) + sum(filtered_losses)

    returns = [sample.pnl / sample.quote_volume for sample in samples if sample.quote_volume > 0]
    if len(returns) >= 2:
        avg_return = mean(returns)
        std_return = pstdev(returns)
        sharpe_ratio = (avg_return / std_return * math.sqrt(len(returns))) if std_return > 0 else 0.0
    else:
        sharpe_ratio = 0.0

    loss_sum = sum(filtered_losses)
    if loss_sum < 0:
        profit_factor = sum(filtered_wins) / abs(loss_sum)
    elif filtered_wins:
        profit_factor = sum(filtered_wins) / max(sum(filtered_wins) * 0.2, 1.0)
    else:
        profit_factor = 0.0

    avg_win = (sum(filtered_wins) / len(filtered_wins)) if filtered_wins else 0.0
    avg_loss = (sum(filtered_losses) / len(filtered_losses)) if filtered_losses else 0.0

    win_rate = (winning_trades / total_trades * 100) if total_trades else 0.0

    baseline = baseline_equity if baseline_equity and baseline_equity > 0 else equity or 1.0
    total_pnl = equity - baseline
    total_pnl_percent = (total_pnl / baseline * 100) if baseline else 0.0

    max_drawdown = _calculate_drawdown(samples)

    return {
        "totalPnL": total_pnl,
        "totalPnLPercent": total_pnl_percent,
        "winRate": win_rate,
        "sharpeRatio": sharpe_ratio,
        "maxDrawdown": max_drawdown,
        "avgWin": avg_win,
        "avgLoss": avg_loss,
        "profitFactor": profit_factor,
        "totalTrades": total_trades,
        "winningTrades": winning_trades,
        "losingTrades": losing_trades,
        "realizedPnL": realized_sum,
        "unrealizedPnL": unrealized_total,
        "flatTrades": flat_trades,
    }
