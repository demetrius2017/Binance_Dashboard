# Binance Dashboard — Команды запуска

## ⚡ Новая архитектура (прямое подключение к Binance)

**С 23.10.2025:** Frontend подключается напрямую к Binance WebSocket, backend больше не нужен!

### Запуск (только Frontend)
```bash
cd /Users/dmitrijnazarov/Projects/Binance_Dashboard/frontend
npm run dev
```

### Открыть в браузере
http://localhost:5173/

**Индикатор 🟢 Live** должен появиться в правом верхнем углу через 1-2 секунды после загрузки страницы.

### Что работает
- ✅ Live цены (BTC, ETH, SOL, BNB) — задержка <10ms
- ✅ Ticker 24h (изменение %, объём, high/low)
- ✅ Автоматический reconnect при обрыве

### Что НЕ работает (требует signing service)
- ⏳ Account balance / margin ratio
- ⏳ Open positions (unrealized PnL)
- ⏳ Recent trades (realized PnL)
- ⏳ Equity chart (исторические данные)

### Проверка в DevTools
Откройте Console (F12) и убедитесь:
```
[Binance WS] Connected: btcusdt@bookTicker
[Binance WS] Connected: ethusdt@bookTicker
...
```

---

## 📚 Документация

- **Новая архитектура:** `docs/architecture_direct_binance.md`
- **Сравнение старой и новой:** `docs/architecture_comparison.md`
- **Handover отчёт:** `reports/handover_2025-10-23_direct_binance.md`

---

## 🔙 Старая архитектура (с backend — deprecated)

<details>
<summary>Развернуть инструкцию для старой схемы</summary>

### Backend (Terminal 1)
```bash
cd /Users/dmitrijnazarov/Projects/Binance_Dashboard
./start_backend.sh
```
**НЕ закрывайте этот терминал!** Backend должен работать постоянно.

### Frontend (Terminal 2)
```bash
cd /Users/dmitrijnazarov/Projects/Binance_Dashboard/frontend
npm run dev
```

### Откат на старую схему
Если нужно вернуться к backend:
```typescript
// В frontend/src/App.tsx:
// import { useWebSocket } from './hooks/useWebSocket'
// useWebSocket({ url: 'ws://localhost:8000/ws' })
```

</details>
