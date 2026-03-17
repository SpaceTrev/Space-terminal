import { NextRequest, NextResponse } from "next/server";
import type { Provider, ChatMessage } from "@/lib/types";

const SYSTEM_PROMPT = (activeSymbol: string, activeTF: string) =>
  `You are a Bloomberg Terminal AI — senior macro strategist covering FX, futures, commodities and rates. Sharp, professional terminal style. Use **bold** for key terms and levels. Be decisive — real views, not hedges. Current market: EUR/USD 1.0847, GBP/USD 1.2634, USD/JPY 149.82, ES1! 5609, NQ1! 19766, CL1! 68.34, GC1! 2933, XAU/USD 2934, BTC 84210. Active: ${activeSymbol} ${activeTF}. 3-6 paragraphs max. Think like a trader.`;

export async function POST(req: NextRequest) {
  const { messages, activeSymbol, activeTF, provider } = await req.json() as {
    messages: ChatMessage[];
    activeSymbol: string;
    activeTF: string;
    provider: Provider;
  };

  const systemPrompt = SYSTEM_PROMPT(activeSymbol, activeTF);

  try {
    if (provider === "gemini") {
      return await callGemini(messages, systemPrompt);
    } else if (provider === "perplexity") {
      return await callPerplexity(messages, systemPrompt);
    } else if (provider === "claude") {
      return await callClaude(messages, systemPrompt);
    }
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function callGemini(messages: ChatMessage[], systemPrompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const lastMsg = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMsg?.content ?? "");
  const text = result.response.text();
  return NextResponse.json({ text });
}

async function callPerplexity(messages: ChatMessage[], systemPrompt: string) {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return NextResponse.json({ error: "PERPLEXITY_API_KEY not set" }, { status: 503 });

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: key, baseURL: "https://api.perplexity.ai" });

  const completion = await client.chat.completions.create({
    model: "llama-3.1-sonar-small-128k-online",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    max_tokens: 1000,
  });

  const text = completion.choices[0]?.message?.content ?? "No response.";
  return NextResponse.json({ text });
}

async function callClaude(messages: ChatMessage[], systemPrompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: key });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  return NextResponse.json({ text });
}
