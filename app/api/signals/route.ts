import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const instrument = request.nextUrl.searchParams.get("instrument");
    const status = request.nextUrl.searchParams.get("status");
    const minScore = request.nextUrl.searchParams.get("min_score");
    const rawDays = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
    const days = Number.isNaN(rawDays) || rawDays < 1 ? 30 : rawDays;
    const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") ?? "200", 10);
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 200 : Math.min(rawLimit, 500);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const conditions = ["created_at >= $1"];
    const params: (string | number)[] = [sinceISO];
    let p = 2;

    if (instrument) { conditions.push(`instrument = $${p++}`); params.push(instrument); }
    if (status)     { conditions.push(`status = $${p++}`);     params.push(status); }
    if (minScore)   { conditions.push(`confluence_score >= $${p++}`); params.push(parseFloat(minScore)); }
    params.push(limit);

    const client = await db.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM signals WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${p}`,
        params
      );
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Signals GET error:", error);
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
  }
}
