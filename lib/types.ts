export interface Bar {
  open: number;
  close: number;
  high: number;
  low: number;
  up: boolean;
  volume?: number;
  timestamp?: number;
}

export interface Quote {
  symbol: string;
  bid: string;
  ask: string;
  last?: string;
  change: string;
  changePct: string;
  up: boolean;
  volume?: string;
  O?: string;
  H?: string;
  L?: string;
  C?: string;
  spread?: string;
  sparkline?: number[];
  expiry?: string;
  type?: "fx" | "futures";
  baseSeed?: number;
}

export type Provider = "gemini" | "perplexity" | "claude";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NewsItem {
  time: string;
  source: string;
  headline: string;
  hot: boolean;
}
