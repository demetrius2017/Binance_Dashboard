import { useTradingStore } from '@/store/tradingStore'
import { cn, formatPrice, formatPercent } from '@/lib/utils'
import { useThemeStyles } from '@/theme/useThemeStyles'

export function TickerBar() {
  const tickers = useTradingStore((state) => state.tickers)
  const { styles } = useThemeStyles()
  
  return (
    <div className={cn('rounded-xl p-4 mb-4 overflow-x-auto transition-all duration-300', styles.ticker)}>
      <div className={cn('flex min-w-max items-center gap-6 divide-x', styles.divider)}>
        {tickers.map((ticker) => (
          <div key={ticker.symbol} className="flex items-center gap-2 px-4 first:pl-0">
            {ticker.symbol === 'BTC' && <span className={cn('text-base', styles.highlight)}>₿</span>}
            {ticker.symbol === 'SOL' && <span className={cn('text-base', styles.highlight)}>◎</span>}
            {ticker.symbol === 'BNB' && <span className={cn('text-base', styles.highlight)}>◆</span>}
            <span className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>{ticker.symbol}</span>
            <span className={cn('font-mono text-sm font-semibold', styles.highlight)}>${formatPrice(ticker.price)}</span>
            <span
              className={cn(
                'text-sm font-semibold transition-colors duration-200',
                ticker.change24h >= 0 ? styles.positive : styles.negative,
              )}
            >
              {formatPercent(ticker.change24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
