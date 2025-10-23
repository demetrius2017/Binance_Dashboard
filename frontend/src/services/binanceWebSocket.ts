/**
 * Прямое WebSocket подключение к Binance Futures
 * Без промежуточного backend — минимальная задержка
 */

export type BinanceBookTickerEvent = {
  e: 'bookTicker'
  u: number // order book updateId
  s: string // symbol
  b: string // best bid price
  B: string // best bid qty
  a: string // best ask price
  A: string // best ask qty
  T: number // transaction time
  E: number // event time
}

export type BinanceTradeEvent = {
  e: 'aggTrade'
  E: number // event time
  s: string // symbol
  a: number // aggregate trade ID
  p: string // price
  q: string // quantity
  f: number // first trade ID
  l: number // last trade ID
  T: number // trade time
  m: boolean // is buyer maker
}

export type BinanceEventHandler = {
  onBookTicker?: (data: BinanceBookTickerEvent) => void
  onTrade?: (data: BinanceTradeEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export class BinanceWebSocketClient {
  private connections: Map<string, WebSocket> = new Map()
  private reconnectTimers: Map<string, number> = new Map()
  private manualCloseSymbols: Set<string> = new Set()
  private isManualClose = false
  private symbols: string[]
  private handlers: BinanceEventHandler
  private reconnectDelayMs: number
  
  constructor(
    symbols: string[],
    _streams: ('bookTicker' | 'aggTrade')[],  // Reserved for future use
    handlers: BinanceEventHandler,
    reconnectDelayMs = 3000
  ) {
    this.symbols = symbols
    this.handlers = handlers
    this.reconnectDelayMs = reconnectDelayMs
  }

  connect() {
    this.isManualClose = false
    
    // Закрыть все существующие подключения (широкая чистка локальных списков)
    this.connections.forEach((ws, sym) => {
      this.manualCloseSymbols.add(sym)
      ws.close()
    })
    this.connections.clear()
    
    // Создать отдельное подключение для каждого символа
    // Binance рекомендует: wss://fstream.binance.com/ws/btcusdt@bookTicker
    this.symbols.forEach(symbol => {
      const streamName = `${symbol.toLowerCase()}@bookTicker`
      const url = `wss://fstream.binance.com/ws/${streamName}`
      
      try {
        const ws = new WebSocket(url)
        this.connections.set(symbol, ws)
        
        ws.onopen = () => {
          console.log(`[Binance WS] Connected: ${streamName}`)
          // Вызываем onConnect только когда все подключились
          if (this.connections.size === this.symbols.length) {
            const allConnected = Array.from(this.connections.values())
              .every(w => w.readyState === WebSocket.OPEN)
            if (allConnected) {
              this.handlers.onConnect?.()
            }
          }
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Прямой формат (без обёртки msg.data)
            if (data.e === 'bookTicker') {
              this.handlers.onBookTicker?.(data as BinanceBookTickerEvent)
            } else if (data.e === 'aggTrade') {
              this.handlers.onTrade?.(data as BinanceTradeEvent)
            }
          } catch (err) {
            console.error('[Binance WS] Parse error:', err)
          }
        }
        
        ws.onerror = (event) => {
          if (this.manualCloseSymbols.has(symbol)) {
            this.manualCloseSymbols.delete(symbol)
            return
          }
          const error = new Error(`WebSocket error for ${symbol}`)
          console.error(`[Binance WS] Error (${symbol}):`, event)
          this.handlers.onError?.(error)
        }
        
        ws.onclose = () => {
          const closedManually = this.manualCloseSymbols.has(symbol)
          if (closedManually) {
            this.manualCloseSymbols.delete(symbol)
          } else {
            console.log(`[Binance WS] Disconnected: ${symbol}`)
          }
          this.connections.delete(symbol)
          
          // Вызываем onDisconnect только когда все отключились
          if (!closedManually && this.connections.size === 0) {
            this.handlers.onDisconnect?.()
          }
          
          if (!this.isManualClose && !closedManually) {
            this.scheduleReconnect(symbol)
          }
        }
      } catch (err) {
        console.error(`[Binance WS] Connect error (${symbol}):`, err)
        this.handlers.onError?.(err as Error)
        this.scheduleReconnect(symbol)
      }
    })
  }

  private scheduleReconnect(symbol: string) {
    if (this.reconnectTimers.has(symbol) || this.isManualClose) return
    
    const timer = window.setTimeout(() => {
      this.reconnectTimers.delete(symbol)
      if (!this.isManualClose) {
        console.log(`[Binance WS] Reconnecting: ${symbol}`)
        this.connect()
      }
    }, this.reconnectDelayMs)
    
    this.reconnectTimers.set(symbol, timer)
  }

  disconnect() {
    this.isManualClose = true
    
    // Очистить все таймеры
    this.reconnectTimers.forEach(timer => clearTimeout(timer))
    this.reconnectTimers.clear()
    
    // Закрыть все соединения
    this.connections.forEach((ws, sym) => {
      this.manualCloseSymbols.add(sym)
      ws.close()
    })
    this.connections.clear()
  }
}
