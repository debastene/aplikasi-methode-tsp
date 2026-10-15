# ============================================================================
# GABUNGAN HEURISTIK — konstruksi lalu perbaikan (construction + local search)
# ============================================================================
#
# Latar belakang
# --------------
# Tujuh algoritma di folder ini terbagi dua jenis yang BERBEDA tugas:
#
#   KONSTRUKSI  (membangun rute dari nol, input = daftar kota):
#       NN.py  nearest_neighbor_tsp
#       NI.py  nearest_insertion_tsp
#       CI.py  cheapest_insertion_tsp
#       FI.py  farthest_insertion_tsp
#       AI.py  arbitrary_insertion_tsp
#
#   PERBAIKAN / local search  (merapikan rute yang SUDAH ada, input = rute):
#       2-opt.py  opt_2(tour, cities)
#       3-opt.py  opt_3(tour, cities)
#
# 2-opt dan 3-opt TIDAK bisa jalan dari nol — mereka butuh rute awal. Karena itu
# "menggabung" bukan sekadar bisa, tapi memang cara pakai yang benar: rute dari
# salah satu metode konstruksi diumpankan ke 2-opt lalu 3-opt. Itulah yang ada
# di baris-baris "gabungan" pada tabel acuan.
#
# Berkas ini TIDAK menyalin ulang logika algoritma. Ia memuat fungsi asli dari
# ketujuh berkas di atas (lewat importlib, karena '2-opt.py' / '3-opt.py'
# memakai tanda hubung sehingga tak bisa di-import biasa) supaya hanya ada satu
# sumber kebenaran. Perbaikan di berkas aslinya otomatis ikut di sini.
#
# Catatan: ini kode RUJUKAN Python untuk laporan/perbandingan. Aplikasi web
# memakai versi TypeScript di lib/tsp/.
#
# Jalankan:  python algorithms/gabungan.py
# ============================================================================

import importlib.util
import os
import random

_DIR = os.path.dirname(os.path.abspath(__file__))


def _load(stem):
    """Muat sebuah berkas .py di folder ini sebagai modul (menangani tanda hubung)."""
    path = os.path.join(_DIR, f"{stem}.py")
    spec = importlib.util.spec_from_file_location(f"_alg_{stem.replace('-', '_')}", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# --- Ambil fungsi asli dari berkas masing-masing (satu sumber kebenaran) ---
_nn = _load("NN").nearest_neighbor_tsp
_ni = _load("NI").nearest_insertion_tsp
_ci = _load("CI").cheapest_insertion_tsp
_fi = _load("FI").farthest_insertion_tsp
_ai = _load("AI").arbitrary_insertion_tsp
_opt2_mod = _load("2-opt")
_opt2 = _opt2_mod.opt_2
_opt3 = _load("3-opt").opt_3
# total_tour_distance identik di semua berkas; pakai satu saja.
total_tour_distance = _opt2_mod.total_tour_distance

# Peta nama -> fungsi, supaya mudah dipilih dari luar (mis. dari UI web nanti).
CONSTRUCTIONS = {
    "NN": _nn,  # Nearest Neighbor
    "NI": _ni,  # Nearest Insertion
    "CI": _ci,  # Cheapest Insertion
    "FI": _fi,  # Farthest Insertion
    "AI": _ai,  # Arbitrary Insertion (acak -> pakai best-of-N bila perlu)
}
IMPROVEMENTS = {
    "2opt": _opt2,
    "3opt": _opt3,
}


def solve(cities, construction="CI", improvements=("2opt", "3opt"), seed=None):
    """
    Pipeline gabungan: bangun rute dengan satu metode konstruksi, lalu rapikan
    berurutan dengan metode perbaikan yang diminta.

    Parameter
    ---------
    cities        : list of (x, y)
    construction  : kunci di CONSTRUCTIONS, mis. "CI"
    improvements  : urutan kunci di IMPROVEMENTS, mis. ("2opt", "3opt")
    seed          : seed untuk metode konstruksi acak (AI); lain-lain abaikan

    Mengembalikan dict berisi rute & jarak di tiap tahap, agar perkembangannya
    terbaca (dan kelak bisa jadi dasar animasi langkah-demi-langkah di web).
    """
    if seed is not None:
        random.seed(seed)

    tour = CONSTRUCTIONS[construction](cities)
    tahap = [(construction, list(tour), total_tour_distance(tour, cities))]

    for key in improvements:
        tour = IMPROVEMENTS[key](tour, cities)
        tahap.append((key, list(tour), total_tour_distance(tour, cities)))

    return {
        "route": tour,
        "distance": total_tour_distance(tour, cities),
        "pipeline": f"{construction}" + "".join(f" + {k}" for k in improvements),
        "stages": tahap,
    }


def best_of(cities, construction="AI", improvements=("2opt", "3opt"), runs=25, seed=0):
    """
    'best of N runs': jalankan pipeline beberapa kali (berguna untuk konstruksi
    acak seperti AI) lalu ambil hasil terpendek. Inilah yang dimaksud baris
    'opt (best of 25/50 runs)' pada tabel acuan.
    """
    best = None
    for r in range(runs):
        res = solve(cities, construction, improvements, seed=seed + r)
        if best is None or res["distance"] < best["distance"]:
            best = res
    best["pipeline"] = f"best-of-{runs} ({best['pipeline']})"
    return best


# ---------------------------------------------------------------------------
# Demo + tabel perbandingan pada dataset 25 kota (Case I, paper acuan).
# ---------------------------------------------------------------------------
SAMPLE_25 = [
    (53.49, 94.14), (28.84, 75.95), (44.31, 28.58), (16.33, 71.57), (50.71, 48.65),
    (54.12, 98.45), (24.28, 75.06), (35.78, 25.31), (50.05, 60.28), (85.48, 11.12),
    (9.08, 58.11), (95.46, 22.88), (83.47, 39.44), (91.37, 73.04), (60.42, 98.67),
    (51.56, 41.53), (55.73, 21.64), (55.61, 17.59), (29.98, 49.08), (33.67, 7.2),
    (68.61, 92.34), (60.96, 88.75), (66.74, 43.31), (4.14, 75.21), (11.23, 77.58),
]


def _tabel(cities):
    print("Konstruksi tunggal  ->  + 2-opt  ->  + 2-opt + 3-opt\n" + "-" * 54)
    for key in CONSTRUCTIONS:
        a = solve(cities, key, ())["distance"]
        b = solve(cities, key, ("2opt",))["distance"]
        c = solve(cities, key, ("2opt", "3opt"), seed=42)["distance"]
        print(f"  {key:<3} {a:8.2f}   {b:8.2f}   {c:8.2f}")
    bo = best_of(cities, "AI", ("2opt", "3opt"), runs=25, seed=0)
    print("-" * 54)
    print(f"  {bo['pipeline']}: {bo['distance']:.2f}")


if __name__ == "__main__":
    _tabel(SAMPLE_25)
    print("\nContoh satu pipeline lengkap (CI + 2opt + 3opt):")
    res = solve(SAMPLE_25, "CI", ("2opt", "3opt"), seed=42)
    for nama, _rute, jarak in res["stages"]:
        print(f"  setelah {nama:<5}: {jarak:.2f}")
    print(f"  rute akhir: {res['route']}")
