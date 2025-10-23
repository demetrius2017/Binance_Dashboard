import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineSeries, LineStyle, type IChartApi, type UTCTimestamp } from 'lightweight-charts'
import { useTradingStore } from '@/store/tradingStore'
import { useThemeStyles } from '@/theme/useThemeStyles'

type LineSeriesApiMinimal = {
  setData: (data: { time: UTCTimestamp; value: number }[]) => void
  applyOptions: (options: {
    color?: string
    lineWidth?: number
    priceLineVisible?: boolean
    lastValueVisible?: boolean
    priceLineStyle?: LineStyle
  }) => void
}

export function EquityChart() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<LineSeriesApiMinimal | null>(null)
  const equityData = useTradingStore((s) => s.equityData)
  const { styles } = useThemeStyles()

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: styles.chartBackground },
        textColor: styles.chartText,
      },
      grid: {
        horzLines: { color: styles.chartGrid },
        vertLines: { color: styles.chartGrid },
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

    // lightweight-charts v5: addSeries принимает описание серии
    const series = chart.addSeries(LineSeries, {
      color: styles.chartLine,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineStyle: LineStyle.Dashed,
    }) as unknown as LineSeriesApiMinimal
    seriesRef.current = series

    const resize = () => {
      chart.timeScale().fitContent()
    }
    window.addEventListener('resize', resize)
    resize()

    return () => {
      window.removeEventListener('resize', resize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [styles.chartBackground, styles.chartGrid, styles.chartLine, styles.chartText])

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: styles.chartBackground },
        textColor: styles.chartText,
      },
      grid: {
        horzLines: { color: styles.chartGrid },
        vertLines: { color: styles.chartGrid },
      },
    })
    seriesRef.current.applyOptions({ color: styles.chartLine })
  }, [styles.chartBackground, styles.chartGrid, styles.chartLine, styles.chartText])

  // Push data to the chart when equityData updates
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return
    if (equityData.length === 0) return
    try {
      const dedupMap = new Map<number, { time: UTCTimestamp; value: number }>()
      for (const point of equityData) {
        const time = Math.floor(point.timestamp / 1000)
        dedupMap.set(time, { time: time as UTCTimestamp, value: point.equity })
      }

      const sorted = Array.from(dedupMap.values()).sort((a, b) => Number(a.time) - Number(b.time))

      seriesRef.current.setData(sorted)
      chartRef.current.timeScale().fitContent()
    } catch (e) {
      console.error('Chart data update error:', e)
    }
  }, [equityData])

  return <div ref={containerRef} className="w-full h-[400px]" />
}
