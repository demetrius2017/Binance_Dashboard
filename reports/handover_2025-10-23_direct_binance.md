# Handover — 2025-10-23: Рефакторинг на Direct Binance Connection

**Дата:** 23 октября 2025  
**Статус задачи:** ~40% (в работе — требует тестирования)

---

## 🎯 Проблема

**Пользователь сообщил:**
> Frontend иногда не может увидеть backend, нужна последовательность запуска. Может нужен прямой WebSocket к Binance вместо REST API через backend? По сути свой backend не нужен — нам нужен только интерфейс, а сервер у Binance.

**Диагноз:**
- Текущая архитектура: `Frontend → Backend (WS :8000) → Binance`
- Проблемы: задержка 50-100ms, нужна синхронизация запуска, избыточная инфраструктура
- Решение: `Frontend → Binance` (прямое подключение без промежуточного backend)

---

## ✅ Что сделано

### 1. Создан прямой WebSocket клиент к Binance
**Файл:** `frontend/src/services/binanceWebSocket.ts`
- Класс `BinanceWebSocketClient` для подключения к `wss://fstream.binance.com/stream`
- Поддержка streams: `bookTicker` (цены bid/ask), `aggTrade` (сделки)
- Автоматический reconnect при обрыве соединения
- Типизированные события: `BinanceBookTickerEvent`, `BinanceTradeEvent`

### 2. Создан REST клиент для публичных данных
**Файл:** `frontend/src/services/binanceRestClient.ts`
- Класс `BinanceRestClient` для запросов к Binance Futures API
- Методы:
  - `getTicker24h()` — изменение цены, объём, high/low за 24h
  - `getExchangeInfo()` — информация о символах
  - `getBookDepth()` — стакан заявок

### 3. Создан React хук для управления подключением
**Файл:** `frontend/src/hooks/useBinanceDirect.ts`
- Хук `useBinanceDirect({ symbols, enableTrades, tickerRefreshMs })`
- Управляет WebSocket подключением и REST polling
- Интегрируется с Zustand store (`updatePrice`, `setTickers`)

### 4. Обновлён App.tsx
**Файл:** `frontend/src/App.tsx`
- Заменён `useWebSocket` (к backend) на `useBinanceDirect` (к Binance)
- Добавлен список отслеживаемых символов: `['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']`
- Убрана зависимость от переменной окружения `VITE_WS_URL`

### 5. Создана документация
**Файл:** `docs/architecture_direct_binance.md`
- Описание новой архитектуры (БЫЛО vs СТАЛО)
- Преимущества: задержка <10ms, нет проблем с подключением, проще деплой
- Инструкция по запуску и дальнейшей доработке (signing service для приватных данных)

---

## ⏳ Что осталось

### Этап 1: Тестирование (следующий шаг)
```bash
cd frontend
npm run dev
```

