import { ArrowRight, Flame, Ban } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";

export function About() {
  return (
    <section
      id="tentang"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Tentang MetaPath
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          MetaPath adalah alat bantu belajar untuk mata kuliah Metode Optimasi
          Metaheuristik. Fokusnya satu: membuat <em>proses</em> pencarian solusi
          terlihat. Travelling Salesman Problem dipilih karena solusinya mudah digambar
          — sebuah rute keliling kota — sehingga setiap langkah algoritma bisa langsung
          diamati.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-accent/30 bg-[color-mix(in_oklab,var(--accent)_6%,var(--card))] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
          <Flame className="size-6 text-accent" aria-hidden="true" />
          <h3 className="mt-3 font-semibold">Simulated Annealing</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Terinspirasi proses pendinginan logam. Saat &ldquo;panas&rdquo;, algoritma
            berani menerima rute yang lebih buruk agar tidak terjebak; makin dingin,
            makin selektif.
          </p>
        </div>
        <div className="rounded-3xl border border-destructive/30 bg-[color-mix(in_oklab,var(--destructive)_6%,var(--card))] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
          <Ban className="size-6 text-destructive" aria-hidden="true" />
          <h3 className="mt-3 font-semibold">Tabu Search</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Punya ingatan. Gerakan yang baru dipakai dilarang sementara, supaya
            pencarian tidak berputar-putar di tempat yang sama.
          </p>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-4xl bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary),#7c3aed_42%)] px-6 py-14 text-center shadow-[var(--shadow-card-hover)]">
        <h3 className="text-balance text-2xl font-bold text-primary-foreground sm:text-3xl">
          Siap melihat algoritmanya bekerja?
        </h3>
        <p className="max-w-lg text-primary-foreground/80">
          Muat contoh data, tekan jalankan, dan tonton rutenya berbenah sendiri.
        </p>
        <ShinyButton href="/tool" className="mt-2">
          Coba Sekarang
          <ArrowRight className="size-4" />
        </ShinyButton>
      </div>
    </section>
  );
}
