import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const view = request.nextUrl.searchParams.get("view") ?? "strategies";

    let groupCol: string;
    switch (view) {
      case "symbols":
        groupCol = "gt.instrument";
        break;
      case "checklist":
        groupCol = "gt.setup_type";
        break;
      case "strategies":
      default:
        groupCol = "gt.strategy_key";
        break;
    }

    // Cannot use dynamic column names with parameterized queries,
    // so we use separate queries per view for safety.
    let rows;
    if (view === "symbols") {
      ({ rows } = await sql`
        SELECT
          gt.instrument AS key,
          COUNT(*)::int AS count,
          COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r,
          CASE WHEN COUNT(*) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
            THEN COUNT(*) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(*) FILTER (WHERE gto.outcome != 'NO_FILL')
            ELSE 0
          END AS win_rate
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        GROUP BY gt.instrument
        ORDER BY win_rate DESC, avg_r DESC
      `);
    } else if (view === "checklist") {
      ({ rows } = await sql`
        SELECT
          gt.setup_type AS key,
          COUNT(*)::int AS count,
          COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r,
          CASE WHEN COUNT(*) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
            THEN COUNT(*) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(*) FILTER (WHERE gto.outcome != 'NO_FILL')
            ELSE 0
          END AS win_rate
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        GROUP BY gt.setup_type
        ORDER BY win_rate DESC, avg_r DESC
      `);
    } else {
      ({ rows } = await sql`
        SELECT
          gt.strategy_key AS key,
          COUNT(*)::int AS count,
          COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r,
          CASE WHEN COUNT(*) FILTER (WHERE gto.outcome != 'NO_FILL') > 0
            THEN COUNT(*) FILTER (WHERE gto.outcome = 'WIN')::float / COUNT(*) FILTER (WHERE gto.outcome != 'NO_FILL')
            ELSE 0
          END AS win_rate
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        GROUP BY gt.strategy_key
        ORDER BY win_rate DESC, avg_r DESC
      `);
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
