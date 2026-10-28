// ============================================================================
// State mode BANDINGKAN DUA: dua konfigurasi solver (A & B) dijalankan pada
// dataset yang sama, lalu hasilnya diputar BERSAMAAN (satu kontrol playback).
// Memakai SolverConfig & runConfig bersama (lib/solver/config.ts).
// ============================================================================

import { create } from "zustand";
import type { AlgoResult } from "@/lib/tsp/types";
import type { City } from "@/lib/types";
import {
  type SolverConfig,
  type AlgorithmKey,
  DEFAULT_CONFIG,
  runConfig,
} from "@/lib/solver/config";

/** Dua default yang sengaja berbeda supaya perbandingan langsung bermakna. */
const DEFAULT_A: SolverConfig = { ...DEFAULT_CONFIG, algorithm: "ts", neighborhood: "2opt" };
const DEFAULT_B: SolverConfig = { ...DEFAULT_CONFIG, algorithm: "heuristic" };

type Side = { result: AlgoResult | null; algorithm: AlgorithmKey | null };

type CompareState = {
  a: SolverConfig;
  b: SolverConfig;
  sideA: Side;
  sideB: Side;
  isRunning: boolean;
  error: string | null;

  frameIndex: number; // 0..maxFrames-1 (dipakai bersama kedua sisi)
  playing: boolean;
  speed: number;

  setA: (c: SolverConfig) => void;
  setB: (c: SolverConfig) => void;
  run: (cities: City[]) => void;
  clear: () => void;

  maxFrames: () => number;
  setFrameIndex: (i: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  resetPlayback: () => void;
  setSpeed: (s: number) => void;
};

export const useCompareStore = create<CompareState>((set, get) => ({
  a: { ...DEFAULT_A },
  b: { ...DEFAULT_B },
  sideA: { result: null, algorithm: null },
  sideB: { result: null, algorithm: null },
  isRunning: false,
  error: null,

  frameIndex: 0,
  playing: false,
  speed: 8,

  setA: (a) => set({ a }),
  setB: (b) => set({ b }),

  run: (cities) => {
    const { a, b } = get();
    set({ isRunning: true, error: null });
    try {
      const points = cities.map((c) => ({ x: c.x, y: c.y }));
      const resultA = runConfig(points, a);
      const resultB = runConfig(points, b);
      const maxLen = Math.max(resultA.frames.length, resultB.frames.length);
      set({
        sideA: { result: resultA, algorithm: a.algorithm },
        sideB: { result: resultB, algorithm: b.algorithm },
        isRunning: false,
        frameIndex: 0,
        playing: maxLen > 1,
      });
    } catch (err) {
      console.error(err);
      set({
        isRunning: false,
        error: err instanceof Error ? err.message : "Gagal menjalankan perbandingan.",
      });
    }
  },

  clear: () =>
    set({
      sideA: { result: null, algorithm: null },
      sideB: { result: null, algorithm: null },
      frameIndex: 0,
      playing: false,
    }),

  maxFrames: () => {
    const { sideA, sideB } = get();
    return Math.max(sideA.result?.frames.length ?? 0, sideB.result?.frames.length ?? 0);
  },

  setFrameIndex: (i) => {
    const max = get().maxFrames();
    set({ frameIndex: Math.max(0, Math.min(i, Math.max(0, max - 1))) });
  },

  play: () => {
    const max = get().maxFrames();
    if (max < 2) return;
    if (get().frameIndex >= max - 1) set({ frameIndex: 0 });
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
