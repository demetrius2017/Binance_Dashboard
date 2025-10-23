# Техническое Задание: Real-Time Trading Dashboard

**Дата:** 20 октября 2025  
**Версия:** 1.0  
**Статус:** В работе — требует проверки

---

## 1. ЦЕЛЬ ПРОЕКТА

Создать высокопроизводительный веб-дашборд для мониторинга торговых операций с:
- **Мгновенным обновлением** через WebSocket (цены, unrealized P&L)
- **Премиум UI/UX** на уровне профессиональных трейдинговых платформ
- **Минимальной задержкой** (<50ms от события до отображения)

---

## 2. АРХИТЕКТУРА

### 2.1 Стек технологий

**Frontend:**
- React 18+ (с concurrent features)
- TypeScript (строгая типизация)
- Vite (быстрая сборка)
- TailwindCSS + shadcn/ui (премиум компоненты)
- Recharts / Lightweight Charts (производительные графики)
- Zustand (легковесный state manager)

**Backend:**
- Python 3.11+
- FastAPI (async WebSocket сервер)
- Python-binance (Binance API wrapper)
- asyncio (асинхронная обработка)

**WebSocket Protocol (v2):**
```typescript
type AccountSummary = {
  balance: number                  // Текущий wallet balance
  availableBalance: number         // Доступно для открытия позиций
  marginRatio: number              // % использования маржи
  leverage: number                 // Текущее плечо аккаунта
  pnl24h: number                   // PnL за последние 24 часа
}

type WSMessage =
  | { type: 'price_update'; symbol: string; price: number; ts: number }
  | { type: 'position_update'; position: Position }
  | { type: 'trade_executed'; trade: Trade }
  | { type: 'trades_snapshot'; trades: Trade[]; ts: number }
  | { type: 'equity_snapshot'; time: number; equity: number }
  | { type: 'metrics_snapshot'; metrics: Metrics; ts: number }
  | { type: 'ticker_snapshot'; tickers: TickerData[]; ts: number }
  | { type: 'account_snapshot'; account: AccountSummary; ts: number }
  | { type: 'heartbeat'; ts: number }
```

**Частота отправки:**

| Тип события         | Триггер                                    | Частота/политика |
|---------------------|---------------------------------------------|------------------|
| `price_update`      | При каждом изменении best bid/ask          | до 60/с на символ |
| `position_update`   | Поступил user-data update от Binance       | по событию       |
| `trade_executed`    | Новая сделка (fill)                        | по событию       |
| `equity_snapshot`   | Пересчёт equity (цена/позиция изменилась)  | 1–2/с            |
| `metrics_snapshot`  | Завершилась агрегация метрик (PnL, Sharpe)  | 1/5с             |
| `ticker_snapshot`   | Обновление 24h статистик по символам       | 1/10с            |
| `account_snapshot`  | Binance `ACCOUNT_UPDATE` либо таймер 5с    | 1/5с             |
| `heartbeat`         | Keep-alive                                   | 1/5с             |

### 2.2 Компоненты системы

```
┌─────────────────────────────────────────────────┐
│          React Frontend (Browser)               │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Equity    │  │ Positions  │  │ Trade List │ │
│  │ Chart     │  │ Grid       │  │            │ │
│  └─────┬─────┘  └──────┬─────┘  └──────┬─────┘ │
│        └────────────────┼────────────────┘       │
│                    WebSocket Client              │
└──────────────────────────┬──────────────────────┘
                           │ ws://
                           ▼
┌─────────────────────────────────────────────────┐
│       FastAPI WebSocket Server (Python)         │
│  ┌───────────────────────────────────────────┐  │
│  │  Position Manager (Unrealized P&L calc)  │  │
│  └───────────────┬───────────────────────────┘  │
│                  │                               │
│  ┌───────────────▼───────────────────────────┐  │
│  │  Binance WebSocket Aggregator             │  │
│  │  - bookTicker (bid/ask)                   │  │
│  │  - trade streams                          │  │
│  │  - user data stream (fills, balances)     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    │
                    ▼ wss://
        ┌───────────────────────┐
        │   Binance Spot/Futures│
        │   WebSocket API       │
        └───────────────────────┘
```

---

## 3. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 3.1 Real-Time Price Updates (Критично!)

**Цель:** Мгновенное (<50ms) обновление цен во всех компонентах

