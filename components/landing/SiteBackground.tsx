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
      {/* Lapisan kedalaman TIPIS: cukup memberi cahaya di atas & halo indigo,
          tapi SENGAJA ringan agar animasi shader tetap terlihat jelas. Overlay
          kuat sebelumnya membuat latar tampak abu rata — di sini diturunkan. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 580px at 50% -14%, rgba(255,255,255,0.32), transparent 60%)," +
            "radial-gradient(950px 560px at 50% 2%, rgba(64,64,204,0.10), transparent 68%)," +
            "linear-gradient(to bottom, transparent 72%, color-mix(in oklab, var(--background) 72%, transparent) 100%)",
        }}
      />
    </div>
  );
}
