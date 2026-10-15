"use client";

// Judul hero: tiap huruf muncul dengan spring berurutan (kesan playful/bouncy).
//
// Catatan: gradasi TIDAK memakai bg-clip-text, karena huruf yang dianimasikan
// punya transform sendiri dan transform pada elemen anak membuat background
// hasil clip induknya tidak ikut tergambar (huruf jadi tak terlihat).
// Solusinya: warna tiap huruf dihitung sendiri dari interpolasi palet.

import { motion, useReducedMotion } from "motion/react";

const STOPS = ["#4040cc", "#5b45e0", "#355fb8"]; // indigo disegarkan, kilau tipis ke violet

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Warna pada posisi t (0..1) sepanjang gradasi palet. */
function colorAt(t: number): string {
  const seg = t * (STOPS.length - 1);
  const i = Math.min(Math.floor(seg), STOPS.length - 2);
  const f = seg - i;
  const a = hexToRgb(STOPS[i]);
  const b = hexToRgb(STOPS[i + 1]);
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

export function AnimatedTitle({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  const letters = text.split("");
  const last = Math.max(1, letters.length - 1);

  return (
    <h1
      className="text-5xl font-extrabold tracking-tight sm:text-7xl"
      aria-label={text}
    >
      {letters.map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden="true"
          className="inline-block"
          style={{ color: colorAt(i / last) }}
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 14,
            delay: i * 0.055,
          }}
        >
          {ch}
        </motion.span>
      ))}
    </h1>
  );
}
