// Latar shader untuk SELURUH situs. Dipasang sekali di app/layout.tsx: fixed di
// belakang semua konten, jadi terlihat sepanjang scroll di semua halaman dan
// tidak ikut "berkedip" saat pindah halaman (berada di luar app/template.tsx).
//
// `bg-background` pada pembungkus mencegah kedip putih di frame pertama sebelum
// WebGL sempat menggambar. `pointer-events-none` menjaga latar tidak menangkap
// klik; efek kursor pada shader memakai listener window, jadi tetap jalan.

import { ShaderBackground } from "@/components/ui/shader-background";

export function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <ShaderBackground className="h-full w-full" />
      {/* Lapisan kedalaman: cahaya lembut di atas + halo indigo samar di balik
          hero, lalu meredup ke warna halaman di bawah agar konten terasa tenang
          dan kartu "mengambang". Membuat latar terasa premium, bukan abu rata. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 620px at 50% -12%, rgba(255,255,255,0.60), transparent 62%)," +
            "radial-gradient(900px 520px at 50% 0%, rgba(64,64,204,0.07), transparent 66%)," +
            "linear-gradient(to bottom, transparent 52%, var(--background) 100%)",
        }}
      />
    </div>
  );
}
