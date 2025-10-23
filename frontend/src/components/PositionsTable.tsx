import { useTradingStore } from '@/store/tradingStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn, formatNumber, formatPercent } from '@/lib/utils'
import { useThemeStyles } from '@/theme/useThemeStyles'

export function PositionsTable() {
  const positions = useTradingStore(s => s.positions)
  const { styles } = useThemeStyles()

  const totalNotional = positions.reduce((s, p) => s + p.notional, 0)
  const totalUnreal = positions.reduce((s, p) => s + p.unrealizedPnl, 0)

  return (
    <Card className={styles.card}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">OPEN POSITIONS</CardTitle>
          <div className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>
            Notional: ${formatNumber(totalNotional, 2)} · PnL:{' '}
            <span className={cn(totalUnreal >= 0 ? styles.positive : styles.negative)}>
              {totalUnreal >= 0 ? '+' : ''}${formatNumber(totalUnreal, 2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={cn('text-left text-xs uppercase tracking-wide', styles.tableHead)}>
              <tr>
                <th className="p-3 text-left">Symbol</th>
                <th className="p-3 text-right">Side</th>
                <th className="p-3 text-right">Entry</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Notional</th>
                <th className="p-3 text-right">Unrealized PnL</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr>
                  <td colSpan={7} className={cn('p-6 text-center text-sm', styles.muted)}>
                    No open positions
                  </td>
                </tr>
              )}
              {positions.map((p) => {
                const pnlCls = p.unrealizedPnl >= 0 ? styles.positive : styles.negative
                const sideCls = p.side === 'LONG' ? styles.positive : styles.negative
                return (
                  <tr key={p.id} className={cn('transition-colors duration-200', styles.tableRow)}>
                    <td className={cn('p-3 font-semibold', styles.highlight)}>{p.symbol}</td>
                    <td className={cn('p-3 text-right font-semibold uppercase tracking-wide', sideCls)}>{p.side}</td>
                    <td className={cn('p-3 text-right font-mono', styles.mutedStrong)}>
                      ${formatNumber(p.entryPrice, 2)}
                    </td>
                    <td className={cn('p-3 text-right font-mono', styles.highlight)}>
                      ${formatNumber(p.currentPrice, 2)}
                    </td>
                    <td className={cn('p-3 text-right font-mono', styles.mutedStrong)}>
                      {formatNumber(p.quantity, 4)}
                    </td>
                    <td className={cn('p-3 text-right font-mono', styles.highlight)}>
                      ${formatNumber(p.notional, 2)}
                    </td>
                    <td className={cn('p-3 text-right font-semibold', pnlCls)}>
                      {p.unrealizedPnl >= 0 ? '+' : ''}${formatNumber(p.unrealizedPnl, 2)}{' '}
                      ({formatPercent(p.unrealizedPnlPercent)})
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
