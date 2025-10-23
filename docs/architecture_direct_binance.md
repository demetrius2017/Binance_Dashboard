# Архитектура Dashboard — Direct Binance Connection

**Дата обновления:** 23 октября 2025  
**Статус:** В работе — требует тестирования

---

## 🎯 Суть изменения

**БЫЛО (проблемная архитектура):**
```
Frontend (React) → FastAPI Backend (WS :8000) → Binance API
                          ↑
                  Проблемы подключения
                  Избыточная задержка
                  Сложная синхронизация
```

**СТАЛО (оптимальная архитектура):**
```
Frontend (React) → Binance WebSocket (прямое подключение)
                ↘
                  → Binance REST API (публичные данные)
```

---

## ✅ Преимущества новой архитектуры

### 1. **Минимальная задержка**
- **Было:** 50-100ms (Frontend → Backend → Binance)
- **Стало:** <10ms (Frontend → Binance напрямую)

### 2. **Нет проблем с подключением**
- **Было:** Нужна последовательность запуска (сначала backend, потом frontend)
- **Стало:** Запускаем только frontend, он сам подключается к Binance

### 3. **Проще деплой**
- **Было:** Нужен сервер для backend (8000 port), настройка CORS, .env
- **Стало:** Статический сайт (Vercel/Netlify/Cloudflare Pages)

### 4. **Меньше инфраструктуры**
- **Было:** FastAPI + uvicorn + WebSocket orchestration
- **Стало:** Только React app

---

## 📋 Что реализовано

### Новые файлы

1. **`frontend/src/services/binanceWebSocket.ts`**
   - Класс `BinanceWebSocketClient` для прямого подключения к Binance Futures
   - Поддержка `bookTicker` (цены bid/ask) и `aggTrade` (сделки)
   - Автоматический reconnect при обрыве соединения

2. **`frontend/src/services/binanceRestClient.ts`**
   - Класс `BinanceRestClient` для публичных REST запросов
   - Методы: `getTicker24h()`, `getExchangeInfo()`, `getBookDepth()`

3. **`frontend/src/hooks/useBinanceDirect.ts`**
   - React хук для управления WebSocket + REST polling
   - Интеграция с Zustand store (updatePrice, setTickers)

### Изменённые файлы

4. **`frontend/src/App.tsx`**
   - Заменён `useWebSocket` (к backend) на `useBinanceDirect` (к Binance)
   - Добавлен список отслеживаемых символов: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `BNBUSDT`

---

## 🚀 Как запустить (новая схема)

### 1. Установка зависимостей
```bash
cd frontend
npm install
```

### 2. Запуск dev-сервера
```bash
npm run dev
```

### 3. Открыть в браузере
```
http://localhost:5173
```

**Всё!** Никакой backend не нужен — frontend сам подключается к Binance.

---

## 📊 Архитектура данных

### Market Data (публичные данные)

#### WebSocket Streams
```typescript
// Прямое подключение
wss://fstream.binance.com/stream?streams=btcusdt@bookTicker/ethusdt@bookTicker

// Получаем события:
{
  e: 'bookTicker',
  s: 'BTCUSDT',
  b: '43250.00',  // best bid
  a: '43251.50',  // best ask
  T: 1698123456789
}
```

**Частота:** до 100ms (10 обновлений/сек на символ)

#### REST API (периодический polling)
```typescript
// Каждые 5 секунд
GET https://fapi.binance.com/fapi/v1/ticker/24hr

// Получаем:
[
  {
    symbol: 'BTCUSDT',
    lastPrice: '43250.75',
    priceChangePercent: '2.34',
    volume: '1234567.89',
    high24h: '44000.00',
    low24h: '42000.00'
  },
  ...
]
```

### Account Data (приватные данные)

**Для будущей реализации** — нужен signing service:

#### Вариант A: Minimal Backend (только для подписи)
```typescript
// Легкий сервис (Cloudflare Worker / Vercel Edge Function)
POST /api/sign
{
  endpoint: '/fapi/v2/account',
  params: { timestamp: 1698123456789 }
}

// Возвращает подписанный запрос
{
  signature: 'abc123...',
  timestamp: 1698123456789
}
```

