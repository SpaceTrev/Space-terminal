import type { Provider } from "./types";

export function getAvailableProviders(): Provider[] {
  return [
    process.env.PERPLEXITY_API_KEY && "perplexity",
    process.env.GEMINI_API_KEY     && "gemini",
    process.env.ANTHROPIC_API_KEY  && "claude",
  ].filter(Boolean) as Provider[];
}

export const PROVIDER_LABELS: Record<Provider, string> = {
  perplexity: "PERPLEXITY",
  gemini:     "GEMINI",
  claude:     "CLAUDE",
};
