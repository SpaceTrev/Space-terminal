import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const { rows } = await sql`
      SELECT
        COUNT(gt.id)::int AS total,
        COUNT(gto.id) FILTER (WHERE gto.outcome != 'NO_FILL')::int AS filled,
        COUNT(gto.id) FILTER (WHERE gto.outcome = 'WIN')::int AS wins,
        COUNT(gto.id) FILTER (WHERE gto.outcome = 'LOSS')::int AS losses,
        COALESCE(AVG(gto.r_multiple) FILTER (WHERE gto.outcome IN ('WIN', 'LOSS', 'BREAKEVEN')), 0)::float AS avg_r,
        ARRAY_AGG(gto.r_multiple ORDER BY gto.r_multiple) FILTER (WHERE gto.r_multiple IS NOT NULL) AS r_values
      FROM ghost_trades gt
      LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
      WHERE gt.created_at >= ${sinceISO}
    `;

    const row = rows[0];
    const total = row.total ?? 0;
    const filled = row.filled ?? 0;
    const wins = row.wins ?? 0;
    const losses = row.losses ?? 0;
    const avgR = row.avg_r ?? 0;
    const rValues: number[] = row.r_values ?? [];

    const fillRate = total > 0 ? filled / total : 0;
    const winRate = filled > 0 ? wins / filled : 0;

    // Median R
    let medianR = 0;
    if (rValues.length > 0) {
      const mid = Math.floor(rValues.length / 2);
      medianR = rValues.length % 2 === 0
        ? (rValues[mid - 1] + rValues[mid]) / 2
        : rValues[mid];
    }

    // Expectancy = (win_rate * avg_win) - (loss_rate * avg_loss)
    const winRs = rValues.filter((r) => r > 0);
    const lossRs = rValues.filter((r) => r < 0);
    const avgWin = winRs.length > 0 ? winRs.reduce((a, b) => a + b, 0) / winRs.length : 0;
    const avgLoss = lossRs.length > 0 ? Math.abs(lossRs.reduce((a, b) => a + b, 0) / lossRs.length) : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    return NextResponse.json({
      total,
      filled,
      fill_rate: Math.round(fillRate * 10000) / 10000,
      wins,
      losses,
      win_rate: Math.round(winRate * 10000) / 10000,
      avg_r: Math.round(avgR * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      median_r: Math.round(medianR * 100) / 100,
    });
  } catch (error) {
    console.error("Ghost trades summary error:", error);
    return NextResponse.json({ error: "Failed to compute summary" }, { status: 500 });
  }
}
