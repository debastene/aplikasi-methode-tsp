// ============================================================================
// Heuristik KONSTRUKSI untuk TSP — membangun rute dari nol.
// Port dari kode tim (algorithms/NN.py, NI.py, CI.py, FI.py, AI.py), ditambah
// RNG berseed (untuk AI) dan perekaman langkah agar bisa dianimasikan: tiap kali
// sebuah kota disambung/diselipkan, satu Frame dicatat dengan kota itu disorot.
//
// Semua fungsi mengembalikan "trace" — daftar langkah pertumbuhan rute — supaya
// pipeline di heuristic.ts bisa menggabungnya dengan tahap perbaikan menjadi
// satu aliran animasi yang mulus.
// ============================================================================

import type { Point, Tour } from "./types";
import { distance, tourCost } from "./distance";
import type { RNG } from "./rng";
import { shuffledRange } from "./rng";

export type ConstructionKey = "NN" | "NI" | "CI" | "FI" | "AI";

/** Satu langkah konstruksi: keadaan rute setelah sebuah kota ditambahkan. */
export interface BuildStep {
  tour: Tour; // rute parsial sejauh ini
  added: number; // indeks kota yang baru ditambahkan pada langkah ini
  note: string; // keterangan singkat (mode edukasi)
}

/** Hasil sebuah heuristik konstruksi: rute akhir + jejak langkah pembangunnya. */
export interface BuildResult {
  tour: Tour;
  steps: BuildStep[];
}

export const CONSTRUCTION_LABELS: Record<ConstructionKey, string> = {
  NN: "Nearest Neighbor",
  NI: "Nearest Insertion",
  CI: "Cheapest Insertion",
  FI: "Farthest Insertion",
  AI: "Arbitrary Insertion",
};

/** Biaya menyisipkan kota c di antara dua kota a-b (selisih panjang). */
function insertionCost(a: number, b: number, c: number, points: Point[]): number {
  return (
    distance(points[a], points[c]) +
    distance(points[c], points[b]) -
    distance(points[a], points[b])
  );
}

/** Cari posisi penyisipan termurah untuk kota `city` pada `tour`. */
function cheapestPosition(
  tour: Tour,
  city: number,
  points: Point[]
): { pos: number; cost: number } {
  let bestPos = 1;
  let bestCost = Infinity;
  for (let i = 0; i < tour.length; i++) {
    const a = tour[i];
    const b = tour[(i + 1) % tour.length];
    const inc = insertionCost(a, b, city, points);
    if (inc < bestCost) {
      bestCost = inc;
      bestPos = i + 1;
    }
  }
  return { pos: bestPos, cost: bestCost };
}

// ---------------------------------------------------------------------------
// 1. Nearest Neighbor (NN) — dari kota awal, selalu lompat ke kota terdekat
//    yang belum dikunjungi.
// ---------------------------------------------------------------------------
function nearestNeighbor(points: Point[], startNode: number): BuildResult {
  const n = points.length;
  const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i));
  let current = startNode;
  const tour: Tour = [current];
  unvisited.delete(current);
  const steps: BuildStep[] = [{ tour: [current], added: current, note: "Kota awal" }];

  while (unvisited.size > 0) {
    let next = -1;
    let best = Infinity;
    for (const city of unvisited) {
      const d = distance(points[current], points[city]);
      if (d < best) {
        best = d;
        next = city;
      }
    }
    tour.push(next);
    unvisited.delete(next);
    current = next;
    steps.push({
      tour: tour.slice(),
      added: next,
      note: `Lompat ke kota terdekat (jarak ${best.toFixed(2)})`,
    });
  }
  return { tour, steps };
}

/** Dua kota terdekat di seluruh himpunan — titik awal untuk Nearest Insertion. */
function closestPair(points: Point[]): [number, number] {
  const n = points.length;
  let a = 0;
  let b = 1;
  let dMin = Infinity;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distance(points[i], points[j]);
      if (d < dMin) {
        dMin = d;
        a = i;
        b = j;
      }
    }
  }
  return [a, b];
}

// ---------------------------------------------------------------------------
// 2. Nearest Insertion (NI) — ulangi: pilih kota (di luar tur) yang PALING
//    DEKAT ke salah satu kota di tur, lalu sisipkan di posisi termurah.
// ---------------------------------------------------------------------------
function nearestInsertion(points: Point[]): BuildResult {
  const n = points.length;
  const [c1, c2] = closestPair(points);
  const tour: Tour = [c1, c2];
  const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i));
  unvisited.delete(c1);
  unvisited.delete(c2);
  const steps: BuildStep[] = [
    { tour: [c1], added: c1, note: "Pasangan kota terdekat" },
    { tour: [c1, c2], added: c2, note: "Pasangan kota terdekat" },
  ];

  while (unvisited.size > 0) {
    let pick = -1;
    let dMin = Infinity;
    for (const city of unvisited) {
      for (const t of tour) {
        const d = distance(points[city], points[t]);
        if (d < dMin) {
          dMin = d;
          pick = city;
        }
      }
    }
    const { pos } = cheapestPosition(tour, pick, points);
    tour.splice(pos, 0, pick);
    unvisited.delete(pick);
    steps.push({
      tour: tour.slice(),
      added: pick,
      note: `Kota terdekat ke tur (jarak ${dMin.toFixed(2)}), sisip termurah`,
    });
  }
  return { tour, steps };
}

