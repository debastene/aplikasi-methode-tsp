"use client";

// Bagian VITAL halaman /tool: input data kota (upload / manual / contoh),
// dengan pratinjau, ringkasan jumlah kota, dan status validasi.

import { ShieldCheck, MapPin, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "./Upload";
import { ManualTable } from "./ManualTable";
import { CityPreview } from "./CityPreview";
import { SampleData } from "./SampleData";
import { useCityStore } from "@/lib/store/useCityStore";
import { validateCityCount } from "@/lib/parsing/validate";
import { MAX_CITIES_ANIMATION, MIN_CITIES } from "@/lib/config";

export function DataInputPanel() {
  const cities = useCityStore((s) => s.cities);

  const count = cities.length;
  const v = validateCityCount(count);

  const statusBadge = () => {
    if (count === 0)
      return (
        <Badge variant="secondary" className="gap-1 bg-muted text-muted-foreground">
          <MapPin className="size-3.5" /> Belum ada data
        </Badge>
      );
    if (!v.ok)
      return (
        <Badge className="gap-1 bg-destructive text-white">
          <XCircle className="size-3.5" /> {count} kota — belum valid
        </Badge>
      );
    if (!v.canAnimate)
      return (
        <Badge className="gap-1 bg-accent text-accent-foreground">
          <AlertTriangle className="size-3.5" /> {count} kota — animasi off
        </Badge>
      );
    return (
      <Badge className="gap-1 bg-secondary text-white">
        <CheckCircle2 className="size-3.5" /> {count} kota — siap
      </Badge>
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-base text-primary-foreground shadow-sm shadow-primary/30">
              1
            </span>
            Input Data Kota
          </h2>
          <p className="text-sm text-muted-foreground">
            Unggah CSV/Excel, isi manual, atau muat contoh. Butuh kolom{" "}
            <code>x</code> &amp; <code>y</code>, minimal {MIN_CITIES} kota.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-secondary/40 text-secondary">
          <ShieldCheck className="size-3.5" />
          Data tidak dikirim ke server
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kiri: kontrol input */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Sumber data</CardTitle>
            <SampleData />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">
                  Unggah file
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">
                  Input manual
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-4">
                <Upload />
              </TabsContent>
              <TabsContent value="manual" className="pt-4">
                <ManualTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Kanan: pratinjau + status */}
        <Card className="rounded-3xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Pratinjau sebaran</CardTitle>
            {statusBadge()}
          </CardHeader>
          <CardContent className="space-y-3">
            <CityPreview cities={cities} />
            {v.message && (
              <p
                className={
                  v.ok
                    ? "text-sm text-accent"
                    : "text-sm font-medium text-destructive"
                }
              >
                {v.message}
              </p>
            )}
            {count > MAX_CITIES_ANIMATION && (
              <p className="text-xs text-muted-foreground">
                Tip: gunakan ≤ {MAX_CITIES_ANIMATION} kota untuk melihat animasi rute.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
