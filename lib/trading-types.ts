// Journal
export interface JournalEntry {
  id: string;
  trade_id: string | null;
  signal_id: string | null;
  note: string;
  emotion_emoji: string | null;
  emotion_score: number | null;
  tags: string[];
  confidence: number | null;
  rule_followed: "followed" | "broken" | "na" | null;
  created_at: string;
}

// Agent tasks
export type AgentRole = "research" | "context" | "architect" | "engineer" | "quant" | "content";
export type TaskStatus = "queued" | "running" | "completed" | "failed";

export interface AgentTask {
  id: string;
  agent_role: AgentRole;
  prompt: string;
  status: TaskStatus;
  linear_issue_id: string | null;
  output: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Signals
export type SignalDirection = "LONG" | "SHORT";
export type SignalStatus = "PENDING" | "ACTIVE" | "CLOSED" | "REJECTED";
export type ScoreGrade = "A+" | "A" | "B" | "C";

export interface Signal {
  id: string;
  instrument: string;
  direction: SignalDirection;
  setup_type: string;
  timeframe: string;
  session: string | null;
  confluence_score: number;
  score_grade: ScoreGrade | null;
  entry_ref: number | null;
  stop_loss: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  htf_aligned: boolean;
  liquidity_swept: boolean;
  momentum_shift: boolean;
  news_conflict: boolean;
  status: SignalStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  closed_at: string | null;
}

export interface SignalEvent {
  id: string;
  signal_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Ghost trades
export type GhostOutcome = "WIN" | "LOSS" | "BREAKEVEN" | "TIME_EXIT" | "NO_FILL";

export interface GhostTrade {
  id: string;
  instrument: string;
  direction: SignalDirection;
  setup_type: string;
  session: string | null;
  score: number;
  score_grade: ScoreGrade | null;
  entry_ref: number;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  strategy_key: string | null;
  htf_aligned: boolean;
  liquidity_swept: boolean;
  momentum_shift: boolean;
  signal_id: string | null;
  created_at: string;
  // Joined outcome
  outcome?: GhostTradeOutcome | null;
}

export interface GhostTradeOutcome {
  id: string;
  ghost_trade_id: string;
  outcome: GhostOutcome;
  r_multiple: number | null;
  mfe_r: number | null;
  mae_r: number | null;
  entry_price: number | null;
  exit_price: number | null;
  bars_to_entry: number | null;
  bars_to_exit: number | null;
  created_at: string;
}

export interface GhostTradeSummary {
  total: number;
  filled: number;
  fill_rate: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_r: number;
  expectancy: number;
  median_r: number;
}

// Analytics
export interface AnalyticsSummary {
  total_signals: number;
  avg_score: number;
  by_timeframe: Record<string, number>;
  by_session: Record<string, number>;
}

export interface BreakdownRow {
  key: string;
  count: number;
  avg_score: number;
  win_rate: number;
  avg_r: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  wins?: number;
  losses?: number;
}