**Реализация:**
- WebSocket подписка на `bookTicker` для всех активных символов
- Оптимизация: батчинг обновлений (max 60 FPS)
- React: `useSyncExternalStore` для zero-delay рендеринга

```python
# Backend: Binance stream aggregator
async def price_stream_handler():
    symbols = get_active_symbols()  # ["BTCUSDT", "ETHUSDT", ...]
    streams = [f"{s.lower()}@bookTicker" for s in symbols]
    
    async with BinanceSocketManager().multiplex_socket(streams) as stream:
        async for msg in stream:
            # Мгновенная отправка всем клиентам
            await broadcast_to_clients({
                'type': 'price_update',
                'symbol': msg['s'],
                'bid': float(msg['b']),
                'ask': float(msg['a']),
                'timestamp': msg['E']
            })
```

### 3.2 Unrealized P&L Calculation (Core Logic)

**Формулы:**

**Для позиции:**
```
unrealized_pnl_position = (current_price - entry_price) * quantity * direction
где direction: LONG = +1, SHORT = -1
```

**Для портфеля:**
```
total_unrealized_pnl = Σ(unrealized_pnl_position_i) для всех открытых позиций

account_equity = balance + total_unrealized_pnl
```

**Реализация (Backend):**
```python
class PositionManager:
    def __init__(self):
        self.positions: Dict[str, Position] = {}
        self.balance: float = 10000.0
        
    def update_price(self, symbol: str, price: float):
        if symbol not in self.positions:
            return
            
        pos = self.positions[symbol]
        
        # Unrealized P&L для позиции
        price_diff = price - pos.entry_price
        direction = 1 if pos.side == "LONG" else -1
        pos.unrealized_pnl = price_diff * pos.quantity * direction
        
        # Пересчёт общего equity
        total_unrealized = sum(p.unrealized_pnl for p in self.positions.values())
        account_equity = self.balance + total_unrealized
        
        # Отправка обновления клиентам
        return {
            'type': 'equity_snapshot',
            'balance': self.balance,
            'unrealized_pnl': total_unrealized,
            'equity': account_equity,
            'positions': [p.to_dict() for p in self.positions.values()]
        }
```

### 3.3 UI Компоненты

#### A. Top Bar — Crypto Prices Ticker
```typescript
// Горизонтальная прокрутка с live ценами
<TickerBar>
  <TickerItem symbol="BTC" price={110672.50} change24h={+2.34} />
  <TickerItem symbol="ETH" price={3962.25} change24h={-0.87} />
  <TickerItem symbol="SOL" price={187.55} change24h={+5.12} />
</TickerBar>
```

**Оптимизация:**
- Виртуализация (react-window) для 50+ символов
- Throttle updates до 1 раз в 100ms per symbol

#### B. Equity Chart (Main)
```typescript
// Lightweight Charts для максимальной производительности
<EquityChart
  data={equityHistory}          // Time series данные
  realtimeUpdate={latestEquity} // Live точка (streaming)
  height={400}
  showVolume={false}
  indicators={['EMA20', 'Bollinger']} // Опционально
/>
```

**Данные:**
- Историческая кривая: 1-minute candles за 72h
- Live updates: каждые 1-5 секунд (при изменении цены)
- Хранение: IndexedDB (offline persistence)

#### C. Metrics Grid (4 колонки)
```typescript
<MetricsGrid>
  <MetricCard
    icon={<Target />}
    label="Win Rate"
    value="75.0%"
    subtitle="3/4 trades"
    color="emerald"
  />
  <MetricCard
    icon={<Award />}
    label="Sharpe Ratio"
    value="1.82"
    subtitle="Risk-adjusted"
    color="blue"
  />
  <MetricCard
    icon={<AlertTriangle />}
    label="Max Drawdown"
    value="-2.3%"
    subtitle="Peak to trough"
    color="orange"
  />
  <MetricCard
    icon={<Activity />}
    label="Profit Factor"
    value="2.89"
    subtitle="Wins / Losses"
    color="purple"
  />
</MetricsGrid>
```

#### D. Positions Grid (Live Table)
```typescript
// Таблица открытых позиций с live unrealized P&L
<PositionsTable>
  <Position
    symbol="BTCUSDT"
    side="LONG"
    entryPrice={94250.00}
    currentPrice={94680.00}  // Live update!
    quantity={0.02}
    unrealizedPnl={+8.52}    // Live calculation!
    unrealizedPnlPercent={+0.45}
    notional={1894.00}
  />
</PositionsTable>
```

