import { useTradingStore } from '@/store/tradingStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatNumber, formatPercent } from '@/lib/utils'

export function PositionsTable() {
  const positions = useTradingStore(s => s.positions)

  const totalNotional = positions.reduce((s, p) => s + p.notional, 0)
  const totalUnreal = positions.reduce((s, p) => s + p.unrealizedPnl, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">OPEN POSITIONS</CardTitle>
          <div className="text-xs text-gray-400">
            Notional: ${formatNumber(totalNotional, 2)} · PnL: <span className={totalUnreal >= 0 ? 'text-emerald-400' : 'text-red-400'}>{totalUnreal >= 0 ? '+' : ''}${formatNumber(totalUnreal, 2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/60 text-gray-400">
              <tr>
                <th className="text-left p-3">Symbol</th>
                <th className="text-right p-3">Side</th>
                <th className="text-right p-3">Entry</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Notional</th>
                <th className="text-right p-3">Unrealized PnL</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">No open positions</td>
                </tr>
              )}
              {positions.map((p) => {
                const pnlCls = p.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                const sideCls = p.side === 'LONG' ? 'text-emerald-300' : 'text-red-300'
                return (
                  <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                    <td className="p-3 font-medium">{p.symbol}</td>
                    <td className={`p-3 text-right font-semibold ${sideCls}`}>{p.side}</td>
                    <td className="p-3 text-right">${formatNumber(p.entryPrice, 2)}</td>
                    <td className="p-3 text-right">${formatNumber(p.currentPrice, 2)}</td>
                    <td className="p-3 text-right">{formatNumber(p.quantity, 4)}</td>
                    <td className="p-3 text-right">${formatNumber(p.notional, 2)}</td>
                    <td className={`p-3 text-right font-semibold ${pnlCls}`}>
                      {p.unrealizedPnl >= 0 ? '+' : ''}${formatNumber(Math.abs(p.unrealizedPnl), 2)} ({formatPercent(p.unrealizedPnlPercent)})
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
