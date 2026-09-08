import { lazy, Suspense } from "react";
import { ClientOnly } from "./ClientOnly";
import type { SceneVariant } from "./scene";
import { cn } from "@/lib/utils";

const Scene = lazy(() => import("./scene"));

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function TwinVisual({
  variant,
  className,
  label = "Loading 3D twin model",
}: {
  variant: SceneVariant;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-surface", className)}>
      <ClientOnly fallback={<Placeholder label={label} />}>
        <Suspense fallback={<Placeholder label={label} />}>
          <Scene variant={variant} />
        </Suspense>
      </ClientOnly>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-background/70 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
        Three.js · R3F
      </div>
    </div>
  );
}