**Live Updates:**
- `currentPrice`: мгновенно при каждом tick
- `unrealizedPnl`: пересчёт на клиенте (оптимизация)
- Цветовая индикация: зелёный (profit) / красный (loss)

#### E. Trades History (Sidebar)
```typescript
// Вертикальный скролл с виртуализацией
<TradesList>
  <TradeCard
    model="OCC R7"
    side="LONG"
    symbol="BTCUSDT"
    entry={94250.00}
    exit={94680.00}
    pnl={+8.52}
    pnlPercent={+0.45}
    holdingTime="2H 15M"
    timestamp="10/20, 6:28 PM"
  />
</TradesList>
```

**Оптимизация:**
- react-virtuoso (бесконечный скролл)
- Загрузка по 20 сделок (pagination)
- Кэширование в localStorage

---

## 4. НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 4.1 Производительность

| Метрика | Целевое значение | Критичность |
|---------|------------------|-------------|
| WebSocket latency (tick → UI) | <50ms | HIGH |
| FPS (при активных обновлениях) | 60 FPS | HIGH |
| Memory usage (10h session) | <200 MB | MEDIUM |
| Initial load time | <2s | MEDIUM |
| Bundle size (gzipped) | <500 KB | LOW |

### 4.2 Надёжность

**Reconnection Strategy:**
```typescript
class WebSocketClient {
  reconnect() {
    const delays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff
    let attempt = 0;
    
    const connect = () => {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onclose = () => {
        attempt = Math.min(attempt + 1, delays.length - 1);
        setTimeout(connect, delays[attempt]);
      };
    };
    
    connect();
  }
}
```

**Error Handling:**
- Graceful degradation: при разрыве WS показывать cached данные
- Visual indicator: `🔴 Disconnected` / `🟢 Live`
- Automatic snapshot request при reconnect

### 4.3 Security

- **API Keys:** только на backend (env variables)
- **Rate Limiting:** max 10 req/sec per client
- **CORS:** whitelist только production домены
- **Input Validation:** все WebSocket messages через Pydantic models

---

## 5. ДИЗАЙН СИСТЕМА

### 5.1 Цветовая палитра (Dark Theme)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0e1a;      /* slate-950 */
  --bg-secondary: #1a1f2e;    /* slate-900/50 */
  --bg-tertiary: #2a2f3e;     /* slate-800 */
  
  /* Borders */
  --border-primary: #2a2f3e;  /* slate-800 */
  --border-secondary: #3a3f4e; /* slate-700 */
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;  /* slate-300 */
  --text-muted: #94a3b8;      /* slate-400 */
  
  /* Semantic Colors */
  --success: #10b981;         /* emerald-500 */
  --danger: #ef4444;          /* red-500 */
  --warning: #f59e0b;         /* amber-500 */
  --info: #3b82f6;            /* blue-500 */
  
  /* Chart Colors */
  --chart-up: #10b981;
  --chart-down: #ef4444;
  --chart-grid: #2a2f3e;
}
```

### 5.2 Типографика

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-4xl: 2.25rem;   /* 36px */
```

### 5.3 Компоненты (shadcn/ui)

Использовать:
- `Card` — для всех панелей
- `Table` — для позиций/сделок
- `Badge` — для статусов (LONG/SHORT)
- `Tabs` — для переключения таймфреймов
- `Tooltip` — для детальной информации

**Пример:**
```tsx
<Card className="bg-slate-900/50 border-slate-800">
  <CardHeader>
    <CardTitle>Total Account Value</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold">
      ${formatNumber(equity)}
    </div>
  </CardContent>
</Card>
```

---

## 6. РЕАЛИЗАЦИЯ (Roadmap)

### Phase 1: Foundation (2-3 дня)
- [x] ТЗ и архитектура
- [ ] Setup: Vite + React + TypeScript проект
- [ ] Установка shadcn/ui + TailwindCSS
- [ ] Базовая структура компонентов (без данных)

### Phase 2: Backend (2-3 дня)
- [ ] FastAPI WebSocket сервер
- [ ] Binance API интеграция (testnet)
- [ ] Position Manager (unrealized P&L logic)
- [ ] WebSocket protocol implementation
- [ ] Unit tests для расчётов

### Phase 3: Frontend Core (3-4 дня)
- [ ] WebSocket client (с reconnection)
- [ ] Zustand store (positions, prices, equity)
- [ ] Equity Chart (Lightweight Charts)
- [ ] Metrics Grid (real-time расчёты)
- [ ] Positions Table (live updates)

