import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const [totals, byTimeframe, bySession] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total_signals,
          COALESCE(AVG(confluence_score), 0)::float AS avg_score
        FROM signals
        WHERE created_at >= ${sinceISO}
      `,
      sql`
        SELECT timeframe, COUNT(*)::int AS count
        FROM signals
        WHERE created_at >= ${sinceISO}
        GROUP BY timeframe
        ORDER BY count DESC
      `,
      sql`
        SELECT COALESCE(session, 'unknown') AS session, COUNT(*)::int AS count
        FROM signals
        WHERE created_at >= ${sinceISO}
        GROUP BY session
        ORDER BY count DESC
      `,
    ]);

    const row = totals.rows[0];

    const by_timeframe: Record<string, number> = {};
    for (const r of byTimeframe.rows) {
      by_timeframe[r.timeframe] = r.count;
    }

    const by_session: Record<string, number> = {};
    for (const r of bySession.rows) {
      by_session[r.session] = r.count;
    }

    return NextResponse.json({
      total_signals: row.total_signals ?? 0,
      avg_score: Math.round((row.avg_score ?? 0) * 100) / 100,
      by_timeframe,
      by_session,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json({ error: "Failed to compute summary" }, { status: 500 });
  }
}
