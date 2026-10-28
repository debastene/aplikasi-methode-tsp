"use client";

// Editor konfigurasi solver yang TERKENDALI (controlled): menerima `value` dan
// memanggil `onChange(next)`. Dipakai oleh mode "satu solver" (variant cards)
// dan kedua sisi mode "bandingkan" (variant segmented).

import { Flame, Ban, Hammer, RotateCcw, Plus, X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumField } from "./NumField";
import {
  type SolverConfig,
  type AlgorithmKey,
  DEFAULT_SA,
  DEFAULT_TS,
  DEFAULT_HEURISTIC,
} from "@/lib/solver/config";
import { pipelineLabel } from "@/lib/tsp/heuristic";
import type { ConstructionKey } from "@/lib/tsp/construction";
import type { ImprovementKey } from "@/lib/tsp/localSearch";
import { cn } from "@/lib/utils";

const CONSTRUCTIONS: { key: ConstructionKey; name: string; tagline: string }[] = [
  { key: "NN", name: "Nearest Neighbor", tagline: "selalu ke kota terdekat" },
  { key: "NI", name: "Nearest Insertion", tagline: "sisip kota terdekat ke tur" },
  { key: "CI", name: "Cheapest Insertion", tagline: "sisip yang paling murah" },
  { key: "FI", name: "Farthest Insertion", tagline: "bentuk kerangka besar dulu" },
  { key: "AI", name: "Arbitrary Insertion", tagline: "urutan acak, sisip termurah" },
  { key: "GI", name: "General Insertion", tagline: "sisip termurah menyeluruh, benih terdekat" },
];

const META = [
  { key: "sa" as const, name: "Simulated Annealing", icon: Flame, accent: "text-accent", tag: "Meniru pendinginan logam: berani ngawur saat panas, makin teliti saat dingin." },
  { key: "ts" as const, name: "Tabu Search", icon: Ban, accent: "text-destructive", tag: "Mengingat gerakan yang baru dipakai dan melarangnya sementara." },
];

type Props = {
  value: SolverConfig;
  onChange: (next: SolverConfig) => void;
  variant?: "cards" | "segmented";
};

