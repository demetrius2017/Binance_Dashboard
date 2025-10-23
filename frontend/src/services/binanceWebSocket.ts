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
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private isManualClose = false
  private symbols: string[]
  private streams: ('bookTicker' | 'aggTrade')[]
  private handlers: BinanceEventHandler
  private reconnectDelayMs: number
  
  constructor(
    symbols: string[],
    streams: ('bookTicker' | 'aggTrade')[],
    handlers: BinanceEventHandler,
    reconnectDelayMs = 3000
  ) {
    this.symbols = symbols
    this.streams = streams
    this.handlers = handlers
    this.reconnectDelayMs = reconnectDelayMs
  }

  connect() {
    this.isManualClose = false
    
    // Формат: wss://fstream.binance.com/stream?streams=btcusdt@bookTicker/ethusdt@bookTicker
    const streamNames = this.symbols.flatMap(sym => 
      this.streams.map(stream => `${sym.toLowerCase()}@${stream}`)
    )
    const url = `wss://fstream.binance.com/stream?streams=${streamNames.join('/')}`
    
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        console.log('[Binance WS] Connected:', streamNames)
        this.handlers.onConnect?.()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const data = msg.data
          
          if (!data) return
          
          switch (data.e) {
            case 'bookTicker':
              this.handlers.onBookTicker?.(data as BinanceBookTickerEvent)
              break
            case 'aggTrade':
              this.handlers.onTrade?.(data as BinanceTradeEvent)
              break
          }
        } catch (err) {
          console.error('[Binance WS] Parse error:', err)
        }
      }
      
      this.ws.onerror = (event) => {
        const error = new Error('WebSocket error')
        console.error('[Binance WS] Error:', event)
        this.handlers.onError?.(error)
      }
      
      this.ws.onclose = () => {
        console.log('[Binance WS] Disconnected')
        this.handlers.onDisconnect?.()
        
        if (!this.isManualClose) {
          this.scheduleReconnect()
        }
      }
    } catch (err) {
      console.error('[Binance WS] Connect error:', err)
      this.handlers.onError?.(err as Error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      console.log('[Binance WS] Reconnecting...')
      this.connect()
    }, this.reconnectDelayMs)
  }

  disconnect() {
    this.isManualClose = true
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
