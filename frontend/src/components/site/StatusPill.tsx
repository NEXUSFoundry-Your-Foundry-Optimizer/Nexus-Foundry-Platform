import { cn } from "@/lib/utils";
import { severityLabel, type Severity } from "@/lib/nexus-data";

const tone: Record<Severity, string> = {
  critical: "border-destructive/40 bg-destructive/12 text-destructive",
  warning: "border-warning/40 bg-warning/12 text-warning",
  normal: "border-success/40 bg-success/12 text-success",
};

const dot: Record<Severity, string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  normal: "bg-success",
};

export function StatusPill({
  status,
  label,
  className,
}: {
  status: Severity;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        tone[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full pulse-dot", dot[status])} />
      {label ?? severityLabel[status]}
    </span>
  );
}
