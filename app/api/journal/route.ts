import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { rows } = await sql`
      SELECT * FROM journal_entries
      WHERE created_at >= ${since.toISOString()}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Journal GET error:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      note,
      emotion_emoji = null,
      emotion_score = null,
      tags = [],
      confidence = null,
      rule_followed = null,
      trade_id = null,
      signal_id = null,
    } = body;

    if (!note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO journal_entries (note, emotion_emoji, emotion_score, tags, confidence, rule_followed, trade_id, signal_id)
      VALUES (${note}, ${emotion_emoji}, ${emotion_score}, ${JSON.stringify(tags)}::jsonb, ${confidence}, ${rule_followed}, ${trade_id}, ${signal_id})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Journal POST error:", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
