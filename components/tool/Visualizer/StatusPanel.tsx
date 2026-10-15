"use client";

// Panel edukasi "Apa yang sedang terjadi" — isinya berbeda per algoritma.
// SA: termometer suhu + kartu probabilitas Metropolis p = e^(-Δ/T).
// TS: daftar tabu list + sorotan momen aspiration.
// Heuristik klasik: tahap (konstruksi / 2-opt / 3-opt) + keterangan langkah.

import { motion, useReducedMotion } from "motion/react";
import {
  Flame,
  Ban,
  Sparkles,
  TrendingDown,
  ThumbsDown,
  Zap,
  Hammer,
  Scissors,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Frame } from "@/lib/tsp/types";
import type { AlgorithmKey } from "@/lib/store/useRunStore";
import { cn } from "@/lib/utils";

/** Istilah dengan penjelasan kontekstual (mode edukasi ringan). */
function ConceptTip({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-help underline decoration-dotted underline-offset-4">
            {term}
          </span>
        }
      />
      <TooltipContent className="max-w-xs text-pretty">{children}</TooltipContent>
    </Tooltip>
  );
}

/** Angka biaya yang "hidup": memantul saat nilainya berubah. */
function CostStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "current" | "best";
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <motion.p
        // Hanya angka "rute terbaik" yang memantul, dan hanya saat rekornya
        // benar-benar berubah. Sebelumnya key={value} dipasang pada keduanya,
        // sehingga angka "rute saat ini" ikut memantul TIAP frame — pada 8 fps
        // itulah yang membuat panel terlihat gelisah.
        key={tone === "best" ? value : undefined}
        initial={reduceMotion || tone !== "best" ? false : { scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className={cn(
          "text-xl font-bold tabular-nums",
          tone === "best" ? "text-secondary" : "text-primary"
        )}
      >
        {value.toFixed(2)}
      </motion.p>
    </div>
  );
}