#### Вариант B: Binance User Data Stream
```typescript
// 1. Получить listen key
POST /fapi/v1/listenKey
→ { listenKey: 'xyz789...' }

// 2. Подключиться к WS
wss://fstream.binance.com/ws/xyz789...

// Получаем события:
- ACCOUNT_UPDATE (баланс, позиции)
- ORDER_TRADE_UPDATE (исполненные ордера)
```

---

## 🔧 Что доступно сейчас

### ✅ Работает (публичные данные)
- [x] Live цены (bid/ask) для всех символов
- [x] Ticker 24h (изменение %, объём, high/low)
- [x] Автоматический reconnect при обрыве

### ⏳ Требует доработки (приватные данные)
- [ ] Account balance / margin ratio
- [ ] Open positions (unrealized PnL)
- [ ] Recent trades (realized PnL)
- [ ] Equity chart (исторические данные)

---

## 💡 Следующие шаги

### Этап 1: Тестирование текущей версии (сейчас)
```bash
# Запустить frontend
cd frontend && npm run dev

# Проверить в консоли браузера:
# - Сообщения "[Binance WS] Connected"
# - Обновление цен в TickerBar
# - Нет ошибок подключения
```

### Этап 2: Signing Service (для приватных данных)

**Вариант A — Cloudflare Worker:**
```typescript
// worker.ts
export default {
  async fetch(request: Request) {
    const { endpoint, params } = await request.json()
    const signature = hmacSHA256(params, API_SECRET)
    return Response.json({ signature, ...params })
  }
}
```

**Вариант B — Vercel Edge Function:**
```typescript
// api/sign.ts
import { NextRequest } from 'next/server'

export const config = { runtime: 'edge' }

export default async function handler(req: NextRequest) {
  const { endpoint, params } = await req.json()
  const signature = hmacSHA256(params, process.env.BINANCE_SECRET!)
  return Response.json({ signature, ...params })
}
```

### Этап 3: User Data Stream (альтернатива REST)
```typescript
// Вместо polling /fapi/v2/account каждые 5 сек
// → подписаться на WS stream с обновлениями в real-time

async function setupUserDataStream() {
  // 1. Получить listen key (подписанный запрос через signing service)
  const { listenKey } = await signedRequest('/fapi/v1/listenKey', {}, 'POST')
  
  // 2. Подключиться к stream
  const ws = new WebSocket(`wss://fstream.binance.com/ws/${listenKey}`)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch (data.e) {
      case 'ACCOUNT_UPDATE':
        // Обновить баланс, позиции
        updateAccount(data)
        break
      case 'ORDER_TRADE_UPDATE':
        // Добавить сделку в историю
        addTrade(data)
        break
    }
  }
  
  // 3. Продлевать listen key каждые 30 минут
  setInterval(() => {
    signedRequest('/fapi/v1/listenKey', {}, 'PUT')
  }, 30 * 60 * 1000)
}
```

---

## 🎯 Итоги — Адвокат ЗА / ПРОТИВ

### Идея целиком — Адвокат ЗА
- **Минимальная задержка:** <10ms вместо 50-100ms
- **Нет проблем с backend:** не нужна последовательность запуска
- **Проще деплой:** статический сайт без сервера
- **Меньше кода:** удалили FastAPI orchestration

### Идея целиком — Адвокат ПРОТИВ
- **Приватные данные требуют доработки:** нужен signing service или User Data Stream
- **Нет кеширования:** исторические данные для equity chart пока недоступны
- **CORS ограничения:** некоторые Binance эндпоинты могут требовать proxy

### Конкретные правки — Адвокат ЗА
- **BinanceWebSocketClient:** надёжный reconnect, типизированные события
- **BinanceRestClient:** простые публичные запросы без зависимостей
- **useBinanceDirect:** интеграция с Zustand, удобный React hook

### Конкретные правки — Адвокат ПРОТИВ
- **Account data отсутствует:** balance, positions, trades ещё не подключены
- **Equity chart пустой:** нет исторических точек (начинается с live-данных)
- **Не протестировано:** требуется запуск и проверка в браузере

---

## 📝 Вывод

**Рекомендация:** запустить frontend (`npm run dev`) и проверить:
1. Подключение к Binance WS (лог в консоли)
2. Обновление цен в TickerBar
3. Обновление ticker 24h данных

Если работает — двигаться к Этапу 2 (signing service для приватных данных).

Если проблемы — откатиться к старой схеме с backend (файлы не удалены, можно вернуть `useWebSocket`).
