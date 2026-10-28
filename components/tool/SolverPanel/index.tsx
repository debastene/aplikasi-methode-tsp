"use client";

// Mode SATU solver: pilih konfigurasi (SolverConfigForm) + tombol Jalankan.

import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { SolverConfigForm } from "@/components/tool/solver/SolverConfigForm";
import { useCityStore } from "@/lib/store/useCityStore";
import { useRunStore } from "@/lib/store/useRunStore";
import { configLabel } from "@/lib/solver/config";
import { validateCityCount } from "@/lib/parsing/validate";

export function SolverPanel() {
  const cities = useCityStore((s) => s.cities);
  const config = useRunStore((s) => s.config);
  const setConfig = useRunStore((s) => s.setConfig);
  const run = useRunStore((s) => s.run);
  const isRunning = useRunStore((s) => s.isRunning);

  const v = validateCityCount(cities.length);

  function handleRun() {
    if (!v.ok) {
      toast.error(v.message ?? "Data kota belum valid.");
      return;
    }
    run(cities);
    toast.success(`${configLabel(config)} dijalankan.`);
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-base text-primary-foreground shadow-sm shadow-primary/30">
            2
          </span>
          Pilih Solver
        </h2>
        <p className="text-sm text-muted-foreground">
          Pilih algoritma, atur parameternya, lalu jalankan. Animasinya langsung diputar.
        </p>
      </div>

      <SolverConfigForm value={config} onChange={setConfig} variant="cards" />

      <div className="flex flex-wrap items-center gap-3">
        <ShinyButton onClick={handleRun} disabled={isRunning || !v.ok}>
          {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          Jalankan
        </ShinyButton>
        {!v.ok && <span className="text-sm text-destructive">{v.message}</span>}
        <span className="text-xs text-muted-foreground">
          Seed sama → hasil sama persis (reproducible).
        </span>
      </div>
    </section>
  );
}
