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
  realizedPnL?: number
  unrealizedPnL?: number
  flatTrades?: number
}

export interface EquityPoint {
  timestamp: number
  time: string
  equity: number
  balance?: number
  unrealizedPnl?: number
}

export interface TickerData {
  symbol: string
  price: number
  change24h: number
}

export interface AccountSummary {
  balance: number
  availableBalance: number
  marginRatio: number
  leverage: number
  pnl24h: number
}

// Realtime WS message shapes
export type PriceUpdate = {
  type: 'price_update'
  symbol: string
  price: number
  bid?: number
  ask?: number
  ts?: number
}

export type PositionUpdate = {
  type: 'position_update'
  position: Position
}

export type TradeExecuted = {
  type: 'trade_executed'
  trade: Trade
}

export type TradesSnapshot = {
  type: 'trades_snapshot'
  trades: Trade[]
  ts: number
}

export type EquitySnapshot = {
  type: 'equity_snapshot'
  time: number
  equity: number
  balance?: number
  unrealizedPnl?: number
}

export type MetricsSnapshot = {
  type: 'metrics_snapshot'
  metrics: Metrics
  ts: number
}

export type TickerSnapshot = {
  type: 'ticker_snapshot'
  tickers: TickerData[]
  ts: number
}

export type AccountSnapshot = {
  type: 'account_snapshot'
  account: AccountSummary
  ts: number
}

export type Heartbeat = {
  type: 'heartbeat'
  ts: number
}

export type RealtimeMessage =
  | PriceUpdate
  | PositionUpdate
  | TradeExecuted
  | TradesSnapshot
  | EquitySnapshot
  | MetricsSnapshot
  | TickerSnapshot
  | AccountSnapshot
  | Heartbeat
