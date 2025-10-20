import { useTradingStore } from '@/store/tradingStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatNumber } from '@/lib/utils'

export function TradesList() {
  const trades = useTradingStore(s => s.trades)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">COMPLETED TRADES</CardTitle>
          <div className="text-xs text-gray-500">Last {trades.length} trades</div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[520px] overflow-auto divide-y divide-slate-800">
          {trades.length === 0 && (
            <div className="text-gray-500 text-center py-8">No trades yet</div>
          )}
          {trades.map(t => {
            const pnlCls = t.pnlNet >= 0 ? 'text-emerald-400' : 'text-red-400'
            return (
              <div key={t.id} className="px-4 py-3 hover:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.symbol} · {t.side}</div>
                  <div className={`font-semibold ${pnlCls}`}>{t.pnlNet >= 0 ? '+' : ''}${formatNumber(Math.abs(t.pnlNet), 2)}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t.entryTime} → {t.exitTime} · {t.holdingTime}
                </div>
                <div className="text-xs text-gray-400 mt-1">
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
