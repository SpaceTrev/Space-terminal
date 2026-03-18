import { sql, db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role");
    const status = request.nextUrl.searchParams.get("status");
    const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);
    const rawOffset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 200);
    const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let p = 1;

    if (role)   { conditions.push(`agent_role = $${p++}`); params.push(role); }
    if (status) { conditions.push(`status = $${p++}`);     params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit, offset);

    const client = await db.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM agent_tasks ${where} ORDER BY created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
        params
      );
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Agents GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_role, prompt, linear_issue_id = null } = body;

    if (!agent_role || !prompt) {
      return NextResponse.json({ error: "agent_role and prompt are required" }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO agent_tasks (agent_role, prompt, linear_issue_id, status)
      VALUES (${agent_role}, ${prompt}, ${linear_issue_id}, 'queued')
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Agents POST error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
