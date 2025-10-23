import { useEffect, useRef, useState } from 'react'
import { useTradingStore } from '@/store/tradingStore'
import { BinanceWebSocketClient, type BinanceEventHandler } from '@/services/binanceWebSocket'
import { BinanceRestClient } from '@/services/binanceRestClient'

type UseBinanceDirectOptions = {
  symbols: string[]
  enableTrades?: boolean
  tickerRefreshMs?: number
}

/**
 * Прямое подключение к Binance без промежуточного backend
 * - WebSocket для live цен (bookTicker)
 * - REST для тикеров 24h (периодический polling)
 */
export function useBinanceDirect({ 
  symbols, 
  enableTrades = false,
  tickerRefreshMs = 5000 
}: UseBinanceDirectOptions) {
  const wsClientRef = useRef<BinanceWebSocketClient | null>(null)
  const restClientRef = useRef(new BinanceRestClient())
  const tickerIntervalRef = useRef<number | null>(null)
  
  const setConnected = useTradingStore(s => s.setConnected)
  const updatePrice = useTradingStore(s => s.updatePrice)
  const setTickers = useTradingStore(s => s.setTickers)
  
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const streams: ('bookTicker' | 'aggTrade')[] = ['bookTicker']
    if (enableTrades) streams.push('aggTrade')
    
    const handlers: BinanceEventHandler = {
      onBookTicker: (data) => {
        const sym = data.s.toUpperCase()
        const normalized = sym.endsWith('USDT') ? sym.slice(0, -4) : sym
        const bid = parseFloat(data.b)
        const ask = parseFloat(data.a)
        const mid = (bid + ask) / 2
        
        updatePrice(normalized, mid)
      },
      
      onConnect: () => {
        console.log('[useBinanceDirect] Connected')
        setConnected(true)
        setIsReady(true)
      },
      
      onDisconnect: () => {
        console.log('[useBinanceDirect] Disconnected')
        setConnected(false)
      },
      
      onError: (error) => {
        console.error('[useBinanceDirect] Error:', error)
      }
    }
    
    const wsClient = new BinanceWebSocketClient(symbols, streams, handlers)
    wsClientRef.current = wsClient
    wsClient.connect()
    
    // Периодический опрос тикеров
    const fetchTickers = async () => {
      try {
        const tickers = await restClientRef.current.getTicker24h()
        const mapped = tickers.map(t => ({
          symbol: t.symbol.endsWith('USDT') ? t.symbol.slice(0, -4) : t.symbol,
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume24h: parseFloat(t.quoteVolume),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
        }))
        setTickers(mapped)
      } catch (err) {
        console.error('[useBinanceDirect] Ticker fetch error:', err)
      }
    }
    
    // Первый запрос сразу
    fetchTickers()
    
    // Затем периодически
    tickerIntervalRef.current = window.setInterval(fetchTickers, tickerRefreshMs)
    
    return () => {
      wsClient.disconnect()
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current)
      }
    }
  }, [symbols, enableTrades, tickerRefreshMs, updatePrice, setConnected, setTickers])

  return { isReady }
}
