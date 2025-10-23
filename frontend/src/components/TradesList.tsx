import { useTradingStore } from '@/store/tradingStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn, formatNumber } from '@/lib/utils'
import { useThemeStyles } from '@/theme/useThemeStyles'

export function TradesList() {
  const trades = useTradingStore(s => s.trades)
  const { styles } = useThemeStyles()

  return (
    <Card className={styles.card}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">COMPLETED TRADES</CardTitle>
          <div className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>
            Last {trades.length} trades
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn('max-h-[520px] overflow-auto divide-y transition-colors duration-200', styles.divider)}>
          {trades.length === 0 && (
            <div className={cn('py-8 text-center text-sm', styles.muted)}>No trades yet</div>
          )}
          {trades.map(t => {
            const pnlCls = t.pnlNet >= 0 ? styles.positive : styles.negative
            return (
              <div key={t.id} className={cn('px-4 py-3 transition-colors duration-200', styles.tradeRow)}>
                <div className="flex items-center justify-between">
                  <div className={cn('font-semibold uppercase tracking-wide', styles.highlight)}>
                    {t.symbol} · {t.side}
                  </div>
                  <div className={cn('font-semibold', pnlCls)}>
                    {t.pnlNet >= 0 ? '+' : ''}${formatNumber(Math.abs(t.pnlNet), 2)}
                  </div>
                </div>
                <div className={cn('mt-1 text-xs font-medium', styles.mutedStrong)}>
                  {t.entryTime} → {t.exitTime} · {t.holdingTime}
                </div>
                <div className={cn('mt-1 text-xs', styles.muted)}>
                  Qty {formatNumber(t.quantity, 4)} · Entry ${formatNumber(t.entryPrice, 2)} · Exit ${formatNumber(t.exitPrice, 2)} · Fee ${formatNumber(t.commission, 2)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
