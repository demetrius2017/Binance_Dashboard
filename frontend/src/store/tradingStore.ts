import { create } from 'zustand'
import type { Position, Trade, Metrics, EquityPoint, TickerData } from '@/types'

interface TradingState {
  // Data
  positions: Position[]
  trades: Trade[]
  metrics: Metrics
  equityData: EquityPoint[]
  tickers: TickerData[]
  currentEquity: number
  balance: number
  
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
}

export const useTradingStore = create<TradingState>((set, get) => ({
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
  },
  equityData: [],
  tickers: [
    { symbol: 'BTC', price: 110672.50, change24h: 2.34 },
    { symbol: 'ETH', price: 3962.25, change24h: -0.87 },
    { symbol: 'SOL', price: 187.55, change24h: 5.12 },
    { symbol: 'BNB', price: 1095.45, change24h: 1.23 },
  ],
  currentEquity: 10000,
  balance: 10000,
  connected: false,
  
  // Actions
  setPositions: (positions) => set({ positions }),
  upsertPosition: (position) => set((state) => {
    const idx = state.positions.findIndex(p => p.id === position.id)
    const positions = [...state.positions]
    if (idx >= 0) positions[idx] = position
    else positions.unshift(position)
    // Recompute equity when positions change
    const totalUnrealized = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0)
    const currentEquity = state.balance + totalUnrealized
    return { positions, currentEquity }
  }),
  setTrades: (trades) => set({ trades }),
  prependTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades].slice(0, 1000) })),
  setMetrics: (metrics) => set({ metrics }),
  setEquityData: (data) => set({ equityData: data }),
  addEquityPoint: (point) => set((state) => ({
    equityData: [...state.equityData.slice(-4320), point], // Keep 72h (3 days * 24h * 60min)
    currentEquity: point.equity,
  })),
  setTickers: (tickers) => set({ tickers }),
  updatePrice: (symbol, price) => {
    const state = get()
    
    // Update ticker
    const tickers = state.tickers.map(t => 
      t.symbol === symbol ? { ...t, price } : t
    )
    
    // Update positions
    const positions = state.positions.map(pos => {
      if (pos.symbol === symbol) {
        const direction = pos.side === 'LONG' ? 1 : -1
        const priceDiff = price - pos.entryPrice
        const unrealizedPnl = priceDiff * pos.quantity * direction
        const unrealizedPnlPercent = (unrealizedPnl / (pos.entryPrice * pos.quantity)) * 100
        
        return {
          ...pos,
          currentPrice: price,
          unrealizedPnl,
          unrealizedPnlPercent,
          notional: price * pos.quantity,
        }
      }
      return pos
    })
    
    // Recalculate equity
    const totalUnrealized = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0)
    const currentEquity = state.balance + totalUnrealized
    
    set({ tickers, positions, currentEquity })
  },
  setConnected: (connected) => set({ connected }),
}))
