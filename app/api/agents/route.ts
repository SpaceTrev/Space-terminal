import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role");
    const status = request.nextUrl.searchParams.get("status");

    let rows;
    if (role && status) {
      ({ rows } = await sql`
        SELECT * FROM agent_tasks
        WHERE agent_role = ${role} AND status = ${status}
        ORDER BY created_at DESC
      `);
    } else if (role) {
      ({ rows } = await sql`
        SELECT * FROM agent_tasks
        WHERE agent_role = ${role}
        ORDER BY created_at DESC
      `);
    } else if (status) {
      ({ rows } = await sql`
        SELECT * FROM agent_tasks
        WHERE status = ${status}
        ORDER BY created_at DESC
      `);
    } else {
      ({ rows } = await sql`
        SELECT * FROM agent_tasks
        ORDER BY created_at DESC
      `);
    }

    return NextResponse.json(rows);
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
