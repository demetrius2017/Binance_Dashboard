import { useTradingStore } from '@/store/tradingStore'
import { formatPrice, formatPercent } from '@/lib/utils'

export function TickerBar() {
  const tickers = useTradingStore((state) => state.tickers)
  
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 overflow-x-auto">
      <div className="flex gap-6 min-w-max">
        {tickers.map((ticker) => (
          <div key={ticker.symbol} className="flex items-center gap-2">
            {ticker.symbol === 'BTC' && <span className="text-orange-400">₿</span>}
            {ticker.symbol === 'SOL' && <span className="text-purple-400">◎</span>}
            {ticker.symbol === 'BNB' && <span className="text-yellow-400">◆</span>}
            <span className="text-gray-400 text-sm">{ticker.symbol}</span>
            <span className="font-mono font-semibold">${formatPrice(ticker.price)}</span>
            <span className={`text-sm font-medium ${ticker.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatPercent(ticker.change24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
