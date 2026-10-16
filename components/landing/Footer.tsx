import { Route } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 text-center sm:px-6">
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary),#7c3aed_35%)] text-primary-foreground shadow-sm shadow-primary/30">
            <Route className="size-4" aria-hidden="true" />
          </span>
          <p className="font-semibold">MetaPath</p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Proyek mahasiswa Sains Data — Institut Teknologi Sepuluh Nopember (ITS)
          Surabaya
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Dibuat untuk mata kuliah Metode Optimasi Metaheuristik.
        </p>
      </div>
    </footer>
  );
}
