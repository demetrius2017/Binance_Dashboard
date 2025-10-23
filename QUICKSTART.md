# Binance Dashboard — Команды запуска

## Backend (Terminal 1)
```bash
cd /Users/dmitrijnazarov/Projects/Binance_Dashboard
./start_backend.sh
```
**НЕ закрывайте этот терминал!** Backend должен работать постоянно.

## Frontend (Terminal 2)
```bash
cd /Users/dmitrijnazarov/Projects/Binance_Dashboard/frontend
npm run dev
```

## Открыть в браузере
http://localhost:5173/

**Индикатор 🟢 Live** должен появиться в правом верхнем углу через 1-2 секунды после загрузки страницы.
Цены SOL будут обновляться в реальном времени из Binance Futures.