/** Termometer suhu (skala logaritmik, karena suhu meluruh eksponensial). */
function Thermometer({ temperature, initial }: { temperature: number; initial: number }) {
  const reduceMotion = useReducedMotion();
  const minT = 1e-10;
  const frac = Math.max(
    0,
    Math.min(
      1,
      (Math.log10(Math.max(temperature, minT)) - Math.log10(minT)) /
        (Math.log10(initial) - Math.log10(minT))
    )
  );

  return (
    <div className="flex items-center gap-3">
      {/* Tabung diberi garis tepi dan bohlam di bawah: tanpa itu, saat suhu nyaris
          nol isian amber-nya hilang dan yang tersisa hanya balok abu mengambang. */}
      <div className="relative flex flex-col items-center">
        <div className="relative h-28 w-5 overflow-hidden rounded-full border border-accent/30 bg-muted">
          <motion.div
            className="absolute bottom-0 w-full rounded-full bg-accent"
            animate={{ height: `${frac * 100}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
          />
        </div>
        <div className="-mt-1.5 size-4 rounded-full border border-accent/30 bg-accent" />
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Flame className="size-4 text-accent" />
          <ConceptTip term="Suhu (T)">
            Suhu mengatur seberapa berani algoritma menerima rute yang lebih buruk.
            Awalnya tinggi (banyak eksplorasi), lalu didinginkan sedikit demi sedikit
            sampai perilakunya mirip pendakian bukit biasa.
          </ConceptTip>
        </p>
        <p className="font-mono text-lg font-bold text-accent tabular-nums">
          {temperature < 0.01 ? temperature.toExponential(2) : temperature.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function SAPanel({ frame, initialTemperature }: { frame: Frame; initialTemperature: number }) {
  const delta = frame.deltaCost ?? 0;
  const worseAccepted = frame.accepted && delta > 0;

  return (
    <div className="space-y-4">
      <Thermometer temperature={frame.temperature ?? 0} initial={initialTemperature} />

      {/* Tinggi dikunci pada kartunya sendiri (bukan pada wadah kosong): kartu
          "menerima langkah lebih buruk" jauh lebih tinggi daripada dua lainnya,
          dan tanpa ini panel melompat tiap kali SA berganti keputusan — yang
          terjadi hampir tiap frame. */}
      {worseAccepted ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-28 flex-col justify-center rounded-2xl border border-accent/40 bg-accent/10 p-3"
        >
          <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
            <Zap className="size-4 text-accent" />
            Menerima langkah lebih buruk
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums">
            p = e<sup>(−Δ/T)</sup> = e<sup>(−{delta.toFixed(2)} / {(frame.temperature ?? 0).toFixed(2)})</sup> ={" "}
            <span className="font-bold">{(frame.acceptProbability ?? 0).toFixed(4)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rute jadi {delta.toFixed(2)} lebih panjang, tapi tetap diterima — ini caranya{" "}
            <ConceptTip term="kabur dari optimum lokal">
              Optimum lokal = rute yang tampak terbaik di sekitarnya, padahal masih ada
              rute jauh lebih pendek di tempat lain. Sesekali menerima rute lebih buruk
              membuat pencarian bisa keluar dari jebakan itu.
            </ConceptTip>
            .
          </p>
        </motion.div>
      ) : delta < 0 ? (
        <div className="flex min-h-28 flex-col justify-center rounded-2xl border border-secondary/40 bg-secondary/10 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
            <TrendingDown className="size-4" />
            Langkah lebih baik — langsung diterima
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rute memendek {Math.abs(delta).toFixed(2)}.
          </p>
        </div>
      ) : (
        <div className="flex min-h-28 flex-col justify-center rounded-2xl border border-border bg-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <ThumbsDown className="size-4" />
            Langkah lebih buruk ditolak
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Δ = +{delta.toFixed(2)}; undian acak melebihi p, jadi rute tidak berubah.
          </p>
        </div>
      )}
    </div>
  );
}

/** Jumlah slot tabu yang selalu dirender — tetap, supaya tata letak tidak bergoyang. */
const TABU_SLOTS = 8;

/**
 * Satu kartu tabu. Lebarnya ditentukan oleh sel grid, bukan oleh isinya, dan
 * komponen ini SENGAJA di-key berdasarkan nomor slot (bukan gerakannya) supaya
 * React hanya memperbarui teksnya di tempat. Sebelumnya tiap kartu di-mount
 * ulang tiap frame sehingga ikut beranimasi masuk terus-menerus.
 */
function TabuSlot({
  entry,
  tenure,
}: {
  entry: { move: [number, number]; remaining: number } | undefined;
  tenure: number;
}) {
  if (!entry) {
    return (
      <span
        aria-hidden="true"
        className="h-7 rounded-lg border border-dashed border-border/70"
      />
    );
  }
  // Sisa masa tabu digambarkan sebagai isian latar: makin pendek, makin pudar —
  // jadi perubahannya terbaca tanpa mengubah ukuran apa pun.
  const frac = Math.max(0, Math.min(1, entry.remaining / Math.max(1, tenure)));
  return (
    <span
      title={`Gerakan (${entry.move[0]}, ${entry.move[1]}) masih tabu selama ${entry.remaining} iterasi lagi`}
      className="relative flex h-7 items-center justify-between overflow-hidden rounded-lg border border-destructive/30 px-2 font-mono text-[11px] text-destructive tabular-nums"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-destructive/10 transition-[width] duration-150"
        style={{ width: `${frac * 100}%` }}
      />
      <span className="relative truncate">
        ({entry.move[0]},{entry.move[1]})
      </span>
      <span className="relative pl-1 text-destructive/70">{entry.remaining}</span>
    </span>
  );
}

function TSPanel({ frame }: { frame: Frame }) {
  const all = (frame.tabuList ?? []).map((t) => ({
    move: t.move,
    remaining: t.expiresAt - frame.iteration,
  }));
  // Terbaru dulu. Tiap iterasi selalu ada satu gerakan yang baru dimasukkan,
  // sehingga sisa terbesar = tenure yang dipakai saat menjalankan solver.
  const sorted = [...all].sort((a, b) => b.remaining - a.remaining);
  const tenure = sorted.length ? sorted[0].remaining : 1;
  const shown = sorted.slice(0, TABU_SLOTS);

  return (
    <div className="space-y-4">
      {/* Tinggi dikunci pada kartunya sendiri: tiga kemungkinan status punya
          panjang teks berbeda, dan tanpa ini seluruh panel ikut naik-turun tiap
          kali statusnya berganti. */}
        {frame.aspiration ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-24 flex-col justify-center rounded-2xl border border-secondary/50 bg-secondary/10 p-3"
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
              <Sparkles className="size-4" />
              Aspiration!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gerakan ini sebenarnya <ConceptTip term="tabu">
                Tabu = gerakan yang baru saja dipakai, jadi dilarang sementara supaya
                pencarian tidak bolak-balik di tempat yang sama.
              </ConceptTip>, tapi tetap dipakai karena menghasilkan rute lebih pendek
              daripada rekor terbaik.
            </p>
          </motion.div>
        ) : frame.isTabuMove ? (
          <div className="flex min-h-24 flex-col justify-center rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
              <Ban className="size-4" />
              Semua tetangga tabu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dipilih gerakan yang sisa masa tabunya paling pendek, agar pencarian tetap
              berjalan (tidak berhenti mendadak).
            </p>
          </div>
        ) : (
          <div className="flex min-h-24 flex-col justify-center rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold">Memilih tetangga terbaik non-tabu</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gerakan tukar posisi{" "}
              <span className="font-mono font-semibold text-foreground tabular-nums">
                ({frame.move?.[0]}, {frame.move?.[1]})
              </span>
              .
            </p>
          </div>
        )}

      <div>
        <p className="mb-2 flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <Ban className="size-4 text-destructive" />
          <ConceptTip term="Tabu list">
            Daftar gerakan yang sedang dilarang beserta sisa umurnya (tenure). Tiap
            iterasi umurnya berkurang; saat habis, gerakan itu boleh dipakai lagi.
          </ConceptTip>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {all.length} aktif
            {all.length > TABU_SLOTS && ` · ${TABU_SLOTS} terbaru ditampilkan`}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: TABU_SLOTS }).map((_, i) => (
            <TabuSlot key={i} entry={shown[i]} tenure={tenure} />
          ))}
        </div>
        {all.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Belum ada gerakan terlarang.
          </p>
        )}
      </div>
    </div>
  );
}

/** Panel edukasi untuk heuristik klasik (konstruksi + perbaikan). */
function HeuristicPanel({ frame }: { frame: Frame }) {
  const reduceMotion = useReducedMotion();
  const phase = frame.phase ?? "construction";
  const isBuild = phase === "construction";

  const meta = isBuild
    ? {
        label: "Konstruksi",
        Icon: Hammer,
        tone: "text-primary",
        ring: "border-primary/40 bg-primary/10",
        title: "Membangun rute",
        tip: (
          <ConceptTip term="konstruksi">
            Heuristik konstruksi membangun rute dari nol: mulai dari beberapa kota,
            lalu menambah satu kota tiap langkah dengan aturan tertentu (terdekat,
            termurah, terjauh, dst.) sampai semua kota masuk.
          </ConceptTip>
        ),
      }
    : {
        label: phase === "2opt" ? "Perbaikan 2-opt" : "Perbaikan 3-opt",
        Icon: Scissors,
        tone: "text-accent",
        ring: "border-accent/40 bg-accent/10",
        title: phase === "2opt" ? "Mengurai dua sisi" : "Menyambung ulang tiga potongan",
        tip: (
          <ConceptTip term="perbaikan lokal">
            Setelah rute awal jadi, local search merapikannya: memotong beberapa sisi
            lalu menyambung ulang bila itu memperpendek rute. 2-opt memotong dua sisi,
            3-opt memotong tiga.
          </ConceptTip>
        ),
      };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">Panjang rute saat ini</p>
        <motion.p
          key={frame.currentCost}
          initial={reduceMotion ? false : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="text-xl font-bold text-secondary tabular-nums"
        >
          {frame.currentCost.toFixed(2)}
        </motion.p>
      </div>

      <div className="flex items-center gap-2">
        <Badge className="gap-1.5 bg-primary text-primary-foreground">
          <meta.Icon className="size-3.5" />
          {meta.label}
        </Badge>
        <span className="text-xs text-muted-foreground">Tahap {isBuild ? "1" : "2"} dari 2</span>
      </div>

      {/* Tinggi dikunci supaya panel tidak melompat saat keterangan berganti. */}
      <div className={cn("flex min-h-28 flex-col justify-center rounded-2xl border p-3", meta.ring)}>
        <p className={cn("flex items-center gap-1.5 text-sm font-semibold", meta.tone)}>
          <meta.Icon className="size-4" />
          {meta.title}
        </p>
        <p className="mt-1 text-sm">{frame.note ?? "—"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Ini bagian dari tahap {meta.tip}.
        </p>
      </div>
    </div>
  );
}

export function StatusPanel({
  algorithm,
  frame,
  initialTemperature,
}: {
  algorithm: AlgorithmKey;
  frame: Frame;
  initialTemperature: number;
}) {
  if (algorithm === "heuristic") return <HeuristicPanel frame={frame} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <CostStat label="Rute saat ini" value={frame.currentCost} tone="current" />
        <CostStat label="Rute terbaik" value={frame.bestCost} tone="best" />
      </div>
      {algorithm === "sa" ? (
        <SAPanel frame={frame} initialTemperature={initialTemperature} />
      ) : (
        <TSPanel frame={frame} />
      )}
    </div>
  );
}
