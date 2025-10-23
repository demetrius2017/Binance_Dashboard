import { useTradingStore } from '@/store/tradingStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  Target,
  Award,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  ListFilter,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { useThemeStyles } from '@/theme/useThemeStyles'

export function MetricsGrid() {
  const metrics = useTradingStore((state) => state.metrics)
  const { styles } = useThemeStyles()

  const formatCurrency = (value: number) => `${value >= 0 ? '+' : '-'}$${formatNumber(Math.abs(value), 2)}`

  const totalTone = metrics.totalPnL >= 0 ? styles.positive : styles.negative
  const TotalIcon: LucideIcon = metrics.totalPnL >= 0 ? TrendingUp : TrendingDown
  const realizedPnL = metrics.realizedPnL ?? 0
  const unrealizedPnL = metrics.unrealizedPnL ?? 0
  const flatTrades = metrics.flatTrades ?? 0

  const cards: Array<{
    key: string
    label: string
    value: string
    hint: string
    Icon: LucideIcon
    tone: string
  }> = [
    {
      key: 'total-pnl',
      label: 'Total PnL',
      value: `${formatCurrency(metrics.totalPnL)} (${formatNumber(metrics.totalPnLPercent, 2)}%)`,
      hint: 'Realized (24h) + current unrealized',
      Icon: TotalIcon,
      tone: totalTone,
    },
    {
      key: 'win-rate',
      label: 'Win Rate',
      value: `${formatNumber(metrics.winRate, 1)}%`,
      hint: `${metrics.winningTrades}/${metrics.totalTrades} trades`,
      Icon: Target,
      tone: styles.positive,
    },
    {
      key: 'sharpe',
      label: 'Sharpe Ratio',
      value: formatNumber(metrics.sharpeRatio, 2),
      hint: 'Risk-adjusted return',
      Icon: Award,
      tone: styles.highlight,
    },
    {
      key: 'drawdown',
      label: 'Max Drawdown',
      value: `${formatNumber(metrics.maxDrawdown, 1)}%`,
      hint: 'Peak-to-trough',
      Icon: AlertTriangle,
      tone: styles.negative,
    },
    {
      key: 'profit-factor',
      label: 'Profit Factor',
      value: formatNumber(metrics.profitFactor, 2),
      hint: 'Wins / losses',
      Icon: Activity,
      tone: styles.highlight,
    },
    {
      key: 'realized-pnl',
      label: 'Realized PnL',
      value: formatCurrency(realizedPnL),
      hint: 'Realized over last 24h',
      Icon: Wallet,
      tone: realizedPnL >= 0 ? styles.positive : styles.negative,
    },
    {
      key: 'unrealized-pnl',
      label: 'Unrealized PnL',
      value: formatCurrency(unrealizedPnL),
  hint: 'Active positions mark-to-market',
      Icon: Activity,
      tone: unrealizedPnL >= 0 ? styles.positive : styles.negative,
    },
    {
      key: 'flat-trades',
      label: 'Flat Trades',
      value: formatNumber(flatTrades, 0),
      hint: 'Filtered micro-fills',
      Icon: ListFilter,
      tone: styles.mutedStrong,
    },
  ]
  
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map(({ key, label, value, hint, Icon, tone }) => (
        <Card key={key} className={styles.card}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('h-4 w-4', tone)} />
              <span className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>{label}</span>
            </div>
            <div className={cn('text-2xl font-bold', tone)}>{value}</div>
            <div className={cn('text-xs', styles.muted)}>{hint}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
