// Maps display names → Polygon.io ticker format
export const SYMBOL_MAP: Record<string, string> = {
  "EUR/USD":             "C:EURUSD",
  "GBP/USD":             "C:GBPUSD",
  "USD/JPY":             "C:USDJPY",
  "XAU/USD":             "C:XAUUSD",
  "BTC/USD":             "X:BTCUSD",
  "ETH/USD":             "X:ETHUSD",
  "SOL/USD":             "X:SOLUSD",
  "GBP/JPY":             "C:GBPJPY",
  "USD/CAD":             "C:USDCAD",
  "ES1! (S&P 500)":      "ES",
  "NQ1! (Nasdaq)":       "NQ",
  "YM1! (Dow)":          "YM",
  "CL1! (Crude Oil)":    "CL",
  "GC1! (Gold)":         "GC",
  "ZN1! (10Y T-Note)":   "ZN",
  "6E1! (EUR Fut)":      "6E",
  "6J1! (JPY Fut)":      "6J",
};

// Timeframe display → Polygon multiplier + timespan
export const TIMEFRAME_MAP: Record<string, { multiplier: number; timespan: string }> = {
  "1M":  { multiplier: 1,  timespan: "minute" },
  "5M":  { multiplier: 5,  timespan: "minute" },
  "15M": { multiplier: 15, timespan: "minute" },
  "1H":  { multiplier: 1,  timespan: "hour"   },
  "4H":  { multiplier: 4,  timespan: "hour"   },
  "D":   { multiplier: 1,  timespan: "day"    },
};
