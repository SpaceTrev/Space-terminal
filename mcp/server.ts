#!/usr/bin/env tsx
/**
 * Space Terminal MCP Server
 *
 * Gives Claude direct read/write access to the trading platform's DB,
 * signals, ghost trades, journal, agent tasks, and analytics.
 *
 * Env vars required:
 *   POSTGRES_URL  — Vercel Postgres connection string
 *   NEXT_APP_URL  — (optional) e.g. http://localhost:3000 — enables run_signal_scan
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

// ── DB Pool ────────────────────────────────────────────────────────

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

// ── Project root (for resource reads) ─────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ── Tool Definitions ───────────────────────────────────────────────

const TOOLS: Tool[] = [
  // ── Signals ──
  {
    name: "get_signals",
    description:
      "List trading signals from the DB. Supports filtering by instrument, status, minimum confluence score, and time window.",
    inputSchema: {
      type: "object",
      properties: {
        instrument: { type: "string", description: "e.g. EUR/USD, ES1!, GC1!" },
        status: {
          type: "string",
          enum: ["PENDING", "ACTIVE", "CLOSED", "REJECTED"],
        },
        min_score: { type: "number", description: "Minimum confluence score (0-100)" },
        days: { type: "number", description: "Look-back window in days (default 30)" },
        limit: { type: "number", description: "Max rows to return (default 50)" },
      },
    },
  },
  {
    name: "get_signal_events",
    description: "Get the event timeline for a specific signal by its UUID.",
    inputSchema: {
      type: "object",
      required: ["signal_id"],
      properties: {
        signal_id: { type: "string" },
      },
    },
  },
  {
    name: "update_signal_status",
    description: "Update a signal's status (ACTIVE, CLOSED, REJECTED).",
    inputSchema: {
      type: "object",
      required: ["signal_id", "status"],
      properties: {
        signal_id: { type: "string" },
        status: {
          type: "string",
          enum: ["ACTIVE", "CLOSED", "REJECTED"],
        },
      },
    },
  },
  {
    name: "run_signal_scan",
    description:
      "Trigger a live signal scan across all instruments by calling the Next.js API. Requires NEXT_APP_URL env var to be set.",
    inputSchema: { type: "object", properties: {} },
  },

  // ── Ghost Trades ──
  {
    name: "get_ghost_trades",
    description:
      "List ghost (paper) trades with their outcomes. Filterable by instrument, outcome, and time window.",
    inputSchema: {
      type: "object",
      properties: {
        instrument: { type: "string" },
        outcome: {
          type: "string",
          enum: ["WIN", "LOSS", "BREAKEVEN", "TIME_EXIT", "NO_FILL"],
        },
        days: { type: "number", description: "Look-back window in days (default 30)" },
        limit: { type: "number", description: "Max rows (default 50)" },
      },
    },
  },
  {
    name: "get_ghost_summary",
    description:
      "Get aggregate ghost-trade stats: total, fill rate, win rate, avg R, expectancy, median R.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-back window in days (default 90)" },
      },
    },
  },
  {
    name: "get_ghost_leaderboard",
    description:
      "Get ghost-trade leaderboard ranked by expectancy. Views: strategies, symbols, checklist.",
    inputSchema: {
      type: "object",
      properties: {
        view: {
          type: "string",
          enum: ["strategies", "symbols", "checklist"],
          description: "Default: strategies",
        },
        limit: { type: "number", description: "Max rows (default 10)" },
      },
    },
  },
  {
    name: "create_ghost_trade",
    description: "Insert a new ghost trade record.",
    inputSchema: {
      type: "object",
      required: ["instrument", "direction", "setup_type", "entry_ref", "stop_loss"],
      properties: {
        instrument: { type: "string" },
        direction: { type: "string", enum: ["LONG", "SHORT"] },
        setup_type: { type: "string" },
        session: { type: "string" },
        score: { type: "number" },
        score_grade: { type: "string" },
        entry_ref: { type: "number" },
        stop_loss: { type: "number" },
        tp1: { type: "number" },
        tp2: { type: "number" },
        tp3: { type: "number" },
        strategy_key: { type: "string" },
        htf_aligned: { type: "boolean" },
        liquidity_swept: { type: "boolean" },
        momentum_shift: { type: "boolean" },
        signal_id: { type: "string", description: "UUID of linked signal" },
      },
    },
  },
  {
    name: "record_ghost_outcome",
    description: "Record the outcome (WIN/LOSS/etc.) for a ghost trade.",
    inputSchema: {
      type: "object",
      required: ["ghost_trade_id", "outcome"],
      properties: {
        ghost_trade_id: { type: "string" },
        outcome: {
          type: "string",
          enum: ["WIN", "LOSS", "BREAKEVEN", "TIME_EXIT", "NO_FILL"],
        },
        r_multiple: { type: "number" },
        mfe_r: { type: "number" },
        mae_r: { type: "number" },
        entry_price: { type: "number" },
        exit_price: { type: "number" },
        bars_to_entry: { type: "number" },
        bars_to_exit: { type: "number" },
      },
    },
  },

  // ── Journal ──
  {
    name: "get_journal",
    description: "List trading journal entries, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-back window in days (default 14)" },
        limit: { type: "number", description: "Max rows (default 30)" },
      },
    },
  },
  {
    name: "create_journal_entry",
    description: "Add a new journal entry (note, emotion, tags, confidence, rule adherence).",
    inputSchema: {
      type: "object",
      required: ["note"],
      properties: {
        note: { type: "string" },
        trade_id: { type: "string" },
        signal_id: { type: "string" },
        emotion_emoji: { type: "string", description: "e.g. 😊 😐 😟" },
        emotion_score: { type: "number", description: "1-9" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "e.g. ['fomo', 'patient', 'news']",
        },
        confidence: { type: "number", description: "1-10" },
        rule_followed: {
          type: "string",
          enum: ["followed", "broken", "na"],
        },
      },
    },
  },

  // ── Agent Tasks ──
  {
    name: "get_agent_tasks",
    description: "List agent tasks. Filter by role and/or status.",
    inputSchema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: ["research", "context", "architect", "engineer", "quant", "content"],
        },
        status: {
          type: "string",
          enum: ["queued", "running", "completed", "failed"],
        },
        limit: { type: "number", description: "Max rows (default 20)" },
      },
    },
  },
  {
    name: "dispatch_agent_task",
    description: "Queue a new agent task for a specific role.",
    inputSchema: {
      type: "object",
      required: ["agent_role", "prompt"],
      properties: {
        agent_role: {
          type: "string",
          enum: ["research", "context", "architect", "engineer", "quant", "content"],
        },
        prompt: { type: "string" },
        linear_issue_id: { type: "string" },
      },
    },
  },
  {
    name: "update_agent_task",
    description: "Update the status and/or output of an agent task.",
    inputSchema: {
      type: "object",
      required: ["task_id"],
      properties: {
        task_id: { type: "string" },
        status: {
          type: "string",
          enum: ["queued", "running", "completed", "failed"],
        },
        output: { type: "string" },
      },
    },
  },

  // ── Analytics ──
  {
    name: "get_analytics",
    description:
      "Get signal analytics. Returns total count, avg score, and breakdowns by timeframe, session, instrument, setup type, or score bucket.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-back window in days (default 30)" },
        breakdown: {
          type: "string",
          enum: ["timeframe", "session", "instrument", "setup_type", "score_bucket"],
          description: "Dimension to break down by (default: all)",
        },
      },
    },
  },

  // ── Project Context ──
  {
    name: "get_recent_activity",
    description:
      "Cross-table feed of recent activity: latest signals, ghost trades, journal entries, and agent tasks combined and sorted by time.",
    inputSchema: {
      type: "object",
      properties: {
        hours: { type: "number", description: "Look-back window in hours (default 24)" },
      },
    },
  },
];

// ── Tool Handlers ──────────────────────────────────────────────────

async function handleTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    // ── get_signals ──
    case "get_signals": {
      const { instrument, status, min_score, days = 30, limit = 50 } = args as {
        instrument?: string;
        status?: string;
        min_score?: number;
        days?: number;
        limit?: number;
      };
      const since = new Date();
      since.setDate(since.getDate() - days);

      const conditions = ["created_at >= $1"];
      const params: unknown[] = [since.toISOString()];
      let idx = 2;

      if (instrument) { conditions.push(`instrument = $${idx++}`); params.push(instrument); }
      if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
      if (min_score != null) { conditions.push(`confluence_score >= $${idx++}`); params.push(min_score); }

      const rows = await query(
        `SELECT * FROM signals WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx}`,
        [...params, limit]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }

    // ── get_signal_events ──
    case "get_signal_events": {
      const { signal_id } = args as { signal_id: string };
      const rows = await query(
        "SELECT * FROM signal_events WHERE signal_id = $1 ORDER BY created_at ASC",
        [signal_id]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }

    // ── update_signal_status ──
    case "update_signal_status": {
      const { signal_id, status } = args as { signal_id: string; status: string };
      const rows = await query(
        "UPDATE signals SET status = $1, closed_at = CASE WHEN $1 IN ('CLOSED','REJECTED') THEN now() ELSE closed_at END WHERE id = $2 RETURNING *",
        [status, signal_id]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }

    // ── run_signal_scan ──
    case "run_signal_scan": {
      const baseUrl = process.env.NEXT_APP_URL;
      if (!baseUrl) {
        return {
          content: [{
            type: "text",
            text: "NEXT_APP_URL env var not set. Set it to your running Next.js URL (e.g. http://localhost:3000) to enable live scanning.",
          }],
        };
      }
      const res = await fetch(`${baseUrl}/api/signals/scan`, {
        method: "POST",
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    }

    // ── get_ghost_trades ──
    case "get_ghost_trades": {
      const { instrument, outcome, days = 30, limit = 50 } = args as {
        instrument?: string;
        outcome?: string;
        days?: number;
        limit?: number;
      };
      const since = new Date();
      since.setDate(since.getDate() - days);

      const conditions = ["gt.created_at >= $1"];
      const params: unknown[] = [since.toISOString()];
      let idx = 2;

      if (instrument) { conditions.push(`gt.instrument = $${idx++}`); params.push(instrument); }
      if (outcome) { conditions.push(`gto.outcome = $${idx++}`); params.push(outcome); }

      const rows = await query(
        `SELECT gt.*, row_to_json(gto) AS outcome
         FROM ghost_trades gt
         LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY gt.created_at DESC
         LIMIT $${idx}`,
        [...params, limit]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }

    // ── get_ghost_summary ──
    case "get_ghost_summary": {
      const { days = 90 } = args as { days?: number };
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [row] = await query<{
        total: string; filled: string; wins: string; losses: string;
        avg_r: string; median_r: string; r_values: string;
      }>(
        `SELECT
           COUNT(gt.id)::text AS total,
           COUNT(gto.id)::text AS filled,
           SUM(CASE WHEN gto.outcome = 'WIN' THEN 1 ELSE 0 END)::text AS wins,
           SUM(CASE WHEN gto.outcome = 'LOSS' THEN 1 ELSE 0 END)::text AS losses,
           ROUND(AVG(gto.r_multiple)::numeric, 2)::text AS avg_r,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gto.r_multiple)::text AS median_r,
           array_agg(gto.r_multiple ORDER BY gto.r_multiple) FILTER (WHERE gto.r_multiple IS NOT NULL) AS r_values
         FROM ghost_trades gt
         LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
         WHERE gt.created_at >= $1`,
        [since.toISOString()]
      );

      const total = parseInt(row.total);
      const filled = parseInt(row.filled);
      const wins = parseInt(row.wins);
      const losses = parseInt(row.losses);
      const avg_r = parseFloat(row.avg_r) || 0;
      const median_r = parseFloat(row.median_r) || 0;

      const summary = {
        total,
        filled,
        fill_rate: total > 0 ? Math.round((filled / total) * 1000) / 10 : 0,
        wins,
        losses,
        win_rate: filled > 0 ? Math.round((wins / filled) * 1000) / 10 : 0,
        avg_r,
        expectancy: filled > 0
          ? Math.round(((wins / filled) * avg_r - (losses / filled) * Math.abs(avg_r)) * 100) / 100
          : 0,
        median_r,
      };

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    }

    // ── get_ghost_leaderboard ──
    case "get_ghost_leaderboard": {
      const { view = "strategies", limit = 10 } = args as { view?: string; limit?: number };

      let sql: string;
      if (view === "symbols") {
        sql = `SELECT gt.instrument AS key,
                 COUNT(gt.id) AS trades,
                 ROUND(AVG(gto.r_multiple)::numeric, 2) AS avg_r,
                 SUM(CASE WHEN gto.outcome='WIN' THEN 1 ELSE 0 END) AS wins,
                 SUM(CASE WHEN gto.outcome='LOSS' THEN 1 ELSE 0 END) AS losses
               FROM ghost_trades gt
               LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
               GROUP BY gt.instrument ORDER BY avg_r DESC NULLS LAST LIMIT $1`;
      } else if (view === "checklist") {
        sql = `SELECT
                 CASE
                   WHEN gt.htf_aligned AND gt.liquidity_swept AND gt.momentum_shift THEN 'All 3 checked'
                   WHEN (gt.htf_aligned::int + gt.liquidity_swept::int + gt.momentum_shift::int) = 2 THEN '2 of 3 checked'
                   WHEN (gt.htf_aligned::int + gt.liquidity_swept::int + gt.momentum_shift::int) = 1 THEN '1 of 3 checked'
                   ELSE 'None checked'
                 END AS key,
                 COUNT(gt.id) AS trades,
                 ROUND(AVG(gto.r_multiple)::numeric, 2) AS avg_r,
                 SUM(CASE WHEN gto.outcome='WIN' THEN 1 ELSE 0 END) AS wins,
                 SUM(CASE WHEN gto.outcome='LOSS' THEN 1 ELSE 0 END) AS losses
               FROM ghost_trades gt
               LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
               GROUP BY 1 ORDER BY avg_r DESC NULLS LAST LIMIT $1`;
      } else {
        // strategies
        sql = `SELECT COALESCE(gt.strategy_key, gt.setup_type) AS key,
                 COUNT(gt.id) AS trades,
                 ROUND(AVG(gto.r_multiple)::numeric, 2) AS avg_r,
                 SUM(CASE WHEN gto.outcome='WIN' THEN 1 ELSE 0 END) AS wins,
                 SUM(CASE WHEN gto.outcome='LOSS' THEN 1 ELSE 0 END) AS losses
               FROM ghost_trades gt
               LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
               GROUP BY 1 ORDER BY avg_r DESC NULLS LAST LIMIT $1`;
      }

      const rows = await query(sql, [limit]);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }

    // ── create_ghost_trade ──
    case "create_ghost_trade": {
      const t = args as {
        instrument: string; direction: string; setup_type: string;
        session?: string; score?: number; score_grade?: string;
        entry_ref: number; stop_loss: number; tp1?: number; tp2?: number; tp3?: number;
        strategy_key?: string; htf_aligned?: boolean; liquidity_swept?: boolean;
        momentum_shift?: boolean; signal_id?: string;
      };
      const rows = await query(
        `INSERT INTO ghost_trades
           (instrument, direction, setup_type, session, score, score_grade,
            entry_ref, stop_loss, tp1, tp2, tp3, strategy_key,
            htf_aligned, liquidity_swept, momentum_shift, signal_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          t.instrument, t.direction, t.setup_type, t.session ?? null,
          t.score ?? 0, t.score_grade ?? null,
          t.entry_ref, t.stop_loss, t.tp1 ?? null, t.tp2 ?? null, t.tp3 ?? null,
          t.strategy_key ?? null, t.htf_aligned ?? false,
          t.liquidity_swept ?? false, t.momentum_shift ?? false,
          t.signal_id ?? null,
        ]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }

    // ── record_ghost_outcome ──
    case "record_ghost_outcome": {
      const o = args as {
        ghost_trade_id: string; outcome: string;
        r_multiple?: number; mfe_r?: number; mae_r?: number;
        entry_price?: number; exit_price?: number;
        bars_to_entry?: number; bars_to_exit?: number;
      };
      const rows = await query(
        `INSERT INTO ghost_trade_outcomes
           (ghost_trade_id, outcome, r_multiple, mfe_r, mae_r,
            entry_price, exit_price, bars_to_entry, bars_to_exit)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (ghost_trade_id) DO UPDATE SET
           outcome=$2, r_multiple=$3, mfe_r=$4, mae_r=$5,
           entry_price=$6, exit_price=$7, bars_to_entry=$8, bars_to_exit=$9
         RETURNING *`,
        [
          o.ghost_trade_id, o.outcome,
          o.r_multiple ?? null, o.mfe_r ?? null, o.mae_r ?? null,
          o.entry_price ?? null, o.exit_price ?? null,
          o.bars_to_entry ?? null, o.bars_to_exit ?? null,
        ]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }

    // ── get_journal ──
    case "get_journal": {
      const { days = 14, limit = 30 } = args as { days?: number; limit?: number };
      const since = new Date();
      since.setDate(since.getDate() - days);
      const rows = await query(
        "SELECT * FROM journal_entries WHERE created_at >= $1 ORDER BY created_at DESC LIMIT $2",
        [since.toISOString(), limit]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }

    // ── create_journal_entry ──
    case "create_journal_entry": {
      const j = args as {
        note: string; trade_id?: string; signal_id?: string;
        emotion_emoji?: string; emotion_score?: number;
        tags?: string[]; confidence?: number; rule_followed?: string;
      };
      const rows = await query(
        `INSERT INTO journal_entries
           (note, trade_id, signal_id, emotion_emoji, emotion_score, tags, confidence, rule_followed)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
         RETURNING *`,
        [
          j.note, j.trade_id ?? null, j.signal_id ?? null,
          j.emotion_emoji ?? null, j.emotion_score ?? null,
          JSON.stringify(j.tags ?? []),
          j.confidence ?? null, j.rule_followed ?? null,
        ]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }

    // ── get_agent_tasks ──
    case "get_agent_tasks": {
      const { role, status, limit = 20 } = args as {
        role?: string; status?: string; limit?: number;
      };
      const conditions: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (role) { conditions.push(`agent_role = $${idx++}`); params.push(role); }
      if (status) { conditions.push(`status = $${idx++}`); params.push(status); }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const rows = await query(
        `SELECT * FROM agent_tasks ${where} ORDER BY created_at DESC LIMIT $${idx}`,
        [...params, limit]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }

    // ── dispatch_agent_task ──
    case "dispatch_agent_task": {
      const { agent_role, prompt, linear_issue_id } = args as {
        agent_role: string; prompt: string; linear_issue_id?: string;
      };
      const rows = await query(
        `INSERT INTO agent_tasks (agent_role, prompt, status, linear_issue_id)
         VALUES ($1, $2, 'queued', $3)
         RETURNING *`,
        [agent_role, prompt, linear_issue_id ?? null]
      );
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }

    // ── update_agent_task ──
    case "update_agent_task": {
      const { task_id, status, output } = args as {
        task_id: string; status?: string; output?: string;
      };
      const setParts: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (status) {
        setParts.push(`status = $${idx++}`);
        params.push(status);
        if (status === "running") {
          setParts.push(`started_at = COALESCE(started_at, now())`);
        }
        if (status === "completed" || status === "failed") {
          setParts.push(`completed_at = now()`);
        }
      }
      if (output !== undefined) { setParts.push(`output = $${idx++}`); params.push(output); }

      if (setParts.length === 0) {
        return { content: [{ type: "text", text: "No fields to update." }] };
      }

      params.push(task_id);
      const rows = await query(
        `UPDATE agent_tasks SET ${setParts.join(", ")} WHERE id = $${idx} RETURNING *`,
        params
      );
      return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
    }

    // ── get_analytics ──
    case "get_analytics": {
      const { days = 30, breakdown } = args as { days?: number; breakdown?: string };
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceISO = since.toISOString();

      // Summary
      const [summary] = await query<{ total: string; avg_score: string }>(
        "SELECT COUNT(*)::text AS total, ROUND(AVG(confluence_score)::numeric, 1)::text AS avg_score FROM signals WHERE created_at >= $1",
        [sinceISO]
      );

      // Breakdown
      let breakdownRows: unknown[] = [];
      if (!breakdown || breakdown === "timeframe") {
        breakdownRows = await query(
          `SELECT timeframe AS key, COUNT(*) AS count, ROUND(AVG(confluence_score)::numeric,1) AS avg_score
           FROM signals WHERE created_at >= $1 GROUP BY timeframe ORDER BY count DESC`,
          [sinceISO]
        );
      }
      if (breakdown === "session") {
        breakdownRows = await query(
          `SELECT COALESCE(session,'UNKNOWN') AS key, COUNT(*) AS count, ROUND(AVG(confluence_score)::numeric,1) AS avg_score
           FROM signals WHERE created_at >= $1 GROUP BY session ORDER BY count DESC`,
          [sinceISO]
        );
      }
      if (breakdown === "instrument") {
        breakdownRows = await query(
          `SELECT instrument AS key, COUNT(*) AS count, ROUND(AVG(confluence_score)::numeric,1) AS avg_score
           FROM signals WHERE created_at >= $1 GROUP BY instrument ORDER BY count DESC`,
          [sinceISO]
        );
      }
      if (breakdown === "setup_type") {
        breakdownRows = await query(
          `SELECT setup_type AS key, COUNT(*) AS count, ROUND(AVG(confluence_score)::numeric,1) AS avg_score
           FROM signals WHERE created_at >= $1 GROUP BY setup_type ORDER BY count DESC`,
          [sinceISO]
        );
      }
      if (breakdown === "score_bucket") {
        breakdownRows = await query(
          `SELECT
             CASE
               WHEN confluence_score >= 90 THEN 'A+ (90-100)'
               WHEN confluence_score >= 75 THEN 'A (75-89)'
               WHEN confluence_score >= 50 THEN 'B (50-74)'
               ELSE 'C (<50)'
             END AS key,
             COUNT(*) AS count
           FROM signals WHERE created_at >= $1 GROUP BY 1 ORDER BY MIN(confluence_score) DESC`,
          [sinceISO]
        );
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: {
              total_signals: parseInt(summary.total),
              avg_score: parseFloat(summary.avg_score) || 0,
              days_window: days,
            },
            breakdown: breakdownRows,
          }, null, 2),
        }],
      };
    }

    // ── get_recent_activity ──
    case "get_recent_activity": {
      const { hours = 24 } = args as { hours?: number };
      const since = new Date();
      since.setHours(since.getHours() - hours);
      const sinceISO = since.toISOString();

      const [signals, trades, journal, tasks] = await Promise.all([
        query(
          "SELECT 'signal' AS type, id, instrument AS label, confluence_score AS score, status, created_at FROM signals WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 10",
          [sinceISO]
        ),
        query(
          "SELECT 'ghost_trade' AS type, gt.id, gt.instrument AS label, gt.score, gto.outcome AS status, gt.created_at FROM ghost_trades gt LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id WHERE gt.created_at >= $1 ORDER BY gt.created_at DESC LIMIT 10",
          [sinceISO]
        ),
        query(
          "SELECT 'journal' AS type, id, LEFT(note, 80) AS label, confidence AS score, rule_followed AS status, created_at FROM journal_entries WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 10",
          [sinceISO]
        ),
        query(
          "SELECT 'agent_task' AS type, id, agent_role AS label, NULL AS score, status, created_at FROM agent_tasks WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 10",
          [sinceISO]
        ),
      ]);

      const combined = [...signals, ...trades, ...journal, ...tasks].sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() -
          new Date(a.created_at as string).getTime()
      );

      return { content: [{ type: "text", text: JSON.stringify(combined, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
}

// ── Server Setup ───────────────────────────────────────────────────

const server = new Server(
  { name: "space-terminal", version: "1.0.0" },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

// Call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    return await handleTool(name, args as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
  }
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "project://context",
      name: "Space Terminal — Project Context",
      description:
        "Full CLAUDE.md project context: stack, data flow, key files, symbols, and current state.",
      mimeType: "text/markdown",
    },
    {
      uri: "project://trading-types",
      name: "Space Terminal — Trading Type Definitions",
      description:
        "All TypeScript interfaces for signals, ghost trades, journal entries, agent tasks, and analytics.",
      mimeType: "text/plain",
    },
  ],
}));

// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "project://context") {
    const claudeMd = fs.readFileSync(path.join(PROJECT_ROOT, "CLAUDE.md"), "utf-8");
    return {
      contents: [{ uri, mimeType: "text/markdown", text: claudeMd }],
    };
  }

  if (uri === "project://trading-types") {
    const types = fs.readFileSync(path.join(PROJECT_ROOT, "lib/trading-types.ts"), "utf-8");
    return {
      contents: [{ uri, mimeType: "text/plain", text: types }],
    };
  }

  return {
    contents: [{ uri, mimeType: "text/plain", text: `Unknown resource: ${uri}` }],
  };
});

// ── Start ──────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
