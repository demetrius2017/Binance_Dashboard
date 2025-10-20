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
              case 'price_update':
                updatePrice(msg.symbol, msg.price)
                break
              case 'position_update':
                upsertPosition(msg.position)
                break
              case 'trade_executed':
                prependTrade(msg.trade)
                break
              case 'equity_snapshot':
                addEquityPoint({
                  timestamp: msg.time,
                  time: new Date(msg.time * 1000).toISOString(),
                  equity: msg.equity,
                })
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
      if (wsRef.current) {
        try { wsRef.current.close() } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])
}
