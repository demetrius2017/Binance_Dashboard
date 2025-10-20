## MCP-интеграция для Copilot Chat (MVP)
Чтобы команды можно было вызывать как «системные инструменты» без подтверждений, добавлен минимальный MCP-сервер:

- Конфиг: `.well-known/mcp.json`
- Сервер: `python -m trader.mcp_server` (стартует по stdio)
- Методы:
  - status_report(assets?, symbol?)
  - check_balance(asset)
  - check_price(symbol)
  - open_orders(symbol?)
  - place_limit(symbol, side, price, quantity?|percent?, force?)
  - place_market(symbol, side, quantity?|percent?, force?)
  - cancel_order(symbol, order_id, force?)
  - cancel_all(symbol, force?)
  - ladder_simple(symbol, levels=[[price,percent],...], force?)

Безопасность: на mainnet все изменяющие операции требуют `force=true`. Чтение (балансы/ордера/цены) — без ограничений.

В Copilot Chat:
- «Проверь баланс SOL» → вызов `check_balance {asset:"SOL"}`
- «Покажи открытые ордера по SOLUSDT» → `open_orders {symbol:"SOLUSDT"}`
- «Поставь лимит SELL по 250 на 20%» → `place_limit {symbol:"SOLUSDT", side:"SELL", price:250, percent:20, force:true}` (mainnet)

Все инструменты:
- автоматически приводят цену и количество к фильтрам биржи (PRICE_FILTER, LOT_SIZE)
- проверяют MIN_NOTIONAL
- поддерживают объём как «процент от базового актива» (например, 70% SOL)

### Приоритет исполнения: сначала MCP-инструменты
- Read-only запросы (баланс, статус, цена, открытые ордера) выполнять через MCP-инструменты мгновенно и без уточняющих вопросов:
  - status_report, check_balance, check_price, open_orders — safe: true в `.well-known/mcp.json`.
- Изменяющие операции (place_limit/market, cancel_order/all, ladder_simple) выполнять через MCP только после явной формулировки плана и с force=true на mainnet.
- Если MCP временно недоступен, использовать резервные быстрые скрипты (см. «Fallback при недоступности MCP») — без лишних вопросов для операций чтения.

### Intents (человеческие фразы → инструменты)
В `.well-known/mcp.json` настроен intents‑мэппинг, позволяющий вызывать инструменты «естественными» фразами без подтверждений:
- «проверь баланс», «баланс» → check_balance {asset?}
- «покажи статус», «статус» → status_report {}
- «цена [SYMBOL]» → check_price {symbol}
- «открытые ордера [SYMBOL?]», «ордера» → open_orders {symbol?}
- «отмени все [SYMBOL]» → cancel_all {symbol} (mainnet: потребует force=true)

### Профили безопасности инструментов
- Read-only: помечены как safe: true — выполняются без подтверждений.
- Mutating: safe: false — на mainnet требуется force=true; перед вызовом Copilot кратко перечисляет действия (symbol, тип, цена, qty/percent).

### Fallback при недоступности MCP (только чтение)
- Быстрый сводный статус: scripts/quick_status.py (режим, ключи, балансы, открытые ордера).
- Открытые ордера: scripts/open_orders.py [SYMBOL?] — по всем символам или конкретному.
  Эти скрипты используют локальное `.venv` и исполняются без дополнительных подтверждений.

## Как работать
1) Пользователь описывает задание в свободной форме (пример: «SOLUSDT, лесенка на 70% по 4 уровням: 245, 248.3, 251.6, 255; SELL»).
2) Copilot:
  - вызывает MCP‑инструменты для чтения: баланс/статус/цена/ордера (без уточнений и подтверждений)
  - для размещения/отмены ордеров формирует явные вызовы MCP с параметрами; на mainnet — только с `force=true`
   - размещает нужные ордера
   - отчитывается: orderId, цены/объёмы, ошибки (если были)
   - при необходимости корректирует уровни и/или отменяет ордера

