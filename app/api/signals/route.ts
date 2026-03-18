import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const instrument = request.nextUrl.searchParams.get("instrument");
    const status = request.nextUrl.searchParams.get("status");
    const minScore = request.nextUrl.searchParams.get("min_score");
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    let rows;
    if (instrument && status && minScore) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND instrument = ${instrument}
          AND status = ${status}
          AND confluence_score >= ${parseFloat(minScore)}
        ORDER BY created_at DESC
      `);
    } else if (instrument && status) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND instrument = ${instrument}
          AND status = ${status}
        ORDER BY created_at DESC
      `);
    } else if (instrument && minScore) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND instrument = ${instrument}
          AND confluence_score >= ${parseFloat(minScore)}
        ORDER BY created_at DESC
      `);
    } else if (status && minScore) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND status = ${status}
          AND confluence_score >= ${parseFloat(minScore)}
        ORDER BY created_at DESC
      `);
    } else if (instrument) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND instrument = ${instrument}
        ORDER BY created_at DESC
      `);
    } else if (status) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND status = ${status}
        ORDER BY created_at DESC
      `);
    } else if (minScore) {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
          AND confluence_score >= ${parseFloat(minScore)}
        ORDER BY created_at DESC
      `);
    } else {
      ({ rows } = await sql`
        SELECT * FROM signals
        WHERE created_at >= ${sinceISO}
        ORDER BY created_at DESC
      `);
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Signals GET error:", error);
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
  }
}
