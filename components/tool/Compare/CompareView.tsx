"use client";

// Mode BANDINGKAN DUA: dua konfigurasi (A & B) di dataset yang sama,
// diputar bersamaan, dengan ringkasan perbandingan.

import { useEffect } from "react";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Loader2,
  Gauge,
  Trophy,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ShinyButton } from "@/components/ui/shiny-button";
import { RouteCanvas } from "@/components/tool/Visualizer/RouteCanvas";
import { SolverConfigForm } from "@/components/tool/solver/SolverConfigForm";
import { useCityStore } from "@/lib/store/useCityStore";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { configLabel, type SolverConfig, type AlgorithmKey } from "@/lib/solver/config";
import type { AlgoResult } from "@/lib/tsp/types";
import type { City } from "@/lib/types";
import { validateCityCount } from "@/lib/parsing/validate";
import { cn } from "@/lib/utils";

const TONE = {
  A: { dot: "bg-primary", text: "text-primary", ring: "ring-primary/30" },
  B: { dot: "bg-secondary", text: "text-secondary", ring: "ring-secondary/30" },
} as const;

/** Satu kanvas rute untuk satu sisi, mengikuti frame bersama. */
function SideCanvas({
  label,
  result,
  algorithm,
  frameIndex,
  duration,
  cities,
}: {
  label: "A" | "B";
  result: AlgoResult | null;
  algorithm: AlgorithmKey | null;
  frameIndex: number;
  duration: number;
  cities: City[];
}) {
  const tone = TONE[label];
  if (!result) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
        Konfigurasi {label} belum dijalankan.
      </div>
    );
  }
  const idx = Math.min(frameIndex, result.frames.length - 1);
  const frame = result.frames[idx];
  const isHeuristic = algorithm === "heuristic";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex items-center gap-1.5 text-sm font-semibold", tone.text)}>
          <span className={cn("size-2 rounded-full", tone.dot)} /> {label}
        </span>
        <span className="truncate text-xs text-muted-foreground" title={result.label ?? ""}>
          {result.label ?? ""}
        </span>
      </div>
      <RouteCanvas
        cities={cities}
        currentTour={frame.currentTour}
        bestTour={frame.bestTour}
        duration={duration}
        showCurrent={!isHeuristic}
        focusNode={frame.focusNode}
        focusEdges={frame.focusEdges}
      />
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
        <span className="text-muted-foreground">Panjang saat ini</span>
        <span className="font-bold tabular-nums">{frame.currentCost.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function CompareView() {
  const cities = useCityStore((s) => s.cities);
  const a = useCompareStore((s) => s.a);
  const b = useCompareStore((s) => s.b);
  const setA = useCompareStore((s) => s.setA);
  const setB = useCompareStore((s) => s.setB);
  const sideA = useCompareStore((s) => s.sideA);
  const sideB = useCompareStore((s) => s.sideB);
  const isRunning = useCompareStore((s) => s.isRunning);
  const run = useCompareStore((s) => s.run);
  const frameIndex = useCompareStore((s) => s.frameIndex);
  const playing = useCompareStore((s) => s.playing);
  const speed = useCompareStore((s) => s.speed);
  const setSpeed = useCompareStore((s) => s.setSpeed);
  const setFrameIndex = useCompareStore((s) => s.setFrameIndex);
  const togglePlay = useCompareStore((s) => s.togglePlay);
  const stepForward = useCompareStore((s) => s.stepForward);
  const stepBack = useCompareStore((s) => s.stepBack);
  const resetPlayback = useCompareStore((s) => s.resetPlayback);
  const pause = useCompareStore((s) => s.pause);

  const v = validateCityCount(cities.length);
  const maxFrames = Math.max(
    sideA.result?.frames.length ?? 0,
    sideB.result?.frames.length ?? 0
  );
  const hasResult = !!(sideA.result && sideB.result);
  const duration = Math.min(0.4, (1 / speed) * 0.9);

  // Pemutar bersama: maju satu frame tiap 1000/speed ms selama `playing`.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const s = useCompareStore.getState();
      const n = s.maxFrames();
      if (s.frameIndex >= n - 1) {
        s.pause();
        return;
      }
      s.setFrameIndex(s.frameIndex + 1);
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed]);

  function handleRun() {
    if (!v.ok) {
      toast.error(v.message ?? "Data kota belum valid.");
      return;
    }
    run(cities);
    toast.success("Perbandingan dijalankan.");
  }

  const atEnd = frameIndex >= maxFrames - 1;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-base text-primary-foreground shadow-sm shadow-primary/30">
            2
          </span>
          Bandingkan Dua Konfigurasi
        </h2>
        <p className="text-sm text-muted-foreground">
          Atur dua solver (kiri &amp; kanan), jalankan di dataset yang sama, lalu amati
          keduanya berdampingan.
        </p>
      </div>

      {/* Dua editor konfigurasi berdampingan */}
      <div className="grid gap-5 lg:grid-cols-2">
        {(["A", "B"] as const).map((label) => {
          const tone = TONE[label];
          const value = label === "A" ? a : b;
          const onChange = (c: SolverConfig) => (label === "A" ? setA(c) : setB(c));
          return (
            <div key={label} className={cn("rounded-3xl p-0.5")}>
              <div className={cn("mb-2 flex items-center gap-2 text-sm font-semibold", tone.text)}>
                <span className={cn("size-2.5 rounded-full", tone.dot)} />
                Konfigurasi {label}
              </div>
              <SolverConfigForm value={value} onChange={onChange} variant="segmented" />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ShinyButton onClick={handleRun} disabled={isRunning || !v.ok}>
          {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          Jalankan perbandingan
        </ShinyButton>
        {!v.ok && <span className="text-sm text-destructive">{v.message}</span>}
      </div>

      {hasResult && (
        <>
          {/* Dua kanvas berdampingan */}
          <div className="grid gap-5 lg:grid-cols-2">
            <SideCanvas label="A" result={sideA.result} algorithm={sideA.algorithm} frameIndex={frameIndex} duration={duration} cities={cities} />
            <SideCanvas label="B" result={sideB.result} algorithm={sideB.algorithm} frameIndex={frameIndex} duration={duration} cities={cities} />
          </div>

          {/* Kontrol pemutaran BERSAMA */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="icon" variant="outline" onClick={stepBack} disabled={frameIndex === 0} aria-label="Mundur satu langkah">
                <SkipBack className="size-4" />
              </Button>
              <Button size="icon" onClick={togglePlay} aria-label={playing ? "Jeda" : "Putar"}>
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <Button size="icon" variant="outline" onClick={stepForward} disabled={atEnd} aria-label="Maju satu langkah">
                <SkipForward className="size-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={resetPlayback} aria-label="Ulang dari awal">
                <RotateCcw className="size-4" />
              </Button>
              <div className="ml-auto text-sm tabular-nums text-muted-foreground">
                frame {Math.min(frameIndex + 1, maxFrames)}/{maxFrames}
              </div>
            </div>
            <Slider
              value={[frameIndex]}
              min={0}
              max={Math.max(0, maxFrames - 1)}
              step={1}
              onValueChange={(val) => {
                pause();
                setFrameIndex(Array.isArray(val) ? val[0] : val);
              }}
              aria-label="Geser ke frame"
            />
            <div className="flex items-center gap-3">
              <Gauge className="size-4 shrink-0 text-muted-foreground" />
              <Slider value={[speed]} min={1} max={30} step={1} onValueChange={(val) => setSpeed(Array.isArray(val) ? val[0] : val)} aria-label="Kecepatan animasi" />
              <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {speed} fps
              </span>
            </div>
          </div>

          <ComparisonSummary a={a} b={b} resultA={sideA.result!} resultB={sideB.result!} />
        </>
      )}
    </section>
  );
}

/** Satu kartu ringkasan sisi. */
function SummaryCard({
  label,
  config,
  result,
  win,
}: {
  label: "A" | "B";
  config: SolverConfig;
  result: AlgoResult;
  win: boolean;
}) {
  const tone = TONE[label];
  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]", win ? "border-secondary/60 ring-1 ring-secondary/30" : "border-border")}>
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-sm font-semibold", tone.text)}>
          <span className={cn("size-2 rounded-full", tone.dot)} /> {label}
        </span>
        {win && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
            <Trophy className="size-3" /> Lebih pendek
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={configLabel(config)}>
        {configLabel(config)}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-secondary">{result.bestCost.toFixed(2)}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Timer className="size-3" /> {result.timeMs.toFixed(1)} ms · {result.iterations} langkah
      </p>
    </div>
  );
}

/** Ringkasan: jarak akhir A vs B, selisih, mana lebih pendek, waktu. */
function ComparisonSummary({
  a,
  b,
  resultA,
  resultB,
}: {
  a: SolverConfig;
  b: SolverConfig;
  resultA: AlgoResult;
  resultB: AlgoResult;
}) {
  const ca = resultA.bestCost;
  const cb = resultB.bestCost;
  const aWins = ca < cb - 1e-9;
  const bWins = cb < ca - 1e-9;
  const selisih = Math.abs(ca - cb);
  const persen = (selisih / Math.min(ca, cb)) * 100;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Ringkasan perbandingan</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label="A" config={a} result={resultA} win={aWins} />
        <SummaryCard label="B" config={b} result={resultB} win={bWins} />
      </div>
      <p className="rounded-2xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {selisih < 1e-6 ? (
          <>Kedua konfigurasi menghasilkan rute dengan panjang yang sama.</>
        ) : (
          <>
            Selisih panjang rute ={" "}
            <span className="font-semibold text-foreground tabular-nums">{selisih.toFixed(2)}</span>{" "}
            (<span className="tabular-nums">{persen.toFixed(1)}%</span>).{" "}
            <span className={aWins ? TONE.A.text : TONE.B.text}>
              {aWins ? "Konfigurasi A" : "Konfigurasi B"}
            </span>{" "}
            lebih pendek.
          </>
        )}
      </p>
    </div>
  );
}
