/**
 * Binance Futures REST API клиент (публичные эндпоинты)
 * Для приватных запросов (account, orders) нужен signing service
 */

const BINANCE_FUTURES_BASE = 'https://fapi.binance.com'

export type Ticker24h = {
  symbol: string
  priceChange: string
  priceChangePercent: string
  lastPrice: string
  volume: string
  quoteVolume: string
  openPrice: string
  highPrice: string
  lowPrice: string
}

export type ExchangeInfo = {
  symbols: Array<{
    symbol: string
    status: string
    baseAsset: string
    quoteAsset: string
    pricePrecision: number
    quantityPrecision: number
  }>
}

export class BinanceRestClient {
  async getTicker24h(symbol?: string): Promise<Ticker24h[]> {
    const url = symbol 
      ? `${BINANCE_FUTURES_BASE}/fapi/v1/ticker/24hr?symbol=${symbol}`
      : `${BINANCE_FUTURES_BASE}/fapi/v1/ticker/24hr`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data : [data]
  }

  async getExchangeInfo(): Promise<ExchangeInfo> {
    const url = `${BINANCE_FUTURES_BASE}/fapi/v1/exchangeInfo`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }
    
    return response.json()
  }

  async getBookDepth(symbol: string, limit = 20): Promise<{
    bids: [string, string][]
    asks: [string, string][]
  }> {
    const url = `${BINANCE_FUTURES_BASE}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }
    
    return response.json()
  }
}
