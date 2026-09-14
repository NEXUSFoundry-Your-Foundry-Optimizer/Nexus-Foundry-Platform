import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLiveCollection } from "@/lib/live-api";

interface ForecastResponse { forecasts: { timestamp: string; p10: number; p50: number; p90: number }[] }

/** FR-04: 48-hour degradation forecast with P10 / P50 / P90 quantile bands. */
export function TFTChart() {
  const { data } = useLiveCollection<ForecastResponse>("/api/v1/predictions/tft?horizon=48", 10000);
  const band = (data?.forecasts ?? []).map((point) => ({ ...point, h: new Date(point.timestamp).toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5), range: [point.p10, point.p90] as [number, number] }));
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={band} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="tft-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="h" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="range" name="P10–P90" stroke="none" fill="url(#tft-band)" isAnimationActive={false} />
          <Line type="monotone" dataKey="p50" name="P50 lining health" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="p10" name="P10" stroke="var(--color-chart-4)" strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="p90" name="P90" stroke="var(--color-chart-2)" strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
