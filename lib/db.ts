import { sql, db } from "@vercel/postgres";

export { sql, db };

export async function setupDatabase() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Journal entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trade_id TEXT,
        signal_id TEXT,
        note TEXT NOT NULL,
        emotion_emoji TEXT,
        emotion_score INT CHECK (emotion_score BETWEEN 1 AND 9),
        tags JSONB DEFAULT '[]'::jsonb,
        confidence INT CHECK (confidence BETWEEN 1 AND 10),
        rule_followed TEXT CHECK (rule_followed IN ('followed', 'broken', 'na')),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries (created_at DESC)`);

    // Agent tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_role TEXT NOT NULL,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
        linear_issue_id TEXT,
        output TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks (status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_agent_tasks_role ON agent_tasks (agent_role)`);

    // Signals
    await client.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instrument TEXT NOT NULL,
        direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
        setup_type TEXT NOT NULL,
        timeframe TEXT NOT NULL DEFAULT '15M',
        session TEXT,
        confluence_score REAL DEFAULT 0,
        score_grade TEXT,
        entry_ref REAL,
        stop_loss REAL,
        tp1 REAL,
        tp2 REAL,
        tp3 REAL,
        htf_aligned BOOLEAN DEFAULT false,
        liquidity_swept BOOLEAN DEFAULT false,
        momentum_shift BOOLEAN DEFAULT false,
        news_conflict BOOLEAN DEFAULT false,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'CLOSED', 'REJECTED')),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        closed_at TIMESTAMPTZ
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signals_status_score ON signals (status, confluence_score DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signals_instrument ON signals (instrument, status)`);

    // Signal events (timeline)
    await client.query(`
      CREATE TABLE IF NOT EXISTS signal_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signal_events_signal ON signal_events (signal_id, created_at)`);

    // Ghost trades
    await client.query(`
      CREATE TABLE IF NOT EXISTS ghost_trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instrument TEXT NOT NULL,
        direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
        setup_type TEXT NOT NULL,
        session TEXT,
        score REAL DEFAULT 0,
        score_grade TEXT,
        entry_ref REAL NOT NULL,
        stop_loss REAL NOT NULL,
        tp1 REAL,
        tp2 REAL,
        tp3 REAL,
        strategy_key TEXT,
        htf_aligned BOOLEAN DEFAULT false,
        liquidity_swept BOOLEAN DEFAULT false,
        momentum_shift BOOLEAN DEFAULT false,
        signal_id UUID REFERENCES signals(id),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ghost_trades_created ON ghost_trades (created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ghost_trades_instrument ON ghost_trades (instrument)`);

    // Ghost trade outcomes
    await client.query(`
      CREATE TABLE IF NOT EXISTS ghost_trade_outcomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ghost_trade_id UUID NOT NULL UNIQUE REFERENCES ghost_trades(id) ON DELETE CASCADE,
        outcome TEXT NOT NULL CHECK (outcome IN ('WIN', 'LOSS', 'BREAKEVEN', 'TIME_EXIT', 'NO_FILL')),
        r_multiple REAL,
        mfe_r REAL,
        mae_r REAL,
        entry_price REAL,
        exit_price REAL,
        bars_to_entry INT,
        bars_to_exit INT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ghost_outcomes_trade ON ghost_trade_outcomes (ghost_trade_id)`);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