### Перед началом (быстрая самопроверка режима)
- Режим не переопределяем через export. Всегда читаем из `.env.production`.
- Быстро проверить активный режим и валидность ключей:
  - /Users/dmitrijnazarov/Projects/Binance_Adviser/.venv/bin/python - << 'PY'
    from config.settings import settings
    print({"trading_mode": settings.trading_mode.value, "keys_ok": settings.validate_api_keys()})
    PY
  - Если нужно сменить режим: отредактируйте `TRADING_MODE` в `.env.production` (testnet|mainnet), затем перезапустите процесс.

### Оперативный плейбук: «проверь баланс»
- Всегда использовать MCP‑инструменты для чтения, а при их недоступности — локальное виртуальное окружение проекта.
  - Если окружение отсутствует:
    - macOS/zsh:
      - python -m venv .venv
      - source .venv/bin/activate
      - pip install -r requirements.txt
  - Если окружение уже есть:
    - source .venv/bin/activate
- Выбор режима торговли:
  - Режим всегда читается из `.env.production` (переменная TRADING_MODE со значениями только: `testnet` или `mainnet`). Не переопределяем через `export` в терминале.
  - Если необходимо сменить режим, правим `.env.production` до запуска процесса.
- Проверка ключей:
  - .env.production должен содержать:
    - Для testnet: BINANCE_TEST_API_KEY, BINANCE_TEST_SECRET_KEY
    - Для mainnet: BINANCE_API_KEY, BINANCE_SECRET_KEY
- Выполнение запроса баланса (примеры для zsh):
  - Приоритет: MCP `status_report {}` или `check_balance {asset}`.
  - Fallback — быстрый статус одной командой (режим, ключи, балансы, открытые ордера):
    - /Users/dmitrijnazarov/Projects/Binance_Adviser/.venv/bin/python - << 'PY'
      import asyncio, json; from trader.commands import status_report; 
      asyncio.run((lambda: status_report())())
      PY
  - Все популярные активы разом (fallback):
    - /Users/dmitrijnazarov/Projects/Binance_Adviser/.venv/bin/python - << 'PY'
      import asyncio, json; from trader.commands import check_balance; from config.settings import settings; 
      async def main():
          assets = ["USDT","SOL","BTC","ETH","BNB"]; out={};
          for a in assets: out[a]=await check_balance(a); 
          print(json.dumps({"trading_mode":settings.trading_mode.value,"balances":out}, ensure_ascii=False, indent=2))
      asyncio.run(main())
      PY
  - Один актив (fallback):
    - /Users/dmitrijnazarov/Projects/Binance_Adviser/.venv/bin/python - << 'PY'
      import asyncio, json; from trader.commands import check_balance; 
      asyncio.run(check_balance("SOL"))
      PY
  - Открытые ордера (fallback):
    - /Users/dмитrijnazarov/Projects/Binance_Adviser/.venv/bin/python /Users/dмитrijnazarov/Projects/Binance_Adviser/scripts/open_orders.py [SYMBOL]
- Отчётность: вывести режим торговли и непустые балансы. В случае ошибки — текст ошибки Binance или отсутствие ключей.

### Безопасное размещение ордеров (особенно mainnet)
- Если `TRADING_MODE=mainnet` в `.env.production`, перед размещением ордеров Copilot явно сообщает: «Режим mainnet. Будут выполнены реальные операции.» и перечисляет планируемые действия (символ, тип, цена, qty/percent). Затем выполняет MCP‑команду с `force=true`.
- На короткие запросы уровня «проверь баланс / открой ордера» режим не уточняется, он всегда берётся из `.env.production`.

### Пример ручных шагов (прямо по заданию)
- check_balance SOL
- ladder_simple_cmd(SOLUSDT, [(245,17.5),(248.3,17.5),(251.6,17.5),(255,17.5)])
- check_price SOLUSDT → расчёт stop и limit (stop ≈ −10% от текущей цены, limit чуть ниже stop)
- stop_loss_limit_cmd(SOLUSDT, SELL, stop=<stop>, price=<limit>)
- open_orders_cmd SOLUSDT

