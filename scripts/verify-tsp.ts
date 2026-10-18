// ============================================================================
// Skrip verifikasi kebenaran engine TSP (dijalankan via: npx tsx scripts/verify-tsp.ts)
// Fase 1 — sementara menguji fondasi (tourCost & RNG). Test SA/TS ditambahkan
// setelah port dari Lampiran B & C selesai.
// ============================================================================

import type { Point, Tour } from "../lib/tsp/types";
import { tourCost, distance } from "../lib/tsp/distance";
import { makeRng } from "../lib/tsp/rng";
import { runSimulatedAnnealing } from "../lib/tsp/simulatedAnnealing";
import { runTabuSearch } from "../lib/tsp/tabuSearch";
import { runConstruction, type ConstructionKey } from "../lib/tsp/construction";
import { runHeuristic } from "../lib/tsp/heuristic";
import { SAMPLE_25 } from "../lib/samples";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}  ${detail}`);
  }
}

function approx(a: number, b: number, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

// --- Dataset acuan "tsp" (6 kota). Indeks 0-based = kota 1..6 pada soal. ---
// 1(2,33) 2(652,32) 3(99,368) 4(681,195) 5(501,106) 6(188,664)
const points: Point[] = [
  { x: 2, y: 33 }, // kota 1 (idx 0)
  { x: 652, y: 32 }, // kota 2 (idx 1)
  { x: 99, y: 368 }, // kota 3 (idx 2)
  { x: 681, y: 195 }, // kota 4 (idx 3)
  { x: 501, y: 106 }, // kota 5 (idx 4)
  { x: 188, y: 664 }, // kota 6 (idx 5)
];

console.log("== Fase 1: verifikasi fondasi TSP ==\n");

// 1) tourCost pada rute optimal 1-3-6-4-2-5-1 -> [0,2,5,3,1,4] harus ~2176.33
const optimalTour: Tour = [0, 2, 5, 3, 1, 4];
const cost = tourCost(optimalTour, points);
console.log("[1] tourCost rute optimal");
console.log(`    hasil = ${cost.toFixed(2)} (acuan ~2176.33)`);
check("tourCost rute optimal ~= 2176.33", approx(cost, 2176.33, 0.5), `dapat ${cost.toFixed(2)}`);

// 2) closing loop: cost harus simetris terhadap arah putaran (reverse)
const reversed = [...optimalTour].reverse();
check(
  "cost invarian terhadap arah rute (reverse)",
  approx(tourCost(reversed, points), cost),
  `${tourCost(reversed, points).toFixed(2)} vs ${cost.toFixed(2)}`
);

// 3) distance Euclidean dasar
check("distance((0,0),(3,4)) == 5", approx(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5));

// 4) RNG deterministik: seed sama -> urutan sama
const r1 = makeRng(42);
const r2 = makeRng(42);
const seqSame = [0, 1, 2, 3, 4].every(() => approx(r1.next(), r2.next(), 1e-12));
check("RNG seed sama -> urutan identik", seqSame);

// 5) RNG seed beda -> urutan berbeda
const r3 = makeRng(42);
const r4 = makeRng(43);
check("RNG seed beda -> urutan berbeda", r3.next() !== r4.next());

// 6) RNG.int dalam rentang [min,max]
const rr = makeRng(7);
let inRange = true;
for (let i = 0; i < 1000; i++) {
  const v = rr.int(0, 5);
  if (v < 0 || v > 5 || !Number.isInteger(v)) inRange = false;
}
check("RNG.int(0,5) selalu integer dalam [0,5]", inRange);

// ---------------------------------------------------------------------------
// Test algoritma: SA & TS
// ---------------------------------------------------------------------------
const OPTIMAL = 2176.33;
// Rute acak (belum dioptimasi) sebagai pembanding "atas".
const randomTour: Tour = [0, 1, 2, 3, 4, 5];
const randomCost = tourCost(randomTour, points);

console.log("\n[SA] Simulated Annealing");
const sa = runSimulatedAnnealing(points, { seed: 123, maxIterations: 15000 });
console.log(
  `    bestCost = ${sa.bestCost.toFixed(2)} | iter = ${sa.iterations} | frames = ${sa.frames.length} | ${sa.timeMs.toFixed(1)}ms`
);
check("SA bestCost <= cost rute awal", sa.bestCost <= randomCost + 1e-6);
check("SA mendekati optimal (<= 1% dari 2176.33)", sa.bestCost <= OPTIMAL * 1.01, `dapat ${sa.bestCost.toFixed(2)}`);
check("SA jumlah frame <= 300", sa.frames.length <= 300, `dapat ${sa.frames.length}`);
check("SA costHistory full-length (== maxIterations)", sa.costHistory.length === 15000);
check("SA costHistory monoton tidak-naik", sa.costHistory.every((c, k) => k === 0 || c <= sa.costHistory[k - 1] + 1e-9));
check("SA frame punya field suhu", sa.frames.every((f) => typeof f.temperature === "number"));
// Regresi: anggaran frame pernah habis diborong kategori prioritas yang menumpuk
// di awal run, sehingga animasi SA berhenti di ~14% iterasi. Frame terakhir wajib
// menyentuh iterasi terakhir, dan frame pertama wajib iterasi 0.
check("SA frame mulai dari iterasi 0", sa.frames[0].iteration === 0, `dapat ${sa.frames[0].iteration}`);
check(
  "SA animasi mencakup sampai iterasi terakhir",
  sa.frames[sa.frames.length - 1].iteration === sa.iterations - 1,
  `berhenti di ${sa.frames[sa.frames.length - 1].iteration} dari ${sa.iterations - 1}`
);
check(
  "SA nomor iterasi frame menaik & unik",
  sa.frames.every((f, k) => k === 0 || f.iteration > sa.frames[k - 1].iteration)
);

console.log("\n[SA] Reproducibility (seed sama)");
const saA = runSimulatedAnnealing(points, { seed: 999, maxIterations: 5000 });
const saB = runSimulatedAnnealing(points, { seed: 999, maxIterations: 5000 });
check("SA seed sama -> bestCost identik", saA.bestCost === saB.bestCost, `${saA.bestCost} vs ${saB.bestCost}`);
check("SA seed sama -> bestTour identik", JSON.stringify(saA.bestTour) === JSON.stringify(saB.bestTour));

console.log("\n[TS] Tabu Search");
const ts = runTabuSearch(points, { seed: 123, maxIter: 1000 });
console.log(
  `    bestCost = ${ts.bestCost.toFixed(2)} | iter = ${ts.iterations} | frames = ${ts.frames.length} | ${ts.timeMs.toFixed(1)}ms`
);
check("TS bestCost <= cost rute awal", ts.bestCost <= randomCost + 1e-6);
check("TS mendekati optimal (<= 1% dari 2176.33)", ts.bestCost <= OPTIMAL * 1.01, `dapat ${ts.bestCost.toFixed(2)}`);
check("TS jumlah frame <= 300", ts.frames.length <= 300, `dapat ${ts.frames.length}`);
check("TS costHistory full-length (== maxIter)", ts.costHistory.length === 1000);
check("TS costHistory monoton tidak-naik", ts.costHistory.every((c, k) => k === 0 || c <= ts.costHistory[k - 1] + 1e-9));
check("TS frame punya snapshot tabuList", ts.frames.every((f) => Array.isArray(f.tabuList)));
check(
  "TS animasi mencakup sampai iterasi terakhir",
  ts.frames[ts.frames.length - 1].iteration === ts.iterations - 1,
  `berhenti di ${ts.frames[ts.frames.length - 1].iteration} dari ${ts.iterations - 1}`
);
check(
  "TS nomor iterasi frame menaik & unik",
  ts.frames.every((f, k) => k === 0 || f.iteration > ts.frames[k - 1].iteration)
);

console.log("\n[TS] Reproducibility (seed sama)");
const tsA = runTabuSearch(points, { seed: 999, maxIter: 500 });
const tsB = runTabuSearch(points, { seed: 999, maxIter: 500 });
check("TS seed sama -> bestCost identik", tsA.bestCost === tsB.bestCost, `${tsA.bestCost} vs ${tsB.bestCost}`);
check("TS seed sama -> bestTour identik", JSON.stringify(tsA.bestTour) === JSON.stringify(tsB.bestTour));

// ---------------------------------------------------------------------------
// Heuristik klasik (konstruksi + perbaikan) — dataset 25 kota Case I.
// ---------------------------------------------------------------------------
const hpts: Point[] = SAMPLE_25.map((c) => ({ x: c.x, y: c.y }));
const isPermutation = (t: Tour, n: number) =>
  t.length === n && new Set(t).size === n && t.every((v) => v >= 0 && v < n);

console.log("\n[H] Heuristik konstruksi — rute valid & jejak langkah");
for (const k of ["NN", "NI", "CI", "FI", "AI", "GI"] as ConstructionKey[]) {
  const r = runConstruction(k, hpts, { startNode: 0, rng: makeRng(42) });
  check(`${k}: rute permutasi lengkap`, isPermutation(r.tour, hpts.length));
  check(`${k}: jumlah langkah == jumlah kota`, r.steps.length === hpts.length);
  check(`${k}: langkah terakhir == rute akhir`, isPermutation(r.steps[r.steps.length - 1].tour, hpts.length));
}

console.log("\n[H] Pipeline gabungan — frame beranimasi & rute akhir");
const hp = runHeuristic(hpts, { construction: "CI", improvements: ["2opt", "3opt"], seed: 42 });
console.log(`    ${hp.label} -> ${hp.bestCost.toFixed(2)} | frames = ${hp.frames.length}`);
check("pipeline: rute akhir permutasi lengkap", isPermutation(hp.bestTour, hpts.length));
check("pipeline: frame <= 300", hp.frames.length <= 300, `dapat ${hp.frames.length}`);
check("pipeline: ada fase konstruksi", hp.frames.some((f) => f.phase === "construction"));
check("pipeline: ada fase perbaikan (2opt/3opt)", hp.frames.some((f) => f.phase === "2opt" || f.phase === "3opt"));
check(
  "pipeline: nomor iterasi frame menaik & unik",
  hp.frames.every((f, k) => k === 0 || f.iteration > hp.frames[k - 1].iteration)
);
check(
  "pipeline: frame terakhir == rute akhir (biaya sama)",
  Math.abs(hp.frames[hp.frames.length - 1].bestCost - hp.bestCost) < 1e-9
);
const ciOnlyCost = tourCost(runConstruction("CI", hpts, {}).tour, hpts);
check(
  "pipeline: perbaikan tidak memperburuk konstruksi",
  hp.bestCost <= ciOnlyCost + 1e-6,
  `pipeline ${hp.bestCost.toFixed(2)} vs CI ${ciOnlyCost.toFixed(2)}`
);

console.log("\n[H] Reproducibility Arbitrary Insertion (seed sama)");
const ha = runHeuristic(hpts, { construction: "AI", improvements: ["2opt"], seed: 7 });
const hb = runHeuristic(hpts, { construction: "AI", improvements: ["2opt"], seed: 7 });
check("AI seed sama -> rute akhir identik", JSON.stringify(ha.bestTour) === JSON.stringify(hb.bestTour));

console.log(`\n== Ringkasan: ${passed} lulus, ${failed} gagal ==`);
process.exit(failed > 0 ? 1 : 0);
