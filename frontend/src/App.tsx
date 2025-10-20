import { useEffect } from 'react'
import { TickerBar } from './components/TickerBar'
import { MetricsGrid } from './components/MetricsGrid'
import { EquityChart } from './components/EquityChart'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { useTradingStore } from './store/tradingStore'
import { formatNumber, formatPercent } from './lib/utils'
import { PositionsTable } from './components/PositionsTable'
import { TradesList } from './components/TradesList'
// import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const currentEquity = useTradingStore((state) => state.currentEquity)
  const balance = useTradingStore((state) => state.balance)
  const connected = useTradingStore((state) => state.connected)
  const setMetrics = useTradingStore((state) => state.setMetrics)
  const setEquityData = useTradingStore((state) => state.setEquityData)
  const addEquityPoint = useTradingStore((state) => state.addEquityPoint)
  const updatePrice = useTradingStore((state) => state.updatePrice)
  // const wsUrl = import.meta.env.VITE_WS_URL as string | undefined
  // useWebSocket({ url: wsUrl ?? 'ws://localhost:8000/ws' })
  
  // Initialize mock data
  useEffect(() => {
    setMetrics({
      totalPnL: 46.15,
      totalPnLPercent: 0.46,
      winRate: 75.0,
      sharpeRatio: 1.82,
      maxDrawdown: -2.3,
      avgWin: 17.09,
      avgLoss: -5.13,
      profitFactor: 2.89,
      totalTrades: 4,
      winningTrades: 3,
      losingTrades: 1,
    })

    // Генерация исторической equity-кривой за 72 часа (1 точка в минуту)
    const now = Date.now()
    const points = 72 * 60
    const data: { timestamp: number; time: string; equity: number }[] = []
    let equity = 10000
    for (let i = 0; i < points; i++) {
      const ts = now - (points - i) * 60 * 1000
      // Плавное движение + редкие сделки
      if (Math.random() > 0.995) {
        equity += (Math.random() - 0.3) * 50
      } else {
        equity += (Math.random() - 0.5) * 2
      }
      data.push({ timestamp: ts, time: '', equity: parseFloat(equity.toFixed(2)) })
    }
    setEquityData(data)
  }, [setMetrics])
  
  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Small random price changes
      const btcChange = (Math.random() - 0.48) * 50
      const ethChange = (Math.random() - 0.48) * 2
      const solChange = (Math.random() - 0.48) * 0.5
      const bnbChange = (Math.random() - 0.48) * 5
      
      updatePrice('BTC', 110672.50 + btcChange)
      updatePrice('ETH', 3962.25 + ethChange)
      updatePrice('SOL', 187.55 + solChange)
      updatePrice('BNB', 1095.45 + bnbChange)

      // Live обновление equity (микро-изменения)
      const last = (useTradingStore as any).getState().currentEquity as number
      const newEquity = last + (Math.random() - 0.48) * 0.5
      addEquityPoint({ timestamp: Date.now(), time: '', equity: parseFloat(newEquity.toFixed(2)) })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [updatePrice])
  
  const totalPnL = currentEquity - balance
  const totalPnLPercent = ((totalPnL / balance) * 100)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <span className="text-xs text-gray-400">{connected ? 'Live' : 'Disconnected'}</span>
      </div>
      
      {/* Top Bar */}
      <TickerBar />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Equity Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-bold">TOTAL ACCOUNT VALUE</CardTitle>
                <div className="flex gap-2">
                  {['ALL', '72H', '24H', '12H'].map((range) => (
                    <button
                      key={range}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-slate-800 text-gray-400 hover:bg-slate-700"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="text-4xl font-bold">
                  ${formatNumber(currentEquity, 2)}
                </div>
                <div className={`text-xl font-semibold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${formatNumber(Math.abs(totalPnL), 2)} ({formatPercent(totalPnLPercent)})
                </div>
              </div>
            </CardHeader>
          </Card>
          
          {/* Equity Chart */}
          <Card>
            <CardContent className="p-4">
              <EquityChart />
            </CardContent>
          </Card>
          
          {/* Metrics */}
          <MetricsGrid />
          
          {/* Additional Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                  <div className="text-lg font-semibold text-emerald-400">+$17.09</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                  <div className="text-lg font-semibold text-red-400">$-5.13</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                  <div className="text-lg font-semibold text-gray-300">4</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <TradesList />
          <PositionsTable />
        </div>
      </div>
    </div>
  )
}

export default App
