import { NextResponse } from "next/server";
import { setupDatabase } from "@/lib/db";

export async function POST() {
  try {
    await setupDatabase();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DB setup failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Setup failed" },
      { status: 500 }
    );
  }
}
