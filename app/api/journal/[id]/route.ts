import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rows } = await sql`
      SELECT * FROM journal_entries WHERE id = ${id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Journal GET [id] error:", error);
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { note, emotion_emoji, emotion_score, tags, confidence, rule_followed } = body;

    const { rows } = await sql`
      UPDATE journal_entries
      SET
        note = COALESCE(${note ?? null}, note),
        emotion_emoji = COALESCE(${emotion_emoji ?? null}, emotion_emoji),
        emotion_score = COALESCE(${emotion_score ?? null}, emotion_score),
        tags = COALESCE(${tags ? JSON.stringify(tags) : null}::jsonb, tags),
        confidence = COALESCE(${confidence ?? null}, confidence),
        rule_followed = COALESCE(${rule_followed ?? null}, rule_followed)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Journal PUT error:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
