import { jsxs, jsx } from "react/jsx-runtime";
import { s as severityLabel, c as cn } from "./router-C2feh6VC.js";
const tone = {
  critical: "border-destructive/40 bg-destructive/12 text-destructive",
  warning: "border-warning/40 bg-warning/12 text-warning",
  normal: "border-success/40 bg-success/12 text-success"
};
const dot = {
  critical: "bg-destructive",
  warning: "bg-warning",
  normal: "bg-success"
};
function StatusPill({
  status,
  label,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        tone[status],
        className
      ),
      children: [
        /* @__PURE__ */ jsx("span", { className: cn("size-1.5 rounded-full pulse-dot", dot[status]) }),
        label ?? severityLabel[status]
      ]
    }
  );
}
export {
  StatusPill as S
};
