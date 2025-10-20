import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'
import { useTradingStore } from '@/store/tradingStore'

export function EquityChart() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const equityData = useTradingStore((s) => s.equityData)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b1220' },
        textColor: '#cbd5e1',
      },
      grid: {
        horzLines: { color: '#1f2937' },
        vertLines: { color: '#1f2937' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      crosshair: { mode: 0 },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      autoSize: true,
    })
    chartRef.current = chart

    // lightweight-charts v5 допускает addSeries с типом, но TS типизация может отличаться
    const series = (chart as any).addLineSeries({
      color: '#10b981',
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineStyle: LineStyle.Dashed,
    }) as ISeriesApi<'Line'>
    seriesRef.current = series

    const resize = () => {
      chart.timeScale().fitContent()
    }
    window.addEventListener('resize', resize)
    resize()

    return () => {
      window.removeEventListener('resize', resize)
      chart.remove()
    }
  }, [])

  // Push data to the chart when equityData updates
  useEffect(() => {
    if (!seriesRef.current) return
    if (equityData.length === 0) return
  const mapped = equityData.map((p) => ({ time: Math.floor(p.timestamp / 1000) as UTCTimestamp, value: p.equity }))
    seriesRef.current.setData(mapped)
    chartRef.current?.timeScale().fitContent()
  }, [equityData])

  return <div ref={containerRef} className="w-full h-[400px]" />
}
