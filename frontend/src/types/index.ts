export interface Position {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  currentPrice: number
  quantity: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  notional: number
}

export interface Trade {
  id: number
  model: string
  side: 'LONG' | 'SHORT'
  symbol: string
  entryPrice: number
  exitPrice: number
  quantity: number
  entryTime: string
  exitTime: string
  holdingTime: string
  notional: string
  pnlNet: number
  pnlPercent: number
  commission: number
}

export interface Metrics {
  totalPnL: number
  totalPnLPercent: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
}

export interface EquityPoint {
  timestamp: number
  time: string
  equity: number
}

export interface TickerData {
  symbol: string
  price: number
  change24h: number
}