Комментарии к примеру:
- «17.5» — проценты от базового актива SOL, суммарно 70%.
- Инструменты автоматически округляют price/qty под биржевые фильтры (PRICE_FILTER, LOT_SIZE) и проверяют MIN_NOTIONAL.
- Если нужно неравномерное распределение (например, 20/15/15/20), проценты в списке уровней задаются явно.

## Набор команд (обёртки)
- Проверка:
  - check_balance("SOL") — баланс базового актива
  - open_orders_cmd(symbol?) — список открытых ордеров
- Размещение:
  - place_limit_cmd(symbol, side, price, quantity? | percent?)
  - place_market_cmd(symbol, side, quantity? | percent?)
  - stop_loss_limit_cmd(symbol, side, stop_price, price, quantity? | percent?)
  - take_profit_limit_cmd(symbol, side, stop_price, price, quantity? | percent?)
  - ladder_simple_cmd(symbol, levels=[(price, percent), ...]) — сумма процентов = требуемый общий объём
  - status_report(assets?, symbol?) — сводный отчёт: режим, ключи, балансы, открытые ордера
- Управление:
  - cancel_order_cmd(symbol, order_id)
  - cancel_all_cmd(symbol)

Примечания:
- side: "BUY"/"SELL"
- percent — проценты от базового актива (например, 70 означает 70% вашего SOL)
- инструменты сами округляют цену/количество и валидируют notional

### Открытые ордера vs история
- Открытые ордера: используйте `open_orders_cmd(symbol?)` (внутри — `/api/v3/openOrders`).
- История ордеров: при необходимости можно вызывать `/api/v3/allOrders` через коннектор для диагностики, но для отчёта пользователю по «открытым ордерам» используем только `open_orders_cmd`.
  - Пример сверки (для внутренней проверки): сравнить `openOrders` и `allOrders` по символу.

## Безопасность и конфигурация
- Все ключи — только в `.env.production`
- Режим торговли определяется переменной `TRADING_MODE` в `.env.production` (testnet|mainnet). По умолчанию — testnet.
- Ограничения IP для ключей настоятельно рекомендуются

## Мини‑сценарий теста (testnet)
1) Проверить баланс SOL
2) Разместить лесенку из 4 уровней, суммарно 70% базового актива
3) Получить список открытых ордеров и сверить уровни

## Отчётность
- Перед действием кратко формулировать шаг (например, «Размещаю 4 LIMIT SELL, суммарно 70%»)
- После действия — показать результат API: orderId, цены/кол-во, ошибки и что было скорректировано

### Частые ошибки и быстрые решения
- ModuleNotFoundError (pydantic/aiohttp): активируйте venv и установите зависимости: source .venv/bin/activate; pip install -r requirements.txt
- Ошибка валидации TRADING_MODE: используйте значения testnet или mainnet. Не используйте TRADING_MODEL=real.
- Binance API Error 401/–2015: проверьте, что в .env.production заданы ключи соответствующего режима, и что IP‑ограничения на ключах разрешают текущий хост.

## Ограничения
- Не используем автопарсинг текста и авто‑стратегии: только ручные инструменты
- Для трейлинга спота через REST v3 нет готового метода — используем stop/take‑profit/лесенку, либо эмулируем через логику при необходимости

## Принципы исполнения «простых запросов»
- На короткие запросы вроде «проверь баланс», «покажи открытые ордера» — не задавать уточняющих вопросов, если однозначно понятен режим (из последней реплики: «на реальном аккаунте» → mainnet; иначе testnet по умолчанию).
- Автоматически активировать локальный venv, использовать TRADING_MODE из `.env.production` (без экспорта в окружение) и выполнять точные команды, после чего давать отчёт с фактическими данными.

## Термины и расчёты (во избежание путаницы)
- «24h изменение» (priceChangePercent) — процент изменения цены за последние 24 часа (метрика Binance `/api/v3/ticker/24hr`).
- «Дневная просадка» (амплитуда суток) — вычисляется как `(high - low) / high` из тех же данных 24h.
- «Текущая просадка от дневного хая» — `(high - last) / high`.
При ответах всегда явно называть метрику и формулу, чтобы отличать эти значения.
