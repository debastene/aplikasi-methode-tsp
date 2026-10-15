"use client";

// Navbar sticky, dipakai bersama oleh landing & halaman tool.
// Mobile: menu berubah jadi hamburger yang membuka panel dropdown.

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Route } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { cn } from "@/lib/utils";

const MENU = [
  { label: "Beranda", href: "/" },
  { label: "Coba Sekarang", href: "/tool" },
  { label: "Tentang", href: "/#tentang" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 shadow-[0_1px_0_rgba(17,19,41,0.04)] backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary),#7c3aed_35%)] text-primary-foreground shadow-sm shadow-primary/30">
            <Route className="size-5" />
          </span>
          <span className="text-lg">MetaPath</span>
        </Link>

        {/* Menu desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-[var(--surface-tint)] hover:text-primary"
            >
              {m.label}
            </Link>
          ))}
          <ShinyButton href="/tool" size="sm" className="ml-2">
            Coba Sekarang
          </ShinyButton>
        </div>

        {/* Tombol hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-xl border border-border md:hidden"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Panel menu mobile */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/60 bg-background md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
