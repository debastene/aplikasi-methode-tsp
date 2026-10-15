// ============================================================================
// Tipe data inti untuk engine TSP (Travelling Salesman Problem)
// Dipakai bersama oleh Simulated Annealing (SA) & Tabu Search (TS).
// ============================================================================

/** Satu titik/kota pada bidang 2D. */
export type Point = { x: number; y: number };

/** Rute = urutan indeks kota, mis. [3,1,2,0] artinya kota 3 -> 1 -> 2 -> 0 -> (kembali ke 3). */
export type Tour = number[];

/** Parameter umum yang berlaku untuk semua algoritma. */
export interface AlgoParams {
  /** Seed untuk reproducibility (WAJIB didukung): seed sama -> hasil sama persis. */
  seed?: number;
  /** Jenis gerakan tetangga. Default 'swap' (sesuai kode tim). */
  neighborhood?: "swap" | "2opt";
}

/**
 * Satu "frame" = satu potret keadaan pada satu iterasi, untuk kebutuhan animasi
 * (record-then-replay). UI cukup memutar ulang array frame ini.
 */
export interface Frame {
  iteration: number;
  currentTour: Tour; // rute yang sedang dievaluasi/diterima
  currentCost: number;
  bestTour: Tour; // rute terbaik sejauh ini
  bestCost: number;
  accepted: boolean; // apakah langkah ini diterima

  // --- Khusus Simulated Annealing ---
  temperature?: number;
  acceptProbability?: number; // p = e^(-Δ/T) saat langkah lebih buruk
  deltaCost?: number;

  // --- Khusus Tabu Search ---
  move?: [number, number]; // pasangan yang di-swap / (i,j) untuk 2-opt
  isTabuMove?: boolean; // langkah terpilih berstatus tabu?
  aspiration?: boolean; // tabu tapi lolos aspiration criterion?
  tabuList?: { move: [number, number]; expiresAt: number }[]; // snapshot tabu list

  // --- Khusus Heuristik klasik (konstruksi + perbaikan) ---
  /** Tahap pipeline yang menghasilkan frame ini. */
  phase?: "construction" | "2opt" | "3opt";
  /** Kota yang baru disambung/diselipkan pada tahap konstruksi (untuk disorot). */
  focusNode?: number;
  /** Sisi (edge) kota a-b yang berubah pada tahap perbaikan (untuk disorot). */
  focusEdges?: [number, number][];
  /** Keterangan singkat "apa yang terjadi" di langkah ini (mode edukasi). */
  note?: string;
}

/** Hasil akhir eksekusi sebuah algoritma. */
export interface AlgoResult {
  bestTour: Tour;
  bestCost: number;
  iterations: number;
  timeMs: number;
  frames: Frame[]; // frame yang sudah disampling untuk animasi
  /** Riwayat bestCost per iterasi (full-length, ringan) untuk grafik konvergensi. */
  costHistory: number[];
  /** Nama pipeline, mis. "CI + 2-opt + 3-opt" (dipakai heuristik klasik). Opsional. */
  label?: string;
}
