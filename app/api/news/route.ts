import { NextResponse } from "next/server";
import { MOCK_NEWS } from "@/lib/mockData";
import type { NewsItem } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    return NextResponse.json(MOCK_NEWS);
  }

  try {
    const url = `https://api.polygon.io/v2/reference/news?limit=20&order=desc&sort=published_utc&apiKey=${key}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json(MOCK_NEWS);

    const json = await res.json();
    const articles: { published_utc: string; publisher: { name: string }; title: string }[] = json.results ?? [];

    if (articles.length === 0) return NextResponse.json(MOCK_NEWS);

    const HOT_WINDOW_MS = 15 * 60 * 1000;
    const now = Date.now();

    const news: NewsItem[] = articles.map(a => {
      const published = new Date(a.published_utc);
      const timeStr = published.toISOString().slice(11, 16); // HH:MM
      const source  = abbreviateSource(a.publisher?.name ?? "");
      const hot     = now - published.getTime() < HOT_WINDOW_MS;
      return { time: timeStr, source, headline: a.title, hot };
    });

    return NextResponse.json(news);
  } catch {
    return NextResponse.json(MOCK_NEWS);
  }
}

function abbreviateSource(name: string): string {
  const map: Record<string, string> = {
    "Reuters":       "RTRS",
    "Bloomberg":     "BBG",
    "Wall Street Journal": "WSJ",
    "Financial Times": "FT",
    "CNBC":          "CNBC",
    "MarketWatch":   "MW",
    "Benzinga":      "BNZ",
    "Seeking Alpha": "SA",
    "The Motley Fool": "TMF",
  };
  for (const [key, abbrev] of Object.entries(map)) {
    if (name.includes(key)) return abbrev;
  }
  return name.slice(0, 4).toUpperCase();
}
