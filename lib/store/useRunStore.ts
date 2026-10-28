// ============================================================================
// State mode SATU solver: menjalankan solver & memutar animasi (record-then-replay).
// Konfigurasi memakai SolverConfig bersama (lib/solver/config.ts).
// ============================================================================

import { create } from "zustand";
import type { AlgoResult } from "@/lib/tsp/types";
import type { City } from "@/lib/types";
import { type SolverConfig, DEFAULT_CONFIG, runConfig } from "@/lib/solver/config";

// Re-export agar impor lama tetap jalan.
export type {
  AlgorithmKey,
  SAForm,
  TSForm,
  HeuristicForm,
  SolverConfig,
} from "@/lib/solver/config";
export {
  DEFAULT_SA,
  DEFAULT_TS,
  DEFAULT_HEURISTIC,
  DEFAULT_CONFIG,
  configLabel,
} from "@/lib/solver/config";

type RunState = {
  config: SolverConfig;

  result: AlgoResult | null;
  /** Algoritma yang menghasilkan `result` (bisa beda dari pilihan saat ini). */
  resultAlgorithm: SolverConfig["algorithm"] | null;
  isRunning: boolean;
  error: string | null;

  // --- playback ---
  frameIndex: number;
  playing: boolean;
  speed: number; // frame per detik

  setConfig: (c: SolverConfig) => void;

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
  config: { ...DEFAULT_CONFIG },

  result: null,
  resultAlgorithm: null,
  isRunning: false,
  error: null,

  frameIndex: 0,
  playing: false,
  speed: 8,

  setConfig: (config) => set({ config }),

  run: (cities) => {
    const { config } = get();
    set({ isRunning: true, error: null });
    try {
      const points = cities.map((c) => ({ x: c.x, y: c.y }));
      const result = runConfig(points, config);
      set({
        result,
        resultAlgorithm: config.algorithm,
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
