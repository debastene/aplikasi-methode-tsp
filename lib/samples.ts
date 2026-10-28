// ============================================================================
// Dataset contoh bawaan untuk tombol "Muat contoh data".
// Koordinat disimpan polos (x, y); label "Kota n" dibuat otomatis.
// ============================================================================

import type { City } from "./types";
import { makeRng } from "./tsp/rng";

/** Beri label otomatis "Kota 1", "Kota 2", ... pada daftar koordinat. */
const withAutoLabels = (points: { x: number; y: number }[]): City[] =>
  points.map((p, i) => ({ label: `Kota ${i + 1}`, x: p.x, y: p.y }));

/**
 * (a) Dataset uji 6 kota (sama dengan test kebenaran Fase 1).
 * Rute optimal Euclidean = 2176.33. Bagus untuk demo cepat.
 */
export const SAMPLE_6: City[] = withAutoLabels([
  { x: 2, y: 33 },
  { x: 652, y: 32 },
  { x: 99, y: 368 },
  { x: 681, y: 195 },
  { x: 501, y: 106 },
  { x: 188, y: 664 },
]);

/**
 * (b) Dataset 25 kota — Case I dari paper referensi (Silalahi dkk., 2022).
 * Untuk demo yang lebih ramai.
 */
export const SAMPLE_25: City[] = withAutoLabels([
  { x: 53.49, y: 94.14 },
  { x: 28.84, y: 75.95 },
  { x: 44.31, y: 28.58 },
  { x: 16.33, y: 71.57 },
  { x: 50.71, y: 48.65 },
  { x: 54.12, y: 98.45 },
  { x: 24.28, y: 75.06 },
  { x: 35.78, y: 25.31 },
  { x: 50.05, y: 60.28 },
  { x: 85.48, y: 11.12 },
  { x: 9.08, y: 58.11 },
  { x: 95.46, y: 22.88 },
  { x: 83.47, y: 39.44 },
  { x: 91.37, y: 73.04 },
  { x: 60.42, y: 98.67 },
  { x: 51.56, y: 41.53 },
  { x: 55.73, y: 21.64 },
  { x: 55.61, y: 17.59 },
  { x: 29.98, y: 49.08 },
  { x: 33.67, y: 7.2 },
  { x: 68.61, y: 92.34 },
  { x: 60.96, y: 88.75 },
  { x: 66.74, y: 43.31 },
  { x: 4.14, y: 75.21 },
  { x: 11.23, y: 77.58 },
]);

/**
 * (c) Dataset 100 kota — dibangkitkan acak dengan SEED TETAP (mulberry32),
 * jadi selalu sama setiap kali dimuat (reproducible). Koordinat tersebar pada
 * bidang 0..100. Untuk menguji algoritma pada skala lebih besar.
 *
 * Catatan performa: animasi tetap jalan (batas 200 kota), tetapi 3-opt pada
 * 100 kota berat (O(n^3)/sapuan) — di aplikasi dibatasi anggaran waktu, jadi
 * bisa berhenti sebelum konvergen penuh. NN/insertion/2-opt tetap ringan.
 */
export const SAMPLE_100: City[] = (() => {
  const rng = makeRng(20260101);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 100; i++) {
    pts.push({
      x: Math.round(rng.next() * 1000) / 10, // 0..100, 1 desimal
      y: Math.round(rng.next() * 1000) / 10,
    });
  }
  return withAutoLabels(pts);
})();

export const SAMPLES = {
  small: { name: "6 kota (demo cepat)", cities: SAMPLE_6 },
  medium: { name: "25 kota — Case I (lebih ramai)", cities: SAMPLE_25 },
  large: { name: "100 kota (acak, skala besar)", cities: SAMPLE_100 },
} as const;

export type SampleKey = keyof typeof SAMPLES;