// ---------------------------------------------------------------------------
// 3. Cheapest Insertion (CI) — ulangi: pilih kota + posisi yang MENAMBAH
//    panjang tur PALING SEDIKIT.
// ---------------------------------------------------------------------------
function cheapestInsertion(points: Point[]): BuildResult {
  const n = points.length;
  const tour: Tour = [0, 1];
  const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i));
  unvisited.delete(0);
  unvisited.delete(1);
  const steps: BuildStep[] = [
    { tour: [0], added: 0, note: "Dua kota awal" },
    { tour: [0, 1], added: 1, note: "Dua kota awal" },
  ];

  while (unvisited.size > 0) {
    let pick = -1;
    let pickPos = 1;
    let best = Infinity;
    for (const city of unvisited) {
      const { pos, cost } = cheapestPosition(tour, city, points);
      if (cost < best) {
        best = cost;
        pick = city;
        pickPos = pos;
      }
    }
    tour.splice(pickPos, 0, pick);
    unvisited.delete(pick);
    steps.push({
      tour: tour.slice(),
      added: pick,
      note: `Penambahan termurah (+${best.toFixed(2)})`,
    });
  }
  return { tour, steps };
}

// ---------------------------------------------------------------------------
// 4. Farthest Insertion (FI) — ulangi: pilih kota yang jarak-minimumnya ke tur
//    PALING JAUH (agar kerangka besar terbentuk dulu), sisip di posisi termurah.
// ---------------------------------------------------------------------------
function farthestInsertion(points: Point[]): BuildResult {
  const n = points.length;
  const c1 = 0;
  let c2 = 0;
  let dFar = -1;
  for (let i = 0; i < n; i++) {
    const d = distance(points[c1], points[i]);
    if (d > dFar) {
      dFar = d;
      c2 = i;
    }
  }
  const tour: Tour = [c1, c2];
  const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i));
  unvisited.delete(c1);
  unvisited.delete(c2);
  const steps: BuildStep[] = [
    { tour: [c1], added: c1, note: "Kota awal" },
    { tour: [c1, c2], added: c2, note: "Kota terjauh dari kota awal" },
  ];

  while (unvisited.size > 0) {
    let pick = -1;
    let maxMin = -1;
    for (const city of unvisited) {
      let minToTour = Infinity;
      for (const t of tour) {
        const d = distance(points[city], points[t]);
        if (d < minToTour) minToTour = d;
      }
      if (minToTour > maxMin) {
        maxMin = minToTour;
        pick = city;
      }
    }
    const { pos } = cheapestPosition(tour, pick, points);
    tour.splice(pos, 0, pick);
    unvisited.delete(pick);
    steps.push({
      tour: tour.slice(),
      added: pick,
      note: `Kota terjauh dari tur (jarak ${maxMin.toFixed(2)}), sisip termurah`,
    });
  }
  return { tour, steps };
}

// ---------------------------------------------------------------------------
// 5. Arbitrary Insertion (AI) — ambil kota dalam urutan ACAK (berseed), tiap
//    kota disisipkan di posisi termurah.
// ---------------------------------------------------------------------------
function arbitraryInsertion(points: Point[], rng: RNG): BuildResult {
  const n = points.length;
  const tour: Tour = [0, 1];
  const steps: BuildStep[] = [
    { tour: [0], added: 0, note: "Dua kota awal" },
    { tour: [0, 1], added: 1, note: "Dua kota awal" },
  ];
  // Urutan acak kota 2..n-1 memakai permutasi berseed, lalu buang 0 & 1.
  const order = shuffledRange(rng, n).filter((c) => c !== 0 && c !== 1);

  for (const city of order) {
    const { pos, cost } = cheapestPosition(tour, city, points);
    tour.splice(pos, 0, city);
    steps.push({
      tour: tour.slice(),
      added: city,
      note: `Kota acak, sisip termurah (+${cost.toFixed(2)})`,
    });
  }
  return { tour, steps };
}

/**
 * Jalankan sebuah heuristik konstruksi sesuai kuncinya.
 * @param startNode hanya dipakai NN (kota awal).
 * @param rng       hanya dipakai AI (urutan acak berseed).
 */
export function runConstruction(
  key: ConstructionKey,
  points: Point[],
  opts: { startNode?: number; rng?: RNG }
): BuildResult {
  const n = points.length;
  if (n < 3) throw new Error("Konstruksi butuh minimal 3 kota.");
  switch (key) {
    case "NN":
      return nearestNeighbor(points, Math.max(0, Math.min(n - 1, opts.startNode ?? 0)));
    case "NI":
      return nearestInsertion(points);
    case "CI":
      return cheapestInsertion(points);
    case "FI":
      return farthestInsertion(points);
    case "AI":
      if (!opts.rng) throw new Error("Arbitrary Insertion butuh RNG berseed.");
      return arbitraryInsertion(points, opts.rng);
  }
}

/** Util kecil agar pemanggil bisa cepat tahu panjang rute hasil konstruksi. */
export function buildCost(result: BuildResult, points: Point[]): number {
  return tourCost(result.tour, points);
}
