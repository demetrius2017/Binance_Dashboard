import { useEffect, useRef } from 'react'
import { useTradingStore } from '@/store/tradingStore'
import type { RealtimeMessage } from '@/types'

type Options = {
  url: string
  autoReconnect?: boolean
  reconnectDelayMs?: number
}

export function useWebSocket({ url, autoReconnect = true, reconnectDelayMs = 2000 }: Options) {
  const wsRef = useRef<WebSocket | null>(null)
  const setConnected = useTradingStore(s => s.setConnected)
  // actions
  const addEquityPoint = useTradingStore(s => s.addEquityPoint)
  const updatePrice = useTradingStore(s => s.updatePrice)
  const upsertPosition = useTradingStore(s => s.upsertPosition)
  const prependTrade = useTradingStore(s => s.prependTrade)
  const setTrades = useTradingStore(s => s.setTrades)
  const setMetrics = useTradingStore(s => s.setMetrics)
  const setTickers = useTradingStore(s => s.setTickers)
  const setAccount = useTradingStore(s => s.setAccount)

  useEffect(() => {
    let closedByUser = false
    let reconnectTimer: number | null = null

    const connect = () => {
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const msg: RealtimeMessage = JSON.parse(event.data)
            switch (msg.type) {
              case 'price_update': {
                const sym = (msg.symbol || '').toUpperCase()
                const norm = sym.endsWith('USDT') ? sym.slice(0, -4) : sym
                updatePrice(norm, msg.price)
                break
              }
              case 'position_update':
                upsertPosition(msg.position)
                break
              case 'trade_executed':
                prependTrade(msg.trade)
                break
              case 'trades_snapshot':
                setTrades(msg.trades)
                break
              case 'equity_snapshot':
                addEquityPoint({
                  timestamp: msg.time * 1000,
                  time: new Date(msg.time * 1000).toISOString(),
                  equity: msg.equity,
                  balance: msg.balance,
                  unrealizedPnl: msg.unrealizedPnl,
                })
                break
              case 'metrics_snapshot':
                setMetrics(msg.metrics)
                break
              case 'ticker_snapshot':
                setTickers(msg.tickers)
                break
              case 'account_snapshot':
                setAccount(msg.account)
                break
              case 'heartbeat':
                // no-op for now
                break
            }
          } catch (e) {
            console.error('WS message parse error', e)
          }
        }

        ws.onclose = () => {
          setConnected(false)
          wsRef.current = null
          if (!closedByUser && autoReconnect) {
            if (reconnectTimer) window.clearTimeout(reconnectTimer)
            reconnectTimer = window.setTimeout(connect, reconnectDelayMs)
          }
        }

        ws.onerror = () => {
          // handled by onclose
        }
      } catch (e) {
        console.error('WS connect error', e)
      }
    }

    connect()

    return () => {
      closedByUser = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      const ws = wsRef.current
      if (ws) {
        const safeClose = () => {
          try { ws.close(1000, 'component-unmount') } catch { /* noop */ }
        }
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.addEventListener('open', safeClose, { once: true })
        } else if (ws.readyState === WebSocket.OPEN) {
          safeClose()
        }
      }
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])
}
