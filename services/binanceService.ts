import { CandleData } from '../types';

const BASE_URL = 'https://api.binance.com/api/v3';

export interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

// Fetch all USDT pairs sorted by volume
export const fetchUSDTPairs = async (): Promise<BinanceTicker[]> => {
  try {
    const response = await fetch(`${BASE_URL}/ticker/24hr`);
    const data = await response.json();
    
    // Filter for USDT pairs
    // Exclude leverage tokens (UP/DOWN/BULL/BEAR) and Stablecoin pairs like USDCUSDT, BUSDUSDT if desired, 
    // but here we just exclude leveraged tokens for safety.
    return data
      .filter((t: any) => 
        t.symbol.endsWith('USDT') && 
        !['UP', 'DOWN', 'BULL', 'BEAR'].some((s: string) => t.symbol.includes(s))
      )
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
  } catch (error) {
    console.error("Error fetching tickers:", error);
    return [];
  }
};

export const fetchCandles = async (symbol: string, interval = '1h', limit = 50): Promise<CandleData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Map Binance format [time, open, high, low, close, volume, ...] to CandleData
    return data.map((d: any, index: number) => ({
      id: d[0], // Timestamp as ID
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));
  } catch (error) {
    // console.warn(`Error fetching candles for ${symbol}:`, error);
    return [];
  }
};