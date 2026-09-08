import { useLiveCollection } from "@/lib/live-api";
import { cn } from "@/lib/utils";

/** FR-06: SHAP explainability for the XGBoost defect prediction. */
export function SHAPChart() {
  const { data } = useLiveCollection<{ features: { name: string; value: number }[] }>("/api/analytics/shap", 10000);
  const features = data?.features ?? [];
  const max = Math.max(...features.map((f) => Math.abs(f.value)), 1);
  return (
    <div className="space-y-3">
      {features.map((f) => {
        const pct = (Math.abs(f.value) / max) * 50;
        const positive = f.value >= 0;
        return (
          <div key={f.name} className="grid grid-cols-[minmax(0,1fr)_2fr_54px] items-center gap-3">
            <span className="truncate text-xs text-muted-foreground">{f.name}</span>
            <div className="relative h-4 rounded bg-muted/60">
              <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <span
                className={cn(
                  "absolute inset-y-0 rounded transition-all duration-700",
                  positive ? "left-1/2 bg-destructive/80" : "right-1/2 bg-primary/80",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn("text-right font-mono text-xs", positive ? "text-destructive" : "text-primary")}>
              {positive ? "+" : ""}
              {(f.value * 100).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