export function SolverConfigForm({ value, onChange, variant = "cards" }: Props) {
  const c = value;
  const set = (patch: Partial<SolverConfig>) => onChange({ ...c, ...patch });
  const setAlgorithm = (algorithm: AlgorithmKey) => set({ algorithm });
  const h = c.heuristic;

  /** Tambah satu langkah perbaikan ke akhir rangkaian (boleh diulang). */
  const addStep = (k: ImprovementKey) =>
    set({ heuristic: { ...h, improvements: [...h.improvements, k] } });
  const removeStep = (i: number) =>
    set({ heuristic: { ...h, improvements: h.improvements.filter((_, j) => j !== i) } });
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= h.improvements.length) return;
    const next = h.improvements.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set({ heuristic: { ...h, improvements: next } });
  };

  const resetParams = () =>
    set(
      c.algorithm === "sa"
        ? { sa: { ...DEFAULT_SA } }
        : c.algorithm === "ts"
          ? { ts: { ...DEFAULT_TS } }
          : { heuristic: { ...DEFAULT_HEURISTIC } }
    );

  return (
    <div className="space-y-4">
      {/* ---- Pemilih solver ---- */}
      {variant === "cards" ? (
        <>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Metaheuristik
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {META.map((a) => {
                const Icon = a.icon;
                const active = c.algorithm === a.key;
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
                    <p className="mt-1.5 text-sm text-muted-foreground">{a.tag}</p>
                  </button>
                );
              })}
            </div>
          </div>

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
                c.algorithm === "heuristic"
                  ? "border-primary shadow-[var(--shadow-card-hover)]"
                  : "border-border hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
              )}
            >
              <div className="flex items-center gap-2">
                <Hammer className="size-5 text-secondary" />
                <span className="font-semibold">Konstruksi + perbaikan</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Bangun rute (NN/NI/CI/FI/AI/GI) lalu rapikan dengan rangkaian 2-opt / 3-opt.
              </p>
            </button>
          </div>
        </>
      ) : (
        <div className="inline-flex rounded-2xl border border-border bg-card p-1">
          {[
            { key: "sa" as const, label: "SA" },
            { key: "ts" as const, label: "TS" },
            { key: "heuristic" as const, label: "Heuristik" },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setAlgorithm(o.key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                c.algorithm === o.key
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* ---- Parameter ---- */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Parameter</p>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={resetParams}>
            <RotateCcw className="size-3.5" />
            Default
          </Button>
        </div>

        {c.algorithm === "sa" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumField label="Suhu awal (T₀)" value={c.sa.initialTemperature} min={1} onChange={(n) => set({ sa: { ...c.sa, initialTemperature: n } })} />
            <NumField label="Cooling rate" value={c.sa.coolingRate} step={0.001} min={0.5} onChange={(n) => set({ sa: { ...c.sa, coolingRate: n } })} />
            <NumField label="Maks iterasi" value={c.sa.maxIterations} min={1} onChange={(n) => set({ sa: { ...c.sa, maxIterations: n } })} />
            <NumField label="Seed" value={c.sa.seed} onChange={(n) => set({ sa: { ...c.sa, seed: n } })} />
          </div>
        )}

        {c.algorithm === "ts" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumField label="Maks iterasi" value={c.ts.maxIter} min={1} onChange={(n) => set({ ts: { ...c.ts, maxIter: n } })} />
            <NumField label="Tabu tenure" value={c.ts.tabuTenure} min={1} onChange={(n) => set({ ts: { ...c.ts, tabuTenure: n } })} />
            <NumField label="Jumlah tetangga" value={c.ts.numNeighbors} min={1} onChange={(n) => set({ ts: { ...c.ts, numNeighbors: n } })} />
            <NumField label="Seed" value={c.ts.seed} onChange={(n) => set({ ts: { ...c.ts, seed: n } })} />
          </div>
        )}

        {(c.algorithm === "sa" || c.algorithm === "ts") && (
          <div className="mt-3 grid gap-1.5 sm:max-w-56">
            <Label className="text-xs text-muted-foreground">Gerakan tetangga</Label>
            <Select value={c.neighborhood} onValueChange={(v) => set({ neighborhood: v as "swap" | "2opt" })}>
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

        {c.algorithm === "heuristic" && (
          <div className="space-y-4">
            {/* Langkah 1: konstruksi */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                <span className="mr-1.5 rounded-full bg-primary/10 px-1.5 text-primary">1</span>
                Bangun rute awal (konstruksi)
              </Label>
              <div className="flex flex-wrap gap-2">
                {CONSTRUCTIONS.map((ct) => {
                  const active = h.construction === ct.key;
                  return (
                    <button
                      key={ct.key}
                      type="button"
                      onClick={() => set({ heuristic: { ...h, construction: ct.key } })}
                      title={ct.tagline}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-primary/60 bg-[var(--surface-tint)] font-medium text-primary shadow-[var(--shadow-sm)]"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      {ct.key}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {CONSTRUCTIONS.find((x) => x.key === h.construction)?.name} —{" "}
                {CONSTRUCTIONS.find((x) => x.key === h.construction)?.tagline}
              </p>
            </div>

            {/* Langkah 2: rangkaian perbaikan (berurutan, boleh diulang) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                <span className="mr-1.5 rounded-full bg-primary/10 px-1.5 text-primary">2</span>
                Rangkaian perbaikan (berurutan, boleh diulang)
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {h.improvements.length === 0 && (
                  <span className="text-xs text-muted-foreground">Belum ada langkah — konstruksi saja.</span>
                )}
                {h.improvements.map((step, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-[var(--surface-tint)] py-1 pl-2 pr-1 text-sm font-medium text-primary"
                  >
                    <span className="text-[10px] text-primary/60">{i + 1}.</span>
                    {step === "2opt" ? "2-opt" : "3-opt"}
                    <button type="button" onClick={() => moveStep(i, -1)} aria-label="Geser kiri" className="rounded p-0.5 hover:bg-primary/10 disabled:opacity-30" disabled={i === 0}>
                      <ArrowLeft className="size-3" />
                    </button>
                    <button type="button" onClick={() => moveStep(i, 1)} aria-label="Geser kanan" className="rounded p-0.5 hover:bg-primary/10 disabled:opacity-30" disabled={i === h.improvements.length - 1}>
                      <ArrowRight className="size-3" />
                    </button>
                    <button type="button" onClick={() => removeStep(i)} aria-label="Hapus langkah" className="rounded p-0.5 hover:bg-destructive/15 hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addStep("2opt")}>
                  <Plus className="size-3.5" /> 2-opt
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addStep("3opt")}>
                  <Plus className="size-3.5" /> 3-opt
                </Button>
              </div>
            </div>

            {(h.construction === "NN" || h.construction === "AI") && (
              <div className="grid gap-3 sm:max-w-56">
                {h.construction === "NN" && (
                  <NumField label="Kota awal (index)" value={h.startNode} min={0} onChange={(n) => set({ heuristic: { ...h, startNode: n } })} />
                )}
                {h.construction === "AI" && (
                  <NumField label="Seed (urutan acak)" value={h.seed} onChange={(n) => set({ heuristic: { ...h, seed: n } })} />
                )}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Pipeline: </span>
              <span className="font-mono font-medium text-foreground">
                {pipelineLabel(h.construction, h.improvements)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
