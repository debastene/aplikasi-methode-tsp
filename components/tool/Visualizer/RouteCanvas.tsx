"use client";

// Kanvas rute TSP. Tiap "slot sisi" ke-i adalah satu <motion.line> yang animasi
// ujung-ujungnya berpindah saat rute berubah -> efek rute bermorf halus.
//
// Warna: rute TERBAIK = teal tebal, rute SAAT INI = abu grafit tipis.

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { City } from "@/lib/types";
import type { Tour } from "@/lib/tsp/types";

const W = 640;
const H = 440;
const PAD = 40;

type Props = {
  cities: City[];
  currentTour: Tour;
  bestTour: Tour;
  /** Durasi transisi antar frame (detik) — mengikuti kecepatan playback. */
  duration: number;
  showCurrent?: boolean;
  /** Heuristik konstruksi: kota yang baru ditambahkan (disorot). */
  focusNode?: number;
  /** Heuristik perbaikan: sisi kota a-b yang berubah (disorot). */
  focusEdges?: [number, number][];
};

export function RouteCanvas({
  cities,
  currentTour,
  bestTour,
  duration,
  showCurrent = true,
  focusNode,
  focusEdges,
}: Props) {
  const reduceMotion = useReducedMotion();

  // Posisi node di kanvas (dinormalisasi agar selalu pas dalam viewBox).
  const pos = useMemo(() => {
    if (cities.length === 0) return [];
    const xs = cities.map((c) => c.x);
    const ys = cities.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    return cities.map((c) => ({
      x: PAD + ((c.x - minX) / spanX) * (W - 2 * PAD),
      // Y dibalik agar mengikuti konvensi kartesius.
      y: H - (PAD + ((c.y - minY) / spanY) * (H - 2 * PAD)),
    }));
  }, [cities]);

  if (pos.length === 0) return null;

  /** Ubah sebuah tour menjadi daftar segmen (siklik). */
  const segmentsOf = (tour: Tour) =>
    tour.map((from, i) => {
      const to = tour[(i + 1) % tour.length];
      return { a: pos[from], b: pos[to] };
    });

  const bestSegs = segmentsOf(bestTour);
  const currentSegs = showCurrent ? segmentsOf(currentTour) : [];
  const startNode = pos[currentTour[0]];
  // Reduced motion: rute tetap tampil & tetap berpindah tiap frame, hanya saja
  // perpindahannya langsung (tanpa transisi bergerak).
  const transition = { duration: reduceMotion ? 0 : duration, ease: "easeOut" as const };
  // Label disembunyikan saat kota banyak — kalau tidak, teksnya saling tumpang tindih.
  const showLabels = cities.length <= 15;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full rounded-2xl border border-border bg-card"
      role="img"
      aria-label="Visualisasi rute TSP"
    >
      {/* Rute yang sedang dievaluasi (tipis, transparan) */}
      {currentSegs.map((s, i) => (
        <motion.line
          key={`cur-${i}`}
          stroke="var(--brand-graphite)"
          strokeWidth={2}
          strokeOpacity={0.7}
          strokeLinecap="round"
          initial={false}
          animate={{ x1: s.a.x, y1: s.a.y, x2: s.b.x, y2: s.b.y }}
          transition={transition}
        />
      ))}

      {/* Rute terbaik sejauh ini (tebal, Teal) */}
      {bestSegs.map((s, i) => (
        <motion.line
          key={`best-${i}`}
          stroke="var(--brand-teal)"
          strokeWidth={4}
          strokeLinecap="round"
          initial={false}
          animate={{ x1: s.a.x, y1: s.a.y, x2: s.b.x, y2: s.b.y }}
          transition={transition}
        />
      ))}

      {/* Sorotan sisi yang berubah (tahap perbaikan 2-opt/3-opt) */}
      {focusEdges?.map(([a, b], i) =>
        pos[a] && pos[b] ? (
          <line
            key={`focus-edge-${i}`}
            x1={pos[a].x}
            y1={pos[a].y}
            x2={pos[b].x}
            y2={pos[b].y}
            stroke="var(--brand-amber)"
            strokeWidth={5}
            strokeOpacity={0.9}
            strokeLinecap="round"
          />
        ) : null
      )}

      {/* Node kota */}
      {pos.map((p, i) => (
        <g key={`node-${i}`}>
          <circle cx={p.x} cy={p.y} r={7} fill="var(--brand-indigo)" />
          {showLabels && (
            <text
              x={p.x}
              y={p.y - 13}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {cities[i].label}
            </text>
          )}
        </g>
      ))}

      {/* Sorotan kota yang baru ditambahkan (tahap konstruksi) */}
      {focusNode !== undefined && pos[focusNode] && (
        <motion.circle
          key={`focus-node-${focusNode}`}
          cx={pos[focusNode].x}
          cy={pos[focusNode].y}
          fill="var(--brand-amber)"
          stroke="var(--card)"
          strokeWidth={2}
          initial={reduceMotion ? false : { r: 13, opacity: 0.6 }}
          animate={{ r: 8, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
        />
      )}

      {/* Penanda titik awal rute (Amber) — hanya saat ada rute "current" */}
      {showCurrent && startNode && (
        <motion.circle
          initial={false}
          animate={{ cx: startNode.x, cy: startNode.y }}
          transition={transition}
          r={12}
          fill="none"
          stroke="var(--brand-amber)"
          strokeWidth={3}
        />
      )}
    </svg>
  );
}
