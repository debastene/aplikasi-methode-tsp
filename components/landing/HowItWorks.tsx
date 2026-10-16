import { Upload, MousePointerClick, PlayCircle } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Input data",
    desc: "Unggah CSV/Excel berisi koordinat kota, isi manual di tabel, atau pakai contoh data yang sudah disediakan.",
  },
  {
    icon: MousePointerClick,
    title: "Pilih algoritma",
    desc: "Simulated Annealing atau Tabu Search. Atur parameternya sesuka hati — suhu, cooling rate, tabu tenure, dan lainnya.",
  },
  {
    icon: PlayCircle,
    title: "Lihat animasi rute",
    desc: "Putar, jeda, atau geser ke iterasi mana pun. Amati rute berubah sambil membaca apa yang sedang dipikirkan algoritma.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Tiga langkah saja
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          Dari data mentah sampai animasi rute, semuanya di satu halaman.
        </p>
      </div>

      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="relative rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="absolute -top-3 left-6 flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30">
                {i + 1}
              </span>
              <span className="mt-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-tint)] text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{s.desc}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