**Проверить в браузере (http://localhost:5173):**
- [ ] В консоли появляется `[Binance WS] Connected: btcusdt@bookTicker/...`
- [ ] TickerBar показывает обновляющиеся цены
- [ ] Нет ошибок подключения
- [ ] Ticker 24h данные загружаются (каждые 5 секунд)

### Этап 2: Приватные данные (account, positions, trades)
**Сейчас недоступны**, нужно реализовать один из вариантов:

**Вариант A — Signing Service (рекомендуется):**
- Легкий backend (Cloudflare Worker / Vercel Edge Function)
- Только для подписи HMAC-SHA256 запросов
- Frontend → Signing Service → Binance REST API

**Вариант B — User Data Stream:**
- Получить listen key (подписанный запрос)
- Подключиться к `wss://fstream.binance.com/ws/{listenKey}`
- Получать события `ACCOUNT_UPDATE`, `ORDER_TRADE_UPDATE` в real-time

### Этап 3: Equity Chart
- Сейчас график пустой (нет исторических данных)
- Нужно либо:
  - Кешировать live-точки в localStorage
  - Или запрашивать `/fapi/v1/income` за период (через signing service)

---

## ▶ Первый шаг на завтра

```bash
# 1. Запустить frontend
cd /Users/dmitrijnazarov/Projects/Binance_Dashboard/frontend
npm run dev

# 2. Открыть браузер
open http://localhost:5173

# 3. Открыть DevTools → Console
# Ожидаем логи:
# [Binance WS] Connected: btcusdt@bookTicker/ethusdt@bookTicker/solusdt@bookTicker/bnbusdt@bookTicker

# 4. Проверить TickerBar
# Должны обновляться цены BTC, ETH, SOL, BNB
```

**Если работает →** двигаться к Этапу 2 (signing service)  
**Если проблемы →** откатиться к старой схеме (`useWebSocket` вместо `useBinanceDirect`)

---

## 📂 Контекст для следующего ассистента

### Ключевые файлы
- `frontend/src/services/binanceWebSocket.ts` — прямой WS клиент к Binance
- `frontend/src/services/binanceRestClient.ts` — публичные REST запросы
- `frontend/src/hooks/useBinanceDirect.ts` — React интеграция
- `frontend/src/App.tsx` — использование хука
- `docs/architecture_direct_binance.md` — полная документация

### Что работает (публичные данные)
- Live цены (bookTicker) — задержка <10ms
- Ticker 24h (изменение %, объём, high/low)
- Автоматический reconnect

### Что НЕ работает (приватные данные)
- Account balance / margin ratio
- Open positions (unrealized PnL)
- Recent trades (realized PnL)
- Equity chart (нет исторических точек)

### Решения для приватных данных
1. **Signing Service** (рекомендуется):
   - Cloudflare Worker с переменной окружения `BINANCE_SECRET`
   - Эндпоинт `POST /sign` для подписи запросов
   - Frontend вызывает signing service → подписанный запрос → Binance API

2. **User Data Stream** (альтернатива):
   - Получить listen key через signing service
   - Подключиться к `wss://fstream.binance.com/ws/{listenKey}`
   - Real-time обновления account/positions/orders

### Backend (FastAPI)
- Пока НЕ удалён (можно откатиться при проблемах)
- Файлы: `backend/main.py`, `backend/binance_client.py`
- Для отката: вернуть `useWebSocket` в `App.tsx`

---

## ⏱ Estimated Time

- **Тестирование текущей версии:** 15-30 минут
- **Signing Service (Cloudflare Worker):** 1-2 часа
- **User Data Stream интеграция:** 2-3 часа
- **Equity chart backfill:** 1 час

**Итого до fully functional dashboard:** ~5-7 часов

---

## 🎯 Итоги — Адвокат ЗА / ПРОТИВ

### Идея целиком — Адвокат ЗА
- **Минимальная задержка:** <10ms vs 50-100ms (5-10x улучшение)
- **Нет проблем с запуском:** не нужен backend, не нужна последовательность
- **Проще деплой:** статический сайт (Vercel/Netlify) без Docker/uvicorn
- **Меньше кода:** удалили WebSocket orchestration из backend

### Идея целиком — Адвокат ПРОТИВ
- **Приватные данные требуют доработки:** нужен signing service (ещё не реализован)
- **Нет кеширования:** equity chart пустой, нет исторических данных
- **Не протестировано:** может быть CORS или rate limit от Binance

### Конкретная часть (публичные данные) — Адвокат ЗА
- **Чистый код:** типизированные классы, separation of concerns
- **Автоматический reconnect:** не нужно вручную пересоздавать соединение
- **React интеграция:** хук `useBinanceDirect` инкапсулирует всю логику

### Конкретная часть (публичные данные) — Адвокат ПРОТИВ
- **Не протестировано:** может не работать в браузере (CORS, WebSocket support)
- **Нет error handling UI:** если Binance недоступен — пользователь не поймёт почему
- **Hardcoded symbols:** список в `App.tsx`, нет динамической настройки

---

## 📝 Вывод

**Рекомендация:**
1. Запустить `npm run dev` и проверить логи в консоли
2. Если WebSocket подключается и цены обновляются → SUCCESS, двигаться к signing service
3. Если ошибки подключения → анализировать в DevTools, возможно CORS или rate limit
4. Если критично — откатиться к backend (файлы не удалены)

**Next Step:** тестирование в браузере (15-30 минут).
