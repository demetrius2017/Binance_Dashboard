import { useEffect } from 'react'
import { TickerBar } from './components/TickerBar'
import { MetricsGrid } from './components/MetricsGrid'
import { EquityChart } from './components/EquityChart'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { useTradingStore } from './store/tradingStore'
import { cn, formatNumber, formatPercent } from './lib/utils'
import { PositionsTable } from './components/PositionsTable'
import { TradesList } from './components/TradesList'
import { useWebSocket } from './hooks/useWebSocket'
import { ChartErrorBoundary } from './components/ChartErrorBoundary'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { useThemeStyles } from './theme/useThemeStyles'

const rangeOptions = ['ALL', '72H', '24H', '12H'] as const

function App() {
  const currentEquity = useTradingStore((state) => state.currentEquity)
  const balance = useTradingStore((state) => state.balance)
  const account = useTradingStore((state) => state.account)
  const connected = useTradingStore((state) => state.connected)
  const wsUrl = import.meta.env.VITE_WS_URL as string | undefined
  const { theme, styles } = useThemeStyles()
  useWebSocket({ url: wsUrl ?? 'ws://localhost:8000/ws' })
  
  useEffect(() => {
    document.body.dataset.dashboardTheme = theme
    return () => {
      delete document.body.dataset.dashboardTheme
    }
  }, [theme])

  const totalPnL = currentEquity - balance
  const totalPnLPercent = balance ? (totalPnL / balance) * 100 : 0
  const accountStats = [
    {
      label: 'Available Balance',
      value: `$${formatNumber(account.availableBalance, 2)}`,
      tone: styles.highlight,
    },
    {
      label: 'Margin Ratio',
      value: `${formatNumber(account.marginRatio, 2)}%`,
      tone: styles.mutedStrong,
    },
    {
      label: '24h PnL',
      value: `${account.pnl24h >= 0 ? '+' : '-'}$${formatNumber(Math.abs(account.pnl24h), 2)}`,
      tone: account.pnl24h >= 0 ? styles.positive : styles.negative,
    },
    {
      label: 'Leverage',
      value: `${formatNumber(account.leverage, 1)}×`,
      tone: styles.highlight,
    },
  ]

  return (
    <div className={cn('min-h-screen p-4 transition-colors duration-500', styles.page)}>
      {/* Connection & Theme Controls */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-3 sm:flex-row sm:items-center">
        <ThemeSwitcher />
        <div className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-300', styles.statusPill)}>
          <div className={cn('h-2 w-2 rounded-full transition-colors duration-300', connected ? styles.statusDotActive : styles.statusDot)} />
          <span className={cn('text-xs font-semibold uppercase tracking-wide', styles.badge)}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Top Bar */}
      <TickerBar />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Equity Header */}
          <Card className={styles.card}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-bold">TOTAL ACCOUNT VALUE</CardTitle>
                <div className="flex gap-2">
                  {rangeOptions.map((range, idx) => (
                    <button
                      key={range}
                      type="button"
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200',
                        styles.chip,
                        idx === 0 && styles.chipActive,
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-baseline gap-4">
                <div className={cn('text-4xl font-bold', styles.highlight)}>
                  ${formatNumber(currentEquity, 2)}
                </div>
                <div className={cn('text-xl font-semibold', totalPnL >= 0 ? styles.positive : styles.negative)}>
                  {totalPnL >= 0 ? '+' : ''}${formatNumber(Math.abs(totalPnL), 2)} ({formatPercent(totalPnLPercent)})
                </div>
              </div>
            </CardHeader>
          </Card>
          
          {/* Equity Chart */}
          <ChartErrorBoundary>
            <Card className={styles.card}>
              <CardContent className="p-4">
                <EquityChart />
              </CardContent>
            </Card>
          </ChartErrorBoundary>
          
          {/* Metrics */}
          <MetricsGrid />
          
          {/* Additional Stats */}
          <Card className={styles.card}>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                {accountStats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>
                      {stat.label}
                    </div>
                    <div className={cn('text-lg font-semibold', stat.tone)}>{stat.value}</div>
                  </div>
                ))}
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
