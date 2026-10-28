"use client";

// Pengalih mode area solver: "Satu solver" (SolverPanel + Visualizer) atau
// "Bandingkan dua" (CompareView). DataInput tetap di atas (dataset dipakai bersama).

import { useState } from "react";
import { Square, Columns2 } from "lucide-react";
import { SolverPanel } from "@/components/tool/SolverPanel";
import { Visualizer } from "@/components/tool/Visualizer";
import { CompareView } from "@/components/tool/Compare/CompareView";
import { cn } from "@/lib/utils";

type Mode = "single" | "compare";

export function SolverWorkspace() {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div className="space-y-12">
      {/* Pengalih mode */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-[var(--shadow-sm)]">
          {(
            [
              { key: "single", label: "Satu solver", Icon: Square },
              { key: "compare", label: "Bandingkan dua", Icon: Columns2 },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setMode(o.key)}
              aria-pressed={mode === o.key}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                mode === o.key
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <o.Icon className="size-4" />
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "single" ? (
        <>
          <SolverPanel />
          <Visualizer />
        </>
      ) : (
        <CompareView />
      )}
    </div>
  );
}
