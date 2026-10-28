"use client";

// Tombol pemuat dataset contoh bawaan (lihat lib/samples.ts).

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCityStore } from "@/lib/store/useCityStore";

export function SampleData() {
  const loadSample = useCityStore((s) => s.loadSample);
  const clear = useCityStore((s) => s.clear);
  const count = useCityStore((s) => s.cities.length);

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => loadSample("small")}
      >
        <Sparkles className="size-4 text-accent" aria-hidden="true" /> Contoh 6 kota
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => loadSample("medium")}
      >
        <Sparkles className="size-4 text-accent" aria-hidden="true" /> Contoh 25 kota
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => loadSample("large")}
      >
        <Sparkles className="size-4 text-accent" aria-hidden="true" /> Contoh 100 kota
      </Button>
      {count > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={clear}
        >
          Kosongkan
        </Button>
      )}
    </div>
  );
}
