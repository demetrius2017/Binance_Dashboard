# Binance Dashboard — Real-Time Trading Monitor

![Status](https://img.shields.io/badge/status-in_development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

**Высокопроизводительный веб-дашборд для мониторинга торговых операций с мгновенным обновлением через WebSocket.**

---

## 🎯 Ключевые возможности

- ⚡ **Real-time обновления** (<50ms latency) — цены, unrealized P&L, equity
- 📊 **Премиум UI/UX** — дизайн на уровне Bloomberg Terminal
- 💰 **Автоматический расчёт P&L** — мгновенный пересчёт при изменении цены
- 📈 **Equity Curve** — живой график с историей 72 часа
- 🔄 **WebSocket интеграция** — Binance Spot/Futures API
- 🎨 **Три темы интерфейса** — переключатель Classic / Neon Pulse / Carbon Fiber
- 📱 **Responsive design** — работает на desktop и mobile

---

## 🏗️ Архитектура

```
┌──────────────────────────────────────┐
│   React Frontend (TypeScript)        │
│   • Real-time charts (Lightweight)   │
│   • Live P&L calculations            │
│   • WebSocket client (auto-reconnect)│
└────────────────┬─────────────────────┘
                 │ ws://
                 ▼
┌──────────────────────────────────────┐
│   FastAPI Backend (Python)           │
│   • WebSocket server                 │
│   • Position Manager                 │
│   • Binance API aggregator           │
└────────────────┬─────────────────────┘
                 │ wss://
                 ▼
┌──────────────────────────────────────┐
│   Binance WebSocket Streams          │
│   • bookTicker (prices)              │
│   • trade (executions)               │
│   • user data (balances)             │
└──────────────────────────────────────┘
```

---

## 🚀 Технологии

### Frontend
- **React 18** + TypeScript
- **Vite** (быстрая сборка)
- **TailwindCSS** + shadcn/ui (премиум компоненты)
- **Lightweight Charts** (производительные графики)
- **Zustand** (state management)

### Backend
- **Python 3.11+**
- **FastAPI** (async WebSocket)
- **python-binance** (API wrapper)
- **asyncio** (асинхронная обработка)

---

## 📦 Установка

### Требования
- Node.js 18+
- Python 3.11+
- Binance API ключи (testnet или mainnet)

### Frontend Setup

```bash
# Клонировать репозиторий
git clone https://github.com/demetrius2017/Binance_Dashboard.git
cd Binance_Dashboard

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

### Backend Setup

```bash
# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Установить зависимости
pip install -r requirements.txt

# Настроить .env файл
cp .env.example .env
# Добавить BINANCE_API_KEY и BINANCE_API_SECRET

# Запустить WebSocket сервер
python backend/main.py
```

---

## 🎮 Использование

1. **Запустить backend:**
   ```bash
   python backend/main.py
   ```
   WebSocket сервер запустится на `ws://localhost:8000/ws`

2. **Запустить frontend:**
   ```bash
   npm run dev
   ```
   Интерфейс откроется на `http://localhost:5173`

3. **Открыть в браузере:**
   - Дашборд автоматически подключится к WebSocket
   - Цены начнут обновляться в реальном времени
   - Unrealized P&L будет пересчитываться автоматически

---

## 📊 Компоненты UI

### 1. Ticker Bar
Горизонтальная панель с live ценами топ криптовалют:
- BTC, ETH, SOL, BNB с мгновенными обновлениями
- Цветовая индикация (зелёный/красный)

### 2. Equity Chart
Основной график капитала:
- История за 72 часа (1-minute candles)
- Live обновления каждую секунду
- Плавные анимации без лагов

### 3. Metrics Grid
4 ключевые метрики:
- **Win Rate** — процент прибыльных сделок
- **Sharpe Ratio** — риск-adjusted доходность
- **Max Drawdown** — максимальная просадка
- **Profit Factor** — отношение прибыли к убыткам

### 4. Positions Table
Таблица открытых позиций:
- Real-time unrealized P&L
- Цветовая индикация profit/loss
- Entry/Current price comparison

### 5. Trades History
Боковая панель с историей сделок:
- Виртуализация (бесконечный скролл)
- Детали каждой сделки (entry/exit, holding time)
- Net P&L с учётом комиссий

### 6. Account Overview
Компактный блок с агрегированными показателями аккаунта:
- **Available Balance** — доступно для новых сделок
- **Margin Ratio** — текущая загрузка маржи
- **24h PnL** — результат последних 24 часов (цветовая индикация)
- **Leverage** — фактическое плечо портфеля

## 🎨 Темы интерфейса

Переключатель в правом верхнем углу позволяет мгновенно сравнить три визуальные концепции:

| Стиль | Характеристика | Когда включать |
|-------|----------------|----------------|
| **Classic** | Тёмный glassmorphism с изумрудными акцентами | Повседневная работа, высокая читаемость |
| **Neon Pulse** | Неоновые подсветки и фиолетовые свечения | Демонстрации заказчику, маркетинговые материалы |
| **Carbon Fiber** | Карбон + золотые акценты, строгая типографика | Ночные сессии, корпоративный стиль |

Темы синхронно меняют фон страницы, карточки, таблицы, индикатор статуса и палитру графика equity (фон, сетка, линия).

---

## ⚙️ Конфигурация

### Environment Variables (.env)

```env
# Binance API
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
BINANCE_TESTNET=true  # true для testnet, false для mainnet

# WebSocket
WS_HOST=0.0.0.0
WS_PORT=8000

# Trading
INITIAL_BALANCE=10000.00
DEFAULT_SYMBOLS=BTCUSDT,ETHUSDT,SOLUSDT
```

---

## � WebSocket события (v2)

| Тип | Payload | Примечание |
|-----|---------|------------|
| `price_update` | `symbol`, `price`, `ts` | Tick из `bookTicker`, нормализуется до тикера (BTC, SOL и т.д.) |
| `position_update` | `position` | Обновление одной позиции (side, qty, PnL) |
| `trade_executed` | `trade` | Новая сделка, добавляется в начало ленты |
| `trades_snapshot` | `trades`, `ts` | Стартовый список последних сделок для заполнения ленты |
| `equity_snapshot` | `time`, `equity` | Синхронизация графика и `currentEquity` |
| `metrics_snapshot` | `metrics`, `ts` | Агрегированные метрики (Win Rate, Sharpe, и др.) |
| `ticker_snapshot` | `tickers`, `ts` | 24h изменение, цена последней сделки по ключевым символам |
| `account_snapshot` | `account`, `ts` | Wallet balance, available balance, margin ratio, 24h PnL |
| `heartbeat` | `ts` | Keep-alive каждые 5 секунд |

---

## �📈 Performance Targets

| Метрика | Целевое значение | Текущий статус |
|---------|------------------|----------------|
| WebSocket latency | <50ms | ⏳ В разработке |
| UI FPS | 60 FPS | ⏳ В разработке |
| Bundle size (gzipped) | <500 KB | ⏳ В разработке |
| Memory usage (10h) | <200 MB | ⏳ В разработке |
| Uptime | >99.9% | ⏳ В разработке |

---

## 🗺️ Roadmap

- [x] **Phase 1:** Техническое задание и архитектура
- [ ] **Phase 2:** Backend WebSocket сервер
- [ ] **Phase 3:** Frontend Core (charts, tables)
- [ ] **Phase 4:** UI Polish и дизайн
- [ ] **Phase 5:** Optimization и профилирование
- [ ] **Phase 6:** Testing и Production deploy

**Estimated completion:** 2-3 недели

---

## 📚 Документация

- [Техническое Задание](docs/dashboard_technical_specification.md) — полное ТЗ с архитектурой
- [API Reference](docs/api_reference.md) — WebSocket protocol
- [Deployment Guide](docs/deployment.md) — инструкции по деплою

---

## 🤝 Contributing

Pull requests приветствуются! Для крупных изменений:
1. Открыть issue для обсуждения
2. Fork репозитория
3. Создать feature branch
4. Commit с описанием изменений
5. Push и создать Pull Request

---

## 📄 License

MIT License - см. [LICENSE](LICENSE) файл

---

## 👨‍💻 Автор

**Dmitrij Nazarov**  
GitHub: [@demetrius2017](https://github.com/demetrius2017)

---

## 🙏 Acknowledgments

- [Binance API](https://github.com/binance/binance-spot-api-docs) — официальная документация
- [shadcn/ui](https://ui.shadcn.com/) — премиум UI компоненты
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) — быстрые графики

---

**⭐ Если проект полезен — поставьте звезду!**
