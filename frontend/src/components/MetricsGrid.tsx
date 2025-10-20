import { useTradingStore } from '@/store/tradingStore'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Award, AlertTriangle, Activity } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function MetricsGrid() {
  const metrics = useTradingStore((state) => state.metrics)
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{formatNumber(metrics.winRate, 1)}%</div>
          <div className="text-xs text-gray-500">{metrics.winningTrades}/{metrics.totalTrades} trades</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Sharpe Ratio</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{formatNumber(metrics.sharpeRatio, 2)}</div>
          <div className="text-xs text-gray-500">Risk-adjusted return</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Max Drawdown</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{formatNumber(metrics.maxDrawdown, 1)}%</div>
          <div className="text-xs text-gray-500">Peak to trough</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Profit Factor</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{formatNumber(metrics.profitFactor, 2)}</div>
          <div className="text-xs text-gray-500">Wins / Losses</div>
        </CardContent>
      </Card>
    </div>
  )
}
