import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLiveTwin } from "@/lib/live-api";
import { TWINS, type TwinId } from "@/lib/nexus-data";

export function LiveSensorChart({ twin }: { twin: TwinId }) {
  const meta = TWINS[twin];
  const { history, error } = useLiveTwin(twin);

  return (
    <div className="h-[300px] w-full">
      {error && <p className="mb-2 text-xs text-warning">{error}</p>}
      {history.length === 0 && !error && <p className="mb-2 text-xs text-muted-foreground">Waiting for live telemetry...</p>}
      <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={history} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {meta.series.map((s, i) => (
              <linearGradient key={s.key} id={`g-${twin}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--color-foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} />
          {meta.series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#g-${twin}-${i})`}
              isAnimationActive={false}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
