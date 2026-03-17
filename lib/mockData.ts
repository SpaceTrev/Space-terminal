import type { Quote, NewsItem } from "./types";

export const FX_DATA: Record<string, Quote> = {
  "EUR/USD": { symbol: "EUR/USD", bid: "1.0844", ask: "1.0847", spread: "3.0",  change: "+0.0023", changePct: "+0.21%", up: true,  O: "1.0831", H: "1.0864", L: "1.0819", C: "1.0847", volume: "84.2K",  sparkline: [20,22,21,25,24,27,26,28,27,30], baseSeed: 1082,  type: "fx" },
  "GBP/USD": { symbol: "GBP/USD", bid: "1.2631", ask: "1.2634", spread: "3.0",  change: "-0.0041", changePct: "-0.32%", up: false, O: "1.2658", H: "1.2671", L: "1.2618", C: "1.2634", volume: "61.5K",  sparkline: [30,28,29,26,25,23,24,22,23,20], baseSeed: 1263,  type: "fx" },
  "USD/JPY": { symbol: "USD/JPY", bid: "149.80", ask: "149.82", spread: "2.0",  change: "+0.34",   changePct: "+0.23%", up: true,  O: "149.48", H: "150.12", L: "149.21", C: "149.82", volume: "112.8K", sparkline: [18,19,21,20,22,23,22,24,25,26], baseSeed: 14982, type: "fx" },
  "XAU/USD": { symbol: "XAU/USD", bid: "2933.80",ask: "2934.50",spread: "70.0", change: "+12.40",  changePct: "+0.43%", up: true,  O: "2921.10",H: "2941.30",L: "2918.40",C: "2934.50",volume: "38.1K",  sparkline: [15,17,16,19,20,22,21,24,23,25], baseSeed: 29345, type: "fx" },
  "BTC/USD": { symbol: "BTC/USD", bid: "84,150", ask: "84,210", spread: "60.0", change: "-1,240",  changePct: "-1.45%", up: false, O: "85,610", H: "86,220", L: "83,940", C: "84,210", volume: "24.7K",  sparkline: [32,30,28,31,29,26,27,24,22,20], baseSeed: 84210, type: "fx" },
};

export const FUTURES_DATA: Record<string, Quote> = {
  "ES1! (S&P 500)":   { symbol: "ES1! (S&P 500)",   bid: "5,608.50", ask: "5,609.25", spread: "0.75",  change: "+24.50",    changePct: "+0.44%", up: true,  O: "5,584.75", H: "5,621.00", L: "5,578.25", C: "5,609.25", volume: "1.24M", expiry: "Jun 25", sparkline: [22,24,23,26,27,29,28,31,30,33], baseSeed: 56092, type: "futures" },
  "NQ1! (Nasdaq)":    { symbol: "NQ1! (Nasdaq)",    bid: "19,764.50",ask: "19,766.25",spread: "1.75",  change: "-86.25",    changePct: "-0.43%", up: false, O: "19,852.50",H: "19,901.75",L: "19,742.25",C: "19,766.25",volume: "642K",  expiry: "Jun 25", sparkline: [34,32,31,28,29,27,26,24,22,21], baseSeed: 19766, type: "futures" },
  "YM1! (Dow)":       { symbol: "YM1! (Dow)",       bid: "41,842.00", ask: "41,846.00",spread: "4.0",   change: "+182.00",   changePct: "+0.44%", up: true,  O: "41,664.00",H: "41,912.00",L: "41,598.00",C: "41,846.00",volume: "218K",  expiry: "Jun 25", sparkline: [19,21,20,23,24,26,25,28,27,30], baseSeed: 41846, type: "futures" },
  "CL1! (Crude Oil)": { symbol: "CL1! (Crude Oil)", bid: "68.32",     ask: "68.34",    spread: "0.02",  change: "-0.84",     changePct: "-1.21%", up: false, O: "69.16",    H: "69.48",    L: "68.10",    C: "68.34",    volume: "389K",  expiry: "Apr 26", sparkline: [28,26,27,24,23,21,22,20,19,18], baseSeed: 6834,  type: "futures" },
  "GC1! (Gold)":      { symbol: "GC1! (Gold)",      bid: "2,932.80",  ask: "2,933.40", spread: "0.60",  change: "+11.80",    changePct: "+0.40%", up: true,  O: "2,921.60", H: "2,940.20", L: "2,917.40", C: "2,933.40", volume: "198K",  expiry: "Apr 26", sparkline: [16,18,17,20,21,23,22,25,24,26], baseSeed: 29334, type: "futures" },
  "ZN1! (10Y T-Note)":{ symbol: "ZN1! (10Y T-Note)",bid: "109.203",  ask: "109.219",  spread: "0.016", change: "-0.281",    changePct: "-0.26%", up: false, O: "109.484",  H: "109.531",  L: "109.172",  C: "109.219",  volume: "1.08M", expiry: "Jun 25", sparkline: [26,24,25,22,21,19,20,18,17,16], baseSeed: 10922, type: "futures" },
  "6E1! (EUR Fut)":   { symbol: "6E1! (EUR Fut)",   bid: "1.0841",    ask: "1.0844",   spread: "3.0",   change: "+0.0021",   changePct: "+0.19%", up: true,  O: "1.0823",   H: "1.0861",   L: "1.0815",   C: "1.0844",   volume: "312K",  expiry: "Jun 25", sparkline: [21,23,22,25,24,27,26,28,27,29], baseSeed: 10844, type: "futures" },
  "6J1! (JPY Fut)":   { symbol: "6J1! (JPY Fut)",   bid: "0.006681",  ask: "0.006682", spread: "0.1",   change: "+0.000015", changePct: "+0.22%", up: true,  O: "0.006666", H: "0.006695", L: "0.006660", C: "0.006682", volume: "156K",  expiry: "Jun 25", sparkline: [17,18,20,19,21,22,21,23,24,25], baseSeed: 6682,  type: "futures" },
};

