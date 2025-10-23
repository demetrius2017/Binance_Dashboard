import { create } from 'zustand'
import type { Position, Trade, Metrics, EquityPoint, TickerData, AccountSummary } from '@/types'

interface TradingState {
  // Data
  positions: Position[]
  trades: Trade[]
  metrics: Metrics
  equityData: EquityPoint[]
  tickers: TickerData[]
  currentEquity: number
  balance: number
  account: AccountSummary
  
  // WebSocket status
  connected: boolean
  
  // Actions
  setPositions: (positions: Position[]) => void
  upsertPosition: (position: Position) => void
  setTrades: (trades: Trade[]) => void
  prependTrade: (trade: Trade) => void
  setMetrics: (metrics: Metrics) => void
  setEquityData: (data: EquityPoint[]) => void
  addEquityPoint: (point: EquityPoint) => void
  setTickers: (tickers: TickerData[]) => void
  updatePrice: (symbol: string, price: number) => void
  setConnected: (connected: boolean) => void
  setAccount: (account: AccountSummary) => void
}

export const useTradingStore = create<TradingState>((set) => ({
  // Initial state
  positions: [],
  trades: [],
  metrics: {
    totalPnL: 0,
    totalPnLPercent: 0,
    winRate: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    flatTrades: 0,
  },
  equityData: [],
  tickers: [],
  currentEquity: 0,
  balance: 0,
  account: {
    balance: 0,
    availableBalance: 0,
    marginRatio: 0,
    leverage: 0,
    pnl24h: 0,
  },
  connected: false,
  
  // Actions
  setPositions: (positions) => set({ positions }),
  upsertPosition: (position) => set((state) => {
    const idx = state.positions.findIndex(p => p.id === position.id)
    if (position.quantity === 0) {
      if (idx === -1) {
        return { positions: state.positions }
      }
      const next = state.positions.filter(p => p.id !== position.id)
      return { positions: next }
    }
    const positions = [...state.positions]
    if (idx >= 0) {
      positions[idx] = position
    } else {
      positions.unshift(position)
    }
    return { positions }
  }),
  setTrades: (trades) => set({ trades }),
  prependTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades].slice(0, 1000) })),
  setMetrics: (metrics) => set({ metrics }),
  setEquityData: (data) => set({ equityData: data }),
  addEquityPoint: (point) => set((state) => {
    const filtered = state.equityData.filter(p => p.timestamp !== point.timestamp)
    const next = [...filtered, point].sort((a, b) => a.timestamp - b.timestamp)
    const trimmed = next.slice(-4320) // 72h with 1-min cadence
    const nextState: {
      equityData: EquityPoint[]
      currentEquity: number
      balance?: number
    } = {
      equityData: trimmed,
      currentEquity: point.equity,
    }
    if (typeof point.balance === 'number') {
      nextState.balance = point.balance
    }
    return nextState
  }),
  setTickers: (tickers) => set({ tickers }),
  setAccount: (account) => set({ account, balance: account.balance }),
  updatePrice: (symbol, price) => set((state) => {
    const normalized = symbol.toUpperCase()

    const tickers = (() => {
      const idx = state.tickers.findIndex(t => t.symbol === normalized)
      if (idx === -1) {
        return [...state.tickers, { symbol: normalized, price, change24h: 0 }]
      }
      return state.tickers.map((t, i) => (i === idx ? { ...t, price } : t))
    })()

    const positions = state.positions.map(pos => (
      pos.symbol === normalized
        ? { ...pos, currentPrice: price, notional: price * pos.quantity }
        : pos
    ))

    return { tickers, positions }
  }),
  setConnected: (connected) => set({ connected }),
}))
