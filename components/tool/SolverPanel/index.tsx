"use client";

// Pemilihan solver + panel parameter + tombol Jalankan.
// Dua kelompok: METAHEURISTIK (SA, TS) dan HEURISTIK KLASIK (konstruksi + perbaikan).

import { useId } from "react";
import { toast } from "sonner";
import { Flame, Ban, Play, Loader2, RotateCcw, Hammer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCityStore } from "@/lib/store/useCityStore";
import {
  DEFAULT_SA,
  DEFAULT_TS,
  DEFAULT_HEURISTIC,
  useRunStore,
  type AlgorithmKey,
} from "@/lib/store/useRunStore";
import { pipelineLabel } from "@/lib/tsp/heuristic";
import type { ConstructionKey } from "@/lib/tsp/construction";
import type { ImprovementKey } from "@/lib/tsp/localSearch";
import { validateCityCount } from "@/lib/parsing/validate";
import { cn } from "@/lib/utils";

const META_ALGOS: {
  key: AlgorithmKey;
  name: string;
  tagline: string;
  icon: typeof Flame;
  accent: string;
}[] = [
  {
    key: "sa",
    name: "Simulated Annealing",
    tagline: "Meniru pendinginan logam: berani ngawur saat panas, makin teliti saat dingin.",
    icon: Flame,
    accent: "text-accent",
  },
  {
    key: "ts",
    name: "Tabu Search",
    tagline: "Mengingat gerakan yang baru dipakai dan melarangnya sementara.",
    icon: Ban,
    accent: "text-destructive",
  },
];

const CONSTRUCTIONS: { key: ConstructionKey; name: string; tagline: string }[] = [
  { key: "NN", name: "Nearest Neighbor", tagline: "selalu ke kota terdekat" },
  { key: "NI", name: "Nearest Insertion", tagline: "sisip kota terdekat ke tur" },
  { key: "CI", name: "Cheapest Insertion", tagline: "sisip yang paling murah" },
  { key: "FI", name: "Farthest Insertion", tagline: "bentuk kerangka besar dulu" },
  { key: "AI", name: "Arbitrary Insertion", tagline: "urutan acak, sisip termurah" },
];

const IMPROVEMENTS: { key: ImprovementKey; name: string }[] = [
  { key: "2opt", name: "2-opt" },
  { key: "3opt", name: "3-opt" },
];

/** Input angka berlabel yang ringkas. */
function NumField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9"
      />
    </div>
  );
}

