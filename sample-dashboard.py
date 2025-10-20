import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, Target, Award, AlertTriangle } from 'lucide-react';

const OCCEquityDashboard = () => {
  const [timeRange, setTimeRange] = useState('72H');
  const [currentEquity, setCurrentEquity] = useState(10000);
  const [equityData, setEquityData] = useState([]);
  const [trades, setTrades] = useState([
    {
      id: 1,
      model: 'OCC R7',
      side: 'LONG',
      symbol: 'BTCUSDT',
      entryPrice: 94250.00,
      exitPrice: 94680.00,
      quantity: 0.02,
      entryTime: '10/20, 6:28 PM',
      exitTime: '10/20, 8:43 PM',
      holdingTime: '2H 15M',
      notional: '$1,885 → $1,894',
      pnlNet: 8.52,
      pnlPercent: 0.45,
      commission: 0.38,
    },
    {
      id: 2,
      model: 'OCC R7',
      side: 'SHORT',
      symbol: 'ETHUSDT',
      entryPrice: 3964.90,
      exitPrice: 3930.00,
      quantity: 0.93,
      entryTime: '10/20, 2:15 PM',
      exitTime: '10/20, 4:52 PM',
      holdingTime: '2H 37M',
      notional: '$3,687 → $3,655',
      pnlNet: 31.87,
      pnlPercent: 0.86,
      commission: 0.70,
    },
    {
      id: 3,
      model: 'OCC R7',
      side: 'LONG',
      symbol: 'SOLUSDT',
      entryPrice: 187.30,
      exitPrice: 186.85,
      quantity: 10.5,
      entryTime: '10/20, 11:08 AM',
      exitTime: '10/20, 1:22 PM',
      holdingTime: '2H 14M',
      notional: '$1,967 → $1,962',
      pnlNet: -5.13,
      pnlPercent: -0.26,
      commission: 0.42,
    },
    {
      id: 4,
      model: 'OCC R7',
      side: 'LONG',
      symbol: 'BTCUSDT',
      entryPrice: 93980.00,
      exitPrice: 94515.00,
      quantity: 0.021,
      entryTime: '10/20, 7:45 AM',
      exitTime: '10/20, 10:12 AM',
      holdingTime: '2H 27M',
      notional: '$1,974 → $1,985',
      pnlNet: 10.89,
      pnlPercent: 0.55,
      commission: 0.36,
    },
  ]);

  const [metrics, setMetrics] = useState({
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
  });

  // Генерация equity curve за 72 часа
  useEffect(() => {
    const now = Date.now();
    const points = 72 * 60; // 72 часа * 60 минут
    const data = [];
    let equity = 10000;
    
    for (let i = 0; i < points; i++) {
      const timestamp = now - (points - i) * 60 * 1000;
      
      // Симуляция реалистичного движения капитала
      if (i > 0 && Math.random() > 0.995) {
        // Событие сделки (0.5% вероятность каждую минуту)
        const tradePnL = (Math.random() - 0.3) * 50; // Смещение в сторону профита
        equity += tradePnL;
      } else {
        // Плавное движение между сделками
        equity += (Math.random() - 0.5) * 2;
      }
      
      data.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        equity: parseFloat(equity.toFixed(2)),
      });
    }
    
    setEquityData(data);
    setCurrentEquity(equity);
  }, []);

  // Live update каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      setEquityData(prev => {
        const lastEquity = prev[prev.length - 1]?.equity || 10000;
        const newEquity = lastEquity + (Math.random() - 0.48) * 0.5; // Очень маленькие изменения
        const newPoint = {
          timestamp: Date.now(),
          time: new Date().toLocaleTimeString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          equity: parseFloat(newEquity.toFixed(2)),
        };
        
        // Сдвигаем окно: удаляем старую точку, добавляем новую
        const updated = [...prev.slice(1), newPoint];
        setCurrentEquity(newEquity);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pnl = data.equity - 10000;
      const pnlPercent = ((pnl / 10000) * 100).toFixed(2);
      
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
          <div className="text-xs text-gray-400 mb-1">{data.time}</div>
          <div className="text-lg font-bold text-white">${data.equity.toLocaleString()}</div>
          <div className={`text-sm font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPercent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Top Bar - Crypto Prices */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          <div className="flex items-center gap-2">
            <span className="text-orange-400">₿</span>
            <span className="text-gray-400 text-sm">BTC</span>
            <span className="font-mono font-semibold">$110,672.50</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">ETH</span>
            <span className="font-mono font-semibold">$3,962.25</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">◎</span>
            <span className="text-gray-400 text-sm">SOL</span>
            <span className="font-mono font-semibold">$187.55</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">◆</span>
            <span className="text-gray-400 text-sm">BNB</span>
            <span className="font-mono font-semibold">$1,095.45</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Equity Header */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">TOTAL ACCOUNT VALUE</h2>
              <div className="flex gap-2">
                {['ALL', '72H', '24H', '12H'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      timeRange === range 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-bold">${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`text-xl font-semibold ${metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {metrics.totalPnL >= 0 ? '+' : ''}{metrics.totalPnL.toFixed(2)} ({metrics.totalPnL >= 0 ? '+' : ''}{metrics.totalPnLPercent}%)
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={equityData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => {
                    const parts = value.split(', ');
                    return parts[0];
                  }}
                  interval="preserveStartEnd"
                  minTickGap={100}
                />
                <YAxis 
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={10000} stroke="#64748b" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  dot={false}
                  fill="url(#equityGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400">Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{metrics.winRate}%</div>
              <div className="text-xs text-gray-500">{metrics.winningTrades}/{metrics.totalTrades} trades</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Sharpe Ratio</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{metrics.sharpeRatio}</div>
              <div className="text-xs text-gray-500">Risk-adjusted return</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">Max Drawdown</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{metrics.maxDrawdown}%</div>
              <div className="text-xs text-gray-500">Peak to trough</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Profit Factor</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">{metrics.profitFactor}</div>
              <div className="text-xs text-gray-500">Wins / Losses</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-semibold text-emerald-400">+${metrics.avgWin.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-semibold text-red-400">${metrics.avgLoss.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                <div className="text-lg font-semibold text-gray-300">{metrics.totalTrades}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trades Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">COMPLETED TRADES</h3>
              <div className="text-xs text-gray-500">Last 90 Trades</div>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
              {trades.map(trade => (
                <div key={trade.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${trade.side === 'LONG' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        {trade.side === 'LONG' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-400">{trade.model}</div>
                        <div className={`text-xs font-semibold ${trade.side === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.side} trade on 🌕 {trade.symbol.replace('USDT', '')}!
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="font-mono text-gray-200">
                        ${trade.entryPrice.toLocaleString()} → ${trade.exitPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity:</span>
                      <span className="font-mono text-gray-200">{trade.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Notional:</span>
                      <span className="font-mono text-gray-200">{trade.notional}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Holding time:</span>
                      <span className="font-mono text-gray-200">{trade.holdingTime}</span>
                    </div>
                  </div>

                  {/* P&L */}
                  <div className="pt-3 border-t border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">NET P&L:</span>
                      <span className={`text-lg font-bold ${trade.pnlNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.pnlNet >= 0 ? '+' : ''}${Math.abs(trade.pnlNet).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">Commission: ${trade.commission}</span>
                      <span className={`text-sm font-semibold ${trade.pnlPercent >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                        {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-gray-500">
                    <div>{trade.entryTime} → {trade.exitTime}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default OCCEquityDashboard;