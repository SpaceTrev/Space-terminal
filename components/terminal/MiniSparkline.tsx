import type { Theme } from "@/lib/themes";

interface Props {
  data: number[];
  up: boolean;
  t: Theme;
}

export function MiniSparkline({ data, up, t }: Props) {
  const w = 60, h = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={up ? t.up : t.down} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
