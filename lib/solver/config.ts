// ============================================================================
// Konfigurasi solver yang dipakai bersama oleh mode SATU solver (useRunStore)
// dan mode BANDINGKAN DUA (useCompareStore). Satu bentuk konfigurasi + satu
// fungsi eksekusi, supaya kedua mode berjalan dari sumber yang sama.
// ============================================================================

import type { AlgoResult, Point } from "@/lib/tsp/types";
import { runSimulatedAnnealing } from "@/lib/tsp/simulatedAnnealing";
import { runTabuSearch } from "@/lib/tsp/tabuSearch";
import { runHeuristic, pipelineLabel } from "@/lib/tsp/heuristic";
import type { ConstructionKey } from "@/lib/tsp/construction";
import { CONSTRUCTION_LABELS } from "@/lib/tsp/construction";
import type { ImprovementKey } from "@/lib/tsp/localSearch";

export type AlgorithmKey = "sa" | "ts" | "heuristic";

export type SAForm = {
  seed: number;
  initialTemperature: number;
  coolingRate: number;
  maxIterations: number;
};

export type TSForm = {
  seed: number;
  maxIter: number;
  tabuTenure: number;
  numNeighbors: number;
};

/**
 * Form heuristik klasik. `improvements` adalah RANGKAIAN langkah berurutan yang
 * BOLEH DIULANG (mis. ["2opt","3opt","2opt"]) — engine menjalankannya sesuai
 * urutan. Inilah yang membuat kombinasi pipeline bisa sangat banyak.
 */
export type HeuristicForm = {
  construction: ConstructionKey;
  improvements: ImprovementKey[];
  startNode: number; // hanya dipakai NN
  seed: number; // hanya dipakai AI
};

/** Satu konfigurasi solver lengkap (apa pun algoritmanya). */
export type SolverConfig = {
  algorithm: AlgorithmKey;
  neighborhood: "swap" | "2opt"; // untuk SA/TS
  sa: SAForm;
  ts: TSForm;
  heuristic: HeuristicForm;
};

/** Nilai default = parameter asli dari kode tim (Fase 1). */
export const DEFAULT_SA: SAForm = {
  seed: 42,
  initialTemperature: 10000,
  coolingRate: 0.99,
  maxIterations: 15000,
};

export const DEFAULT_TS: TSForm = {
  seed: 42,
  maxIter: 1000,
  tabuTenure: 15,
  numNeighbors: 50,
};

export const DEFAULT_HEURISTIC: HeuristicForm = {
  construction: "CI",
  improvements: ["2opt", "3opt"],
  startNode: 0,
  seed: 42,
};

export const DEFAULT_CONFIG: SolverConfig = {
  algorithm: "sa",
  neighborhood: "swap",
  sa: { ...DEFAULT_SA },
  ts: { ...DEFAULT_TS },
  heuristic: { ...DEFAULT_HEURISTIC },
};

/** Jalankan sebuah konfigurasi pada titik-titik, hasilkan AlgoResult (+frames). */
export function runConfig(points: Point[], c: SolverConfig): AlgoResult {
  if (c.algorithm === "sa")
    return runSimulatedAnnealing(points, { ...c.sa, neighborhood: c.neighborhood });
  if (c.algorithm === "ts")
    return runTabuSearch(points, { ...c.ts, neighborhood: c.neighborhood });
  return runHeuristic(points, { ...c.heuristic });
}

/** Nama ringkas konfigurasi (untuk badge/judul). */
export function configLabel(c: SolverConfig): string {
  if (c.algorithm === "sa") return `Simulated Annealing · ${c.neighborhood}`;
  if (c.algorithm === "ts") return `Tabu Search · ${c.neighborhood}`;
  return `${CONSTRUCTION_LABELS[c.heuristic.construction]} (${pipelineLabel(
    c.heuristic.construction,
    c.heuristic.improvements
  )})`;
}
