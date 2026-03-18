import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, output, started_at, completed_at } = body;

    const { rows } = await sql`
      UPDATE agent_tasks
      SET
        status = COALESCE(${status ?? null}, status),
        output = COALESCE(${output ?? null}, output),
        started_at = COALESCE(${started_at ?? null}, started_at),
        completed_at = COALESCE(${completed_at ?? null}, completed_at)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Agent PATCH error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
