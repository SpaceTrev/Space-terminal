"use client";

import { useEffect, useRef, useState } from "react";
import type { Bar } from "@/lib/types";
import type { Theme } from "@/lib/themes";

interface Props {
  bars: Bar[];
  t: Theme;
}

export function LightweightChart({ bars, t }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<import("lightweight-charts").IChartApi | null>(null);
  const candleSeriesRef = useRef<import("lightweight-charts").ISeriesApi<"Candlestick"> | null>(null);
  const volSeriesRef = useRef<import("lightweight-charts").ISeriesApi<"Histogram"> | null>(null);
  const [initialFitDone, setInitialFitDone] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let chart: import("lightweight-charts").IChartApi;

    (async () => {
      const { createChart, CandlestickSeries, HistogramSeries } = await import("lightweight-charts");

      if (disposed) return;

      chart = createChart(containerRef.current!, {
        layout: {
          background: { color: "transparent" },
          textColor: t.textMuted,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: t.border, style: 1 },
          horzLines: { color: t.border, style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: t.accentBlue, labelBackgroundColor: t.accentBlue },
          horzLine: { color: t.accentBlue, labelBackgroundColor: t.accentBlue },
        },
        rightPriceScale: {
          borderColor: t.border,
          textColor: t.textMuted,
        },
        timeScale: {
          borderColor: t.border,
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (time: number) => {
            const d = new Date(time * 1000);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          },
        },
        handleScroll: true,
        handleScale: true,
      });

      // Candlestick series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor:          t.up,
        downColor:        t.down,
        borderUpColor:    t.up,
        borderDownColor:  t.down,
        wickUpColor:      t.up,
        wickDownColor:    t.down,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      // Volume histogram (separate pane)
      const volSeries = chart.addSeries(HistogramSeries, {
        color: t.accentBlue + "55",
        priceScaleId: "vol",
        priceLineVisible: false,
        lastValueVisible: false,
      });

      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        borderVisible: false,
      });

      candleSeriesRef.current = candleSeries;
      volSeriesRef.current = volSeries;
      chartRef.current = chart;

      // Set initial data
      if (bars.length > 0) {
        setChartData(bars, candleSeries, volSeries);
      }

      // Fit content
      chart.timeScale().fitContent();
    })();

    return () => {
      disposed = true;
      chart?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: { textColor: t.textMuted },
      grid: {
        vertLines: { color: t.border },
        horzLines: { color: t.border },
      },
      crosshair: {
        vertLine: { color: t.accentBlue, labelBackgroundColor: t.accentBlue },
        horzLine: { color: t.accentBlue, labelBackgroundColor: t.accentBlue },
      },
      rightPriceScale: { borderColor: t.border },
      timeScale: { borderColor: t.border },
    });
    candleSeriesRef.current?.applyOptions({
      upColor: t.up, downColor: t.down,
      borderUpColor: t.up, borderDownColor: t.down,
      wickUpColor: t.up, wickDownColor: t.down,
    });
    volSeriesRef.current?.applyOptions({ color: t.accentBlue + "55" });
  }, [t]);

  // Update data when bars change
  useEffect(() => {
    if (!candleSeriesRef.current || !volSeriesRef.current || bars.length === 0) return;
    setChartData(bars, candleSeriesRef.current, volSeriesRef.current);
    if (!initialFitDone) {
      chartRef.current?.timeScale().fitContent();
      setInitialFitDone(true);
    }
  }, [bars, initialFitDone]);

  // Resize observer — guard only on container; chart may still be initializing async
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chartRef.current?.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: 200, position: "relative" }}
    />
  );
}

function setChartData(
  bars: Bar[],
  candleSeries: import("lightweight-charts").ISeriesApi<"Candlestick">,
  volSeries: import("lightweight-charts").ISeriesApi<"Histogram">,
) {
  // lightweight-charts needs sorted timestamps; assign synthetic ones if missing
  const now = Math.floor(Date.now() / 1000);
  const BAR_SECS = 4 * 3600; // default 4H spacing if no timestamp

  const candles: import("lightweight-charts").CandlestickData[] = [];
  const volumes: import("lightweight-charts").HistogramData[] = [];

  bars.forEach((b, i) => {
    const time = (b.timestamp ? Math.floor(b.timestamp / 1000) : now - (bars.length - i) * BAR_SECS) as import("lightweight-charts").Time;
    candles.push({ time, open: b.open, high: b.high, low: b.low, close: b.close });
    if (b.volume !== undefined) {
      volumes.push({ time, value: b.volume, color: b.up ? "#00d4aa33" : "#ff4d4d33" });
    }
  });

  try {
    candleSeries.setData(candles);
    if (volumes.length > 0) volSeries.setData(volumes);
  } catch {
    // ignore duplicate timestamp errors on rapid updates
  }
}
