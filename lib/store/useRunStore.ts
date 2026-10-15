// ============================================================================
// State global untuk menjalankan solver & memutar animasi (record-then-replay).
// Algoritma dijalankan sekali -> menghasilkan frames -> UI tinggal memutar ulang.
// ============================================================================

import { create } from "zustand";
import type { AlgoResult, Point } from "@/lib/tsp/types";
import { runSimulatedAnnealing } from "@/lib/tsp/simulatedAnnealing";
import { runTabuSearch } from "@/lib/tsp/tabuSearch";
import { runHeuristic } from "@/lib/tsp/heuristic";
import type { ConstructionKey } from "@/lib/tsp/construction";
import type { ImprovementKey } from "@/lib/tsp/localSearch";
import type { City } from "@/lib/types";

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

/** Form heuristik klasik: pilih 1 konstruksi + rangkaian perbaikan opsional. */
export type HeuristicForm = {
  construction: ConstructionKey;
  improvements: ImprovementKey[]; // subset terurut dari ["2opt","3opt"]
  startNode: number; // hanya dipakai NN
  seed: number; // hanya dipakai AI
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

type RunState = {
  algorithm: AlgorithmKey;
  neighborhood: "swap" | "2opt";
  sa: SAForm;
  ts: TSForm;
  heuristic: HeuristicForm;

  result: AlgoResult | null;
  /** Algoritma yang menghasilkan `result` (bisa beda dari pilihan saat ini). */
  resultAlgorithm: AlgorithmKey | null;
  isRunning: boolean;
  error: string | null;

  // --- playback ---
  frameIndex: number;
  playing: boolean;
  speed: number; // frame per detik

  setAlgorithm: (a: AlgorithmKey) => void;
  setNeighborhood: (n: "swap" | "2opt") => void;
  setSa: (patch: Partial<SAForm>) => void;
  setTs: (patch: Partial<TSForm>) => void;
  setHeuristic: (patch: Partial<HeuristicForm>) => void;

  run: (cities: City[]) => void;
  clearResult: () => void;

  setFrameIndex: (i: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  resetPlayback: () => void;
  setSpeed: (s: number) => void;
};

export const useRunStore = create<RunState>((set, get) => ({
  algorithm: "sa",
  neighborhood: "swap",
  sa: { ...DEFAULT_SA },
  ts: { ...DEFAULT_TS },
  heuristic: { ...DEFAULT_HEURISTIC },

  result: null,
  resultAlgorithm: null,
  isRunning: false,
  error: null,

  frameIndex: 0,
  playing: false,
  speed: 8,

  setAlgorithm: (algorithm) => set({ algorithm }),
  setNeighborhood: (neighborhood) => set({ neighborhood }),
  setSa: (patch) => set((s) => ({ sa: { ...s.sa, ...patch } })),
  setTs: (patch) => set((s) => ({ ts: { ...s.ts, ...patch } })),
  setHeuristic: (patch) => set((s) => ({ heuristic: { ...s.heuristic, ...patch } })),

  run: (cities) => {
    const { algorithm, neighborhood, sa, ts, heuristic } = get();
    set({ isRunning: true, error: null });
    try {
      const points: Point[] = cities.map((c) => ({ x: c.x, y: c.y }));
      const result =
        algorithm === "sa"
          ? runSimulatedAnnealing(points, { ...sa, neighborhood })
          : algorithm === "ts"
            ? runTabuSearch(points, { ...ts, neighborhood })
            : runHeuristic(points, { ...heuristic });

      set({
        result,
        resultAlgorithm: algorithm,
        isRunning: false,
        frameIndex: 0,
        // Langsung putar animasinya — ini nilai jual utama aplikasi.
        playing: result.frames.length > 1,
      });
    } catch (err) {
      console.error(err);
      set({
        isRunning: false,
        error: err instanceof Error ? err.message : "Gagal menjalankan algoritma.",
      });
    }
  },

  clearResult: () =>
    set({ result: null, resultAlgorithm: null, frameIndex: 0, playing: false }),

  setFrameIndex: (i) => {
    const frames = get().result?.frames.length ?? 0;
    const clamped = Math.max(0, Math.min(i, Math.max(0, frames - 1)));
    set({ frameIndex: clamped });
  },

  play: () => {
    const { result, frameIndex } = get();
    if (!result || result.frames.length < 2) return;
    // Jika sudah di ujung, mulai lagi dari awal.
    if (frameIndex >= result.frames.length - 1) set({ frameIndex: 0 });
    set({ playing: true });
  },
  pause: () => set({ playing: false }),
  togglePlay: () => (get().playing ? get().pause() : get().play()),

  stepForward: () => {
    set({ playing: false });
    get().setFrameIndex(get().frameIndex + 1);
  },
  stepBack: () => {
    set({ playing: false });
    get().setFrameIndex(get().frameIndex - 1);
  },
  resetPlayback: () => set({ frameIndex: 0, playing: false }),
  setSpeed: (speed) => set({ speed }),
}));