export const ALL_SYMBOL_DATA: Record<string, Quote> = { ...FX_DATA, ...FUTURES_DATA };

export const TICKER_DATA = [
  { symbol: "ES1!",    price: "5,609.25", pct: "+0.44%", up: true  },
  { symbol: "NQ1!",    price: "19,766",   pct: "-0.43%", up: false },
  { symbol: "YM1!",    price: "41,846",   pct: "+0.44%", up: true  },
  { symbol: "CL1!",    price: "68.34",    pct: "-1.21%", up: false },
  { symbol: "GC1!",    price: "2,933.40", pct: "+0.40%", up: true  },
  { symbol: "EUR/USD", price: "1.0847",   pct: "+0.21%", up: true  },
  { symbol: "GBP/USD", price: "1.2634",   pct: "-0.32%", up: false },
  { symbol: "USD/JPY", price: "149.82",   pct: "+0.23%", up: true  },
  { symbol: "XAU/USD", price: "2934.50",  pct: "+0.43%", up: true  },
  { symbol: "BTC/USD", price: "84,210",   pct: "-1.45%", up: false },
  { symbol: "ZN1!",    price: "109.219",  pct: "-0.26%", up: false },
  { symbol: "6E1!",    price: "1.0844",   pct: "+0.19%", up: true  },
];

export const MOCK_NEWS: NewsItem[] = [
  { time: "09:42", source: "RTRS", headline: "Fed's Powell signals caution on rate path amid sticky inflation data",    hot: true  },
  { time: "09:31", source: "BBG",  headline: "ECB minutes show divided views on June cut timeline",                     hot: false },
  { time: "09:18", source: "WSJ",  headline: "S&P 500 futures extend gains after strong retail data beat",              hot: true  },
  { time: "08:55", source: "FT",   headline: "Crude oil slides below $69 on demand concerns, IEA cuts forecast",        hot: false },
  { time: "08:33", source: "CNBC", headline: "10-year Treasury yields push toward 4.5% on hot CPI print",              hot: true  },
  { time: "08:12", source: "RTRS", headline: "Treasury yields surge after stronger-than-expected retail sales",         hot: true  },
  { time: "07:44", source: "BBG",  headline: "Japan CPI rises above target for 10th consecutive month",                 hot: false },
  { time: "07:20", source: "FT",   headline: "Euro area industrial output contracts for third straight quarter",        hot: false },
];