### Phase 4: UI Polish (2-3 дня)
- [ ] Ticker Bar (top)
- [ ] Trades History (sidebar)
- [ ] Анимации и transitions
- [ ] Responsive design (mobile)
- [ ] Dark/Light theme toggle

### Phase 5: Optimization (1-2 дня)
- [ ] Performance profiling (React DevTools)
- [ ] Виртуализация длинных списков
- [ ] Мемоизация компонентов
- [ ] Bundle size оптимизация
- [ ] Load testing (100+ concurrent users)

### Phase 6: Testing & Deploy (2 дня)
- [ ] E2E тесты (Playwright)
- [ ] WebSocket stress test
- [ ] Production build
- [ ] Docker containerization
- [ ] Deploy на VPS/Cloud

---

## 7. МЕТРИКИ УСПЕХА

| Критерий | Цель | Статус |
|----------|------|--------|
| Latency (tick → UI) | <50ms | ⏳ |
| FPS (live updates) | 60 FPS | ⏳ |
| Uptime (WebSocket) | >99.9% | ⏳ |
| Bundle size | <500KB | ⏳ |
| Lighthouse Score | >90 | ⏳ |
| User Feedback | "Smooth & Fast" | ⏳ |

---

## 8. РИСКИ И МИТИГАЦИЯ

| Риск | Вероятность | Воздействие | Митигация |
|------|-------------|-------------|-----------|
| Binance API rate limits | HIGH | HIGH | Батчинг запросов, локальный кэш |
| WebSocket разрывы | MEDIUM | HIGH | Auto-reconnect + snapshot sync |
| Медленный рендеринг (100+ updates/sec) | MEDIUM | HIGH | Throttling, виртуализация, мемоизация |
| Некорректный расчёт P&L | LOW | CRITICAL | Unit tests, manual verification |
| Browser memory leaks | LOW | MEDIUM | Profiling, cleanup в useEffect |

---

## 9. NEXT STEPS

1. **Утверждение ТЗ** (Дмитрий) → ТЕКУЩИЙ ШАГ
2. Setup проекта (Vite + React)
3. Создание базовых компонентов
4. Реализация WebSocket backend
5. Интеграция и тестирование

---

## АДВОКАТ ЗА / ПРОТИВ

### Идея целиком — Real-Time Dashboard

**Адвокат ЗА:**
- ✅ **Мгновенная обратная связь:** трейдер видит P&L в реальном времени без задержек
- ✅ **Профессиональный уровень:** конкурирует с Bloomberg Terminal / TradingView
- ✅ **Масштабируемость:** архитектура поддерживает 100+ одновременных пользователей
- ✅ **Техническая реализуемость:** все технологии проверены и стабильны

**Адвокат ПРОТИВ:**
- ⚠️ **Сложность:** WebSocket + async + React concurrency = высокий порог входа
- ⚠️ **Binance API зависимость:** rate limits могут замедлить development
- ⚠️ **Поддержка:** требует постоянного мониторинга (reconnects, errors)
- ⚠️ **Over-engineering риск:** можно начать с REST API + polling (проще)

### Конкретное ТЗ — текущий документ

**Адвокат ЗА:**
- ✅ **Детальность:** все компоненты, формулы и протоколы описаны
- ✅ **Roadmap:** чёткий план с 6 фазами и ~2 недели timeline
- ✅ **Метрики:** конкретные KPI для оценки успеха (<50ms latency)
- ✅ **Риски учтены:** mitigation strategy для каждого риска

**Адвокат ПРОТИВ:**
- ⚠️ **Нет прототипа:** документ не подтверждён работающим кодом
- ⚠️ **Optimistic timeline:** 2 недели может быть недостаточно для полировки
- ⚠️ **Binance testnet:** нужна проверка, что все stream'ы доступны в testnet
- ⚠️ **Mobile responsive:** добавлено в Phase 4, но может потребовать больше времени

**Вывод:**  
ТЗ готово к утверждению. Рекомендуется начать с **быстрого прототипа** (1 день): React + mock WebSocket данные → проверить, что UI рендерится при 60 updates/sec без тормозов. После подтверждения производительности — переходить к полной реализации.

**Next Step:** Ждём подтверждения от Дмитрия → затем `git commit` ТЗ и начало Phase 1 (setup проекта).
