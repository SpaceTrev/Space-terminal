import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const dimension = request.nextUrl.searchParams.get("dimension") ?? "setup_type";
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Use separate queries per dimension to avoid SQL injection from dynamic column names
    let rows;
    switch (dimension) {
      case "instrument":
        ({ rows } = await sql`
          SELECT
            s.instrument AS key,
            COUNT(*)::int AS count,
            COALESCE(AVG(s.confluence_score), 0)::float AS avg_score,
            CASE WHEN COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
              THEN COUNT(gto.id) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL')
              ELSE 0
            END AS win_rate,
            COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r
          FROM signals s
          LEFT JOIN ghost_trades gt ON gt.signal_id = s.id
          LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
          WHERE s.created_at >= ${sinceISO}
          GROUP BY s.instrument
          ORDER BY count DESC
        `);
        break;

      case "session":
        ({ rows } = await sql`
          SELECT
            COALESCE(s.session, 'unknown') AS key,
            COUNT(*)::int AS count,
            COALESCE(AVG(s.confluence_score), 0)::float AS avg_score,
            CASE WHEN COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
              THEN COUNT(gto.id) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL')
              ELSE 0
            END AS win_rate,
            COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r
          FROM signals s
          LEFT JOIN ghost_trades gt ON gt.signal_id = s.id
          LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
          WHERE s.created_at >= ${sinceISO}
          GROUP BY s.session
          ORDER BY count DESC
        `);
        break;

      case "score_bucket":
        ({ rows } = await sql`
          SELECT
            CASE
              WHEN s.confluence_score >= 8 THEN 'A+ (8-10)'
              WHEN s.confluence_score >= 6 THEN 'A (6-8)'
              WHEN s.confluence_score >= 4 THEN 'B (4-6)'
              ELSE 'C (0-4)'
            END AS key,
            COUNT(*)::int AS count,
            COALESCE(AVG(s.confluence_score), 0)::float AS avg_score,
            CASE WHEN COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
              THEN COUNT(gto.id) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL')
              ELSE 0
            END AS win_rate,
            COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r
          FROM signals s
          LEFT JOIN ghost_trades gt ON gt.signal_id = s.id
          LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
          WHERE s.created_at >= ${sinceISO}
          GROUP BY CASE
            WHEN s.confluence_score >= 8 THEN 'A+ (8-10)'
            WHEN s.confluence_score >= 6 THEN 'A (6-8)'
            WHEN s.confluence_score >= 4 THEN 'B (4-6)'
            ELSE 'C (0-4)'
          END
          ORDER BY avg_score DESC
        `);
        break;

      case "setup_type":
      default:
        ({ rows } = await sql`
          SELECT
            s.setup_type AS key,
            COUNT(*)::int AS count,
            COALESCE(AVG(s.confluence_score), 0)::float AS avg_score,
            CASE WHEN COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
              THEN COUNT(gto.id) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL')
              ELSE 0
            END AS win_rate,
            COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r
          FROM signals s
          LEFT JOIN ghost_trades gt ON gt.signal_id = s.id
          LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
          WHERE s.created_at >= ${sinceISO}
          GROUP BY s.setup_type
          ORDER BY count DESC
        `);
        break;
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Analytics breakdown error:", error);
    return NextResponse.json({ error: "Failed to compute breakdown" }, { status: 500 });
  }
}
