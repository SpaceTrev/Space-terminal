import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { scanInstrument } from "@/lib/signals/scanner";

const INSTRUMENTS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "XAU/USD",
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "GBP/JPY",
  "USD/CAD",
];

export async function POST(request: NextRequest) {
  try {
    const barsBaseUrl = new URL("/api/bars", request.url);
    const currentHour = new Date().getUTCHours();
    const createdSignals = [];

    for (const instrument of INSTRUMENTS) {
      try {
        const barsUrl = new URL(barsBaseUrl);
        barsUrl.searchParams.set("symbol", instrument);
        barsUrl.searchParams.set("timeframe", "15M");

        const barsRes = await fetch(barsUrl.toString());
        if (!barsRes.ok) continue;

        const bars = await barsRes.json();
        const signal = scanInstrument(instrument, bars, currentHour);

        if (signal) {
          const { rows } = await sql`
            INSERT INTO signals (
              instrument, direction, setup_type, timeframe, session,
              confluence_score, score_grade, entry_ref, stop_loss,
              tp1, tp2, tp3, htf_aligned, liquidity_swept,
              momentum_shift, status
            ) VALUES (
              ${signal.instrument}, ${signal.direction}, ${signal.setup_type},
              '15M', ${signal.session ?? null},
              ${signal.confluence_score ?? 0}, ${signal.score_grade ?? null},
              ${signal.entry_ref ?? null}, ${signal.stop_loss ?? null},
              ${signal.tp1 ?? null}, ${signal.tp2 ?? null}, ${signal.tp3 ?? null},
              ${signal.htf_aligned ?? false}, ${signal.liquidity_swept ?? false},
              ${signal.momentum_shift ?? false},
              'PENDING'
            )
            RETURNING *
          `;

          const created = rows[0];

          await sql`
            INSERT INTO signal_events (signal_id, event_type, metadata)
            VALUES (${created.id}, 'CREATED', ${JSON.stringify({ source: "scan" })}::jsonb)
          `;

          createdSignals.push(created);
        }
      } catch (err) {
        console.error(`Scan failed for ${instrument}:`, err);
      }
    }

    return NextResponse.json({ signals: createdSignals, count: createdSignals.length });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
