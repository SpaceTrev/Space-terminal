import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const instrument = request.nextUrl.searchParams.get("instrument");
    const outcome = request.nextUrl.searchParams.get("outcome");
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    let rows;
    if (instrument && outcome) {
      ({ rows } = await sql`
        SELECT gt.*, row_to_json(gto.*) as outcome
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        WHERE gt.created_at >= ${sinceISO}
          AND gt.instrument = ${instrument}
          AND gto.outcome = ${outcome}
        ORDER BY gt.created_at DESC
      `);
    } else if (instrument) {
      ({ rows } = await sql`
        SELECT gt.*, row_to_json(gto.*) as outcome
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        WHERE gt.created_at >= ${sinceISO}
          AND gt.instrument = ${instrument}
        ORDER BY gt.created_at DESC
      `);
    } else if (outcome) {
      ({ rows } = await sql`
        SELECT gt.*, row_to_json(gto.*) as outcome
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        WHERE gt.created_at >= ${sinceISO}
          AND gto.outcome = ${outcome}
        ORDER BY gt.created_at DESC
      `);
    } else {
      ({ rows } = await sql`
        SELECT gt.*, row_to_json(gto.*) as outcome
        FROM ghost_trades gt
        LEFT JOIN ghost_trade_outcomes gto ON gto.ghost_trade_id = gt.id
        WHERE gt.created_at >= ${sinceISO}
        ORDER BY gt.created_at DESC
      `);
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Ghost trades GET error:", error);
    return NextResponse.json({ error: "Failed to fetch ghost trades" }, { status: 500 });
  }
}
