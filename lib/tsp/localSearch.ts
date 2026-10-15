// ============================================================================
// Heuristik PERBAIKAN (local search) untuk TSP — merapikan rute yang SUDAH ada.
// Port dari kode tim (algorithms/2-opt.py, 3-opt.py). Keduanya butuh rute awal,
// jadi dipakai setelah tahap konstruksi (lihat heuristic.ts).
//
// Implementasi di sini versi baku yang bersih (bukan salinan byte-per-byte dari
// Python): first-improvement dengan restart, berhenti saat tak ada perbaikan.
// Ada anggaran waktu (timeBudgetMs) agar tidak membekukan browser pada dataset
// besar — 3-opt berkompleksitas O(n^3) per sapuan. Tiap perbaikan yang diterima
// dicatat sebagai satu langkah beserta sisi (edge) yang berubah, untuk animasi.
// ============================================================================

import type { Point, Tour } from "./types";
import { distance, tourCost } from "./distance";

export type ImprovementKey = "2opt" | "3opt";

export interface ImproveStep {
  tour: Tour; // rute setelah perbaikan ini diterima
  edges: [number, number][]; // sisi kota a-b yang menjadi sorotan langkah ini
  note: string;
}

export interface ImproveResult {
  tour: Tour;
  steps: ImproveStep[];
}

export const IMPROVEMENT_LABELS: Record<ImprovementKey, string> = {
  "2opt": "2-opt",
  "3opt": "3-opt",
};

const EPS = 1e-9;

// ---------------------------------------------------------------------------
// 2-opt — hapus dua sisi lalu sambung ulang dengan membalik segmen di antaranya
// ("mengurai" rute yang saling bersilangan).
// ---------------------------------------------------------------------------
export function run2opt(
  start: Tour,
  points: Point[],
  opts: { timeBudgetMs?: number } = {}
): ImproveResult {
  const timeBudgetMs = opts.timeBudgetMs ?? 2000;
  const t0 = performance.now();
  const n = start.length;
  const tour = start.slice();
  const steps: ImproveStep[] = [];

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      const a = tour[i];
      const b = tour[i + 1];
      for (let j = i + 2; j < n; j++) {
        // Hindari pasangan yang berbagi sisi penutup (i=0 & j=n-1).
        if (i === 0 && j === n - 1) continue;
        const c = tour[j];
        const d = tour[(j + 1) % n];
        // Sisi lama (a-b)+(c-d) vs sisi baru (a-c)+(b-d).
        const delta =
          distance(points[a], points[c]) +
          distance(points[b], points[d]) -
          distance(points[a], points[b]) -
          distance(points[c], points[d]);
        if (delta < -EPS) {
          // Balik segmen i+1..j.
          let lo = i + 1;
          let hi = j;
          while (lo < hi) {
            const tmp = tour[lo];
            tour[lo] = tour[hi];
            tour[hi] = tmp;
            lo++;
            hi--;
          }
          steps.push({
            tour: tour.slice(),
            edges: [
              [a, c],
              [b, d],
            ],
            note: `2-opt: urai silang, rute −${Math.abs(delta).toFixed(2)}`,
          });
          improved = true;
          break;
        }
      }
      if (improved) break;
      if (performance.now() - t0 > timeBudgetMs) return { tour, steps };
    }
    if (performance.now() - t0 > timeBudgetMs) break;
  }
  return { tour, steps };
}

// ---------------------------------------------------------------------------
// 3-opt — potong rute di tiga tempat, coba beberapa cara menyambung ulang,
// ambil yang paling memendekkan. Lebih kuat dari 2-opt, tapi lebih berat.
// ---------------------------------------------------------------------------
export function run3opt(
  start: Tour,
  points: Point[],
  opts: { timeBudgetMs?: number } = {}
): ImproveResult {
  const timeBudgetMs = opts.timeBudgetMs ?? 3000;
  const t0 = performance.now();
  const n = start.length;
  let tour = start.slice();
  const steps: ImproveStep[] = [];
  const cost = (t: Tour) => tourCost(t, points);

  let improved = true;
  while (improved) {
    improved = false;
    const baseCost = cost(tour);
    for (let i = 0; i < n - 2; i++) {
      for (let j = i + 1; j < n - 1; j++) {
        for (let k = j + 1; k < n; k++) {
          const s1 = tour.slice(0, i + 1);
          const s2 = tour.slice(i + 1, j + 1);
          const s3 = tour.slice(j + 1, k + 1);
          const s4 = tour.slice(k + 1);
          const r = (seg: Tour) => seg.slice().reverse();
          // Enam rekombinasi (mengikuti varian pada kode tim).
          const variations: Tour[] = [
            [...s1, ...r(s2), ...s3, ...s4],
            [...s1, ...s2, ...r(s3), ...s4],
            [...s1, ...r(s2), ...r(s3), ...s4],
            [...s1, ...s3, ...s2, ...s4],
            [...s1, ...s3, ...r(s2), ...s4],
            [...s1, ...r(s3), ...s2, ...s4],
          ];
          let bestVar: Tour | null = null;
          let bestVarCost = baseCost - EPS;
          for (const v of variations) {
            const cv = cost(v);
            if (cv < bestVarCost) {
              bestVarCost = cv;
              bestVar = v;
            }
          }
          if (bestVar) {
            const cutA = tour[i];
            const cutB = tour[j];
            const cutC = tour[k];
            tour = bestVar;
            steps.push({
              tour: tour.slice(),
              edges: [
                [cutA, tour[(i + 1) % n]],
                [cutB, tour[(j + 1) % n]],
                [cutC, tour[(k + 1) % n]],
              ],
              note: `3-opt: sambung ulang, rute −${Math.abs(baseCost - bestVarCost).toFixed(2)}`,
            });
            improved = true;
            break;
          }
        }
        if (improved) break;
        if (performance.now() - t0 > timeBudgetMs) return { tour, steps };
      }
      if (improved) break;
    }
    if (performance.now() - t0 > timeBudgetMs) break;
  }
  return { tour, steps };
}

export function runImprovement(
  key: ImprovementKey,
  start: Tour,
  points: Point[],
  opts: { timeBudgetMs?: number } = {}
): ImproveResult {
  return key === "2opt" ? run2opt(start, points, opts) : run3opt(start, points, opts);
}