export function SolverPanel() {
  const cities = useCityStore((s) => s.cities);
  const algorithm = useRunStore((s) => s.algorithm);
  const setAlgorithm = useRunStore((s) => s.setAlgorithm);
  const neighborhood = useRunStore((s) => s.neighborhood);
  const setNeighborhood = useRunStore((s) => s.setNeighborhood);
  const sa = useRunStore((s) => s.sa);
  const ts = useRunStore((s) => s.ts);
  const heuristic = useRunStore((s) => s.heuristic);
  const setSa = useRunStore((s) => s.setSa);
  const setTs = useRunStore((s) => s.setTs);
  const setHeuristic = useRunStore((s) => s.setHeuristic);
  const run = useRunStore((s) => s.run);
  const isRunning = useRunStore((s) => s.isRunning);

  const v = validateCityCount(cities.length);
  const isMeta = algorithm === "sa" || algorithm === "ts";

  function handleRun() {
    if (!v.ok) {
      toast.error(v.message ?? "Data kota belum valid.");
      return;
    }
    run(cities);
    const label =
      algorithm === "sa"
        ? "Simulated Annealing"
        : algorithm === "ts"
          ? "Tabu Search"
          : pipelineLabel(heuristic.construction, heuristic.improvements);
    toast.success(`${label} dijalankan.`);
  }

  function resetParams() {
    if (algorithm === "sa") setSa({ ...DEFAULT_SA });
    else if (algorithm === "ts") setTs({ ...DEFAULT_TS });
    else setHeuristic({ ...DEFAULT_HEURISTIC });
  }

  /** Nyalakan/matikan tahap perbaikan, selalu dalam urutan kanonik [2opt, 3opt]. */
  function toggleImprovement(key: ImprovementKey) {
    const on = new Set(heuristic.improvements);
    if (on.has(key)) on.delete(key);
    else on.add(key);
    const CANONICAL: ImprovementKey[] = ["2opt", "3opt"];
    setHeuristic({ improvements: CANONICAL.filter((k) => on.has(k)) });
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">2. Pilih Solver</h2>
        <p className="text-sm text-muted-foreground">
          Pilih algoritma, atur parameternya, lalu jalankan. Animasinya langsung diputar.
        </p>
      </div>

      {/* --- Kelompok 1: Metaheuristik --- */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Metaheuristik
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {META_ALGOS.map((a) => {
            const Icon = a.icon;
            const active = algorithm === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setAlgorithm(a.key)}
                className={cn(
                  "rounded-3xl border-2 bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all",
                  active
                    ? "border-primary shadow-[var(--shadow-card-hover)]"
                    : "border-border hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("size-5", a.accent)} />
                  <span className="font-semibold">{a.name}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{a.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Kelompok 2: Heuristik klasik --- */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Heuristik klasik{" "}
          <span className="font-normal normal-case text-muted-foreground/80">
            — rakit sendiri: konstruksi + perbaikan
          </span>
        </p>
        <button
          type="button"
          onClick={() => setAlgorithm("heuristic")}
          className={cn(
            "w-full rounded-3xl border-2 bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all",
            algorithm === "heuristic"
              ? "border-primary shadow-[var(--shadow-card-hover)]"
              : "border-border hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
          )}
        >
          <div className="flex items-center gap-2">
            <Hammer className="size-5 text-secondary" />
            <span className="font-semibold">Konstruksi + perbaikan</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Bangun rute (NN/NI/CI/FI/AI) lalu rapikan dengan 2-opt / 3-opt.
          </p>
        </button>
      </div>

      {/* --- Panel parameter (menyesuaikan solver terpilih) --- */}
      <Card className="rounded-3xl">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Parameter</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={resetParams}
          >
            <RotateCcw className="size-3.5" />
            Kembalikan default
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {algorithm === "sa" && (
            <div className="grid gap-3 sm:grid-cols-4">
              <NumField label="Suhu awal (T₀)" value={sa.initialTemperature} min={1} onChange={(n) => setSa({ initialTemperature: n })} />
              <NumField label="Cooling rate" value={sa.coolingRate} step={0.001} min={0.5} onChange={(n) => setSa({ coolingRate: n })} />
              <NumField label="Maks iterasi" value={sa.maxIterations} min={1} onChange={(n) => setSa({ maxIterations: n })} />
              <NumField label="Seed" value={sa.seed} onChange={(n) => setSa({ seed: n })} />
            </div>
          )}

          {algorithm === "ts" && (
            <div className="grid gap-3 sm:grid-cols-4">
              <NumField label="Maks iterasi" value={ts.maxIter} min={1} onChange={(n) => setTs({ maxIter: n })} />
              <NumField label="Tabu tenure" value={ts.tabuTenure} min={1} onChange={(n) => setTs({ tabuTenure: n })} />
              <NumField label="Jumlah tetangga" value={ts.numNeighbors} min={1} onChange={(n) => setTs({ numNeighbors: n })} />
              <NumField label="Seed" value={ts.seed} onChange={(n) => setTs({ seed: n })} />
            </div>
          )}

          {algorithm === "heuristic" && (
            <div className="space-y-4">
              {/* Langkah 1: konstruksi */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  <span className="mr-1.5 rounded-full bg-primary/10 px-1.5 text-primary">1</span>
                  Bangun rute awal (konstruksi)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CONSTRUCTIONS.map((c) => {
                    const active = heuristic.construction === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setHeuristic({ construction: c.key })}
                        title={c.tagline}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "border-primary/60 bg-[var(--surface-tint)] font-medium text-primary shadow-[var(--shadow-sm)]"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {CONSTRUCTIONS.find((c) => c.key === heuristic.construction)?.tagline}
                </p>
              </div>

              {/* Langkah 2: perbaikan */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  <span className="mr-1.5 rounded-full bg-primary/10 px-1.5 text-primary">2</span>
                  Rapikan (opsional, boleh dua-duanya)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {IMPROVEMENTS.map((imp) => {
                    const active = heuristic.improvements.includes(imp.key);
                    return (
                      <button
                        key={imp.key}
                        type="button"
                        onClick={() => toggleImprovement(imp.key)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "border-primary/60 bg-[var(--surface-tint)] font-medium text-primary shadow-[var(--shadow-sm)]"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        {active && <Check className="size-3.5" />}
                        {imp.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parameter khusus NN (start node) & AI (seed) */}
              {(heuristic.construction === "NN" || heuristic.construction === "AI") && (
                <div className="grid gap-3 sm:max-w-56">
                  {heuristic.construction === "NN" && (
                    <NumField
                      label="Kota awal (index)"
                      value={heuristic.startNode}
                      min={0}
                      max={Math.max(0, cities.length - 1)}
                      onChange={(n) => setHeuristic({ startNode: n })}
                    />
                  )}
                  {heuristic.construction === "AI" && (
                    <NumField
                      label="Seed (urutan acak)"
                      value={heuristic.seed}
                      onChange={(n) => setHeuristic({ seed: n })}
                    />
                  )}
                </div>
              )}

              {/* Pratinjau pipeline */}
              <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Pipeline: </span>
                <span className="font-mono font-medium text-foreground">
                  {pipelineLabel(heuristic.construction, heuristic.improvements)}
                </span>
              </div>
            </div>
          )}

          {/* Gerakan tetangga hanya relevan untuk metaheuristik */}
          {isMeta && (
            <div className="grid gap-1.5 sm:max-w-56">
              <Label className="text-xs text-muted-foreground">Gerakan tetangga</Label>
              <Select
                value={neighborhood}
                onValueChange={(val) => setNeighborhood(val as "swap" | "2opt")}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swap">Swap (tukar 2 kota)</SelectItem>
                  <SelectItem value="2opt">2-opt (balik segmen)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ShinyButton onClick={handleRun} disabled={isRunning || !v.ok}>
              {isRunning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Jalankan
            </ShinyButton>
            {!v.ok && <span className="text-sm text-destructive">{v.message}</span>}
            <span className="text-xs text-muted-foreground">
              Seed sama → hasil sama persis (reproducible).
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
