import type { Bar } from "./types";

export function generateCandles(seed: number, count = 40): Bar[] {
  let s = Math.abs(Math.round(seed)) || 1;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: count }, (_, i) => {
    const drift = (rng() - 0.495) * seed * 0.0003;
    const base  = seed + Math.sin(i * 0.25) * seed * 0.008 + drift * i;
    const open  = base;
    const close = open + (rng() - 0.48) * seed * 0.004;
    const high  = Math.max(open, close) + rng() * seed * 0.002;
    const low   = Math.min(open, close) - rng() * seed * 0.002;
    return { open, close, high, low, up: close >= open };
  });
}
