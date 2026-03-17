import type { Theme } from "@/lib/themes";
import type { Bar } from "@/lib/types";

interface Props {
  bars: Bar[];
  t: Theme;
}

export function CandleChart({ bars, t }: Props) {
  const allPrices = bars.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices), maxP = Math.max(...allPrices);
  const toY = (p: number) => ((maxP - p) / (maxP - minP || 1)) * 175 + 12;
  const cW = 10, gap = 4;

  return (
    <svg width="100%" height="200" viewBox={`0 0 ${bars.length * (cW + gap)} 200`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={t.candleGrad1} />
          <stop offset="100%" stopColor={t.candleGrad2} />
        </linearGradient>
      </defs>
      <rect width="100%" height="200" fill="url(#cGrad)" />
      {[0.2, 0.4, 0.6, 0.8].map(p => (
        <line key={p} x1="0" y1={200 * p} x2="100%" y2={200 * p}
          stroke={t.candleGrid} strokeWidth="1" strokeDasharray="3,3" />
      ))}
      {bars.map((c, i) => {
        const x       = i * (cW + gap);
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const color   = c.up ? t.up : t.down;
        return (
          <g key={i}>
            <line x1={x + cW / 2} y1={toY(c.high)} x2={x + cW / 2} y2={toY(c.low)} stroke={color} strokeWidth="1" />
            <rect x={x} y={bodyTop} width={cW} height={Math.max(bodyBot - bodyTop, 1)} fill={color} opacity="0.88" rx="0.5" />
          </g>
        );
      })}
    </svg>
  );
}
