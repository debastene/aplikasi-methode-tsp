// ============================================================================
// Pipeline HEURISTIK KLASIK: konstruksi -> perbaikan, sebagai SATU aliran Frame.
// Setara algorithms/gabungan.py, tapi versi TypeScript yang beranimasi: tahap
// konstruksi menumbuhkan rute kota demi kota, lalu 2-opt/3-opt merapikannya —
// semuanya diputar ulang sebagai satu animasi berkesinambungan.
// ============================================================================

import type { AlgoResult, Frame, Point, Tour } from "./types";
import { tourCost } from "./distance";
import { makeRng } from "./rng";
import { FrameRecorder } from "./frames";
import {
  runConstruction,
  CONSTRUCTION_LABELS,
  type ConstructionKey,
} from "./construction";
import {
  runImprovement,
  IMPROVEMENT_LABELS,
  type ImprovementKey,
} from "./localSearch";

export interface HeuristicParams {
  construction: ConstructionKey;
  /** Urutan tahap perbaikan, mis. ["2opt","3opt"]. Kosong = konstruksi saja. */
  improvements?: ImprovementKey[];
  startNode?: number; // hanya NN
  seed?: number; // hanya AI
  maxFrames?: number; // default 300
  improveTimeBudgetMs?: number; // anggaran waktu per tahap perbaikan
}

/** Susun label pipeline, mis. "CI + 2-opt + 3-opt". */
export function pipelineLabel(
  construction: ConstructionKey,
  improvements: ImprovementKey[]
): string {
  return [construction, ...improvements.map((k) => IMPROVEMENT_LABELS[k])].join(" + ");
}

export function runHeuristic(points: Point[], params: HeuristicParams): AlgoResult {
  const {
    construction,
    improvements = [],
    startNode = 0,
    seed = 42,
    maxFrames = 300,
    improveTimeBudgetMs = 2500,
  } = params;

  const n = points.length;
  if (n < 3) throw new Error("Heuristik butuh minimal 3 kota.");

  const startTime = performance.now();
  const recorder = new FrameRecorder(maxFrames);
  const costHistory: number[] = [];
  let iteration = 0;

  const record = (
    tour: Tour,
    cost: number,
    extra: Partial<Frame>,
    category: "best" | "ordinary"
  ) => {
    const frame: Frame = {
      iteration: iteration++,
      currentTour: tour.slice(),
      currentCost: cost,
      bestTour: tour.slice(),
      bestCost: cost,
      accepted: true,
      ...extra,
    };
    recorder.record(frame, category);
    costHistory.push(cost);
  };

  // --- Tahap 1: KONSTRUKSI (rute tumbuh kota demi kota) ---
  const rng = makeRng(seed);
  const built = runConstruction(construction, points, { startNode, rng });
  for (const step of built.steps) {
    record(
      step.tour,
      tourCost(step.tour, points),
      { phase: "construction", focusNode: step.added, note: step.note },
      "ordinary"
    );
  }

  // --- Tahap 2: PERBAIKAN berurutan (2-opt lalu 3-opt, sesuai pilihan) ---
  let tour = built.tour.slice();
  for (const key of improvements) {
    const res = runImprovement(key, tour, points, { timeBudgetMs: improveTimeBudgetMs });
    for (const step of res.steps) {
      record(
        step.tour,
        tourCost(step.tour, points),
        { phase: key, focusEdges: step.edges, note: step.note },
        "best"
      );
    }
    tour = res.tour;
  }

  // Pastikan rute akhir selalu menjadi frame terakhir (kalau tahap perbaikan
  // berhenti karena anggaran waktu, frame terakhir tetap = keadaan final).
  const finalCost = tourCost(tour, points);
  const frames = recorder.finalize();
  if (frames.length === 0 || frames[frames.length - 1].bestCost !== finalCost) {
    const lastPhase = improvements.length
      ? improvements[improvements.length - 1]
      : "construction";
    frames.push({
      iteration: iteration++,
      currentTour: tour.slice(),
      currentCost: finalCost,
      bestTour: tour.slice(),
      bestCost: finalCost,
      accepted: true,
      phase: lastPhase,
      note: "Rute akhir",
    });
  }

  return {
    bestTour: tour,
    bestCost: finalCost,
    iterations: iteration,
    timeMs: performance.now() - startTime,
    frames,
    costHistory,
    label: `${CONSTRUCTION_LABELS[construction]} (${pipelineLabel(construction, improvements)})`,
  };
}
