import React from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Lock, 
  HelpCircle, 
  Layers, 
  EyeOff, 
  Zap, 
  Key, 
  CheckCircle2,
  Terminal,
  Server
} from 'lucide-react';

export const KnowledgeGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <span>Cara Kerja Penyamaran Domain Virtual & Standar Keamanan</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Penjelasan teknis komprehensif bagaimana CloakURL menyamarkan URL panjang menjadi seolah-olah domain mandiri tanpa perlu membeli domain di reseller atau mendaftarkan DNS.
        </p>
      </div>

      {/* Core Concept Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Domain Konvensional */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <Server className="w-4 h-4 text-slate-400" />
            <span>Cara Lama: Domain Resmi (Reseller / Registrar)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-mono">✕</span>
              <span>Wajib bayar biaya sewa tahunan (Rp 150rb - 500rb/tahun) ke registrar seperti Namecheap atau Niagahoster.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-mono">✕</span>
              <span>Harus konfigurasi DNS (A Record, CNAME, Nameserver) yang membutuhkan waktu propagasi hingga 24 jam.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-mono">✕</span>
              <span>Identitas pembeli domain tercatat di database WHOIS publik (privasi rendah).</span>
            </li>
          </ul>
        </div>

        {/* CloakURL Virtual Gateway */}
        <div className="p-5 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Cara CloakURL: Virtual Domain Cloaking Gateway</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>100% Gratis & Instan:</strong> Anda bebas mengetik nama domain apa saja (misal: <em>secure.company-vault.id</em>) tanpa beli apapun.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>Tanpa DNS:</strong> Aplikasi ini bertindak sebagai gateway perantara cerdas yang langsung memetakan slug ke link tujuan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>Privasi Maksimal:</strong> Tidak ada rekaman WHOIS, URL panjang dipersingkat dan disamarkan secara rapi.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Critical Troubleshooting & How To Share Guide */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-emerald-950/40 border border-indigo-500/40 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
          <Globe className="w-4 h-4" />
          <span>Tanya Jawab Kritis: "Kenapa Saat Dikirim ke Email Lain Dianggap Domain Harus Dibeli?"</span>
        </div>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>Penyebab:</strong> Jika Anda mengirimkan teks domain maya (misalnya <code>https://secure-vault.internal</code>) secara langsung di email atau chat, browser penerima akan mencarinya di DNS publik dunia. Karena domain tersebut sengaja tidak dibeli di registrar, browser penerima akan mengira domain tersebut belum didaftarkan / dijual.
          </p>
          <p>
            <strong>Solusi Mudah & Benar:</strong> Selalu bagikan <strong>"Tautan Aktif Resmi"</strong> yang disalin dari tombol hijau di detail tautan (format: <code>https://[app_url]/#/v/[domain]/[slug]?p=...</code>). Tautan aktif ini memuat token portabel terenkripsi yang <strong>100% BISA DIBUKA OLEH SIAPA SAJA DI EMAIL ATAU HP MANA PUN</strong>. Begitu penerima mengkliknya, aplikasi kita langsung menyamarkan antarmuka menjadi domain virtual pilihan Anda!
          </p>
        </div>
      </div>

      {/* 3 Masking Modes Explanation */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>3 Metode Penyamaran yang Didukung Aplikasi</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1 */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-indigo-400">1. Stealth Sandbox Frame</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Website tujuan dibuka di dalam viewport berbingkai dengan simulasi <em>Browser Omnibox</em>. Pengunjung melihat domain virtual Anda dan gembok SSL di bilah atas.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Cocok untuk: Dokumen preview, formulir internal, portofolio online.
            </div>
          </div>

          {/* Mode 2 */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-indigo-400">2. Security Interstitial Shield</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pengunjung disajikan layar audit keamanan (seperti Cloudflare Verification) yang menampilkan domain virtual Anda sebelum diteruskan ke tujuan akhir secara aman.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Cocok untuk: Link sensitif, tautan pembayaran, unduhan berkas penting.
            </div>
          </div>

          {/* Mode 3 */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-indigo-400">3. Direct Masked Route</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pengalihan instan dengan kebijakan <em>rel="noreferrer noopener"</em>, sehingga situs tujuan tidak dapat melacak dari mana pengunjung datang.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Cocok untuk: Pemendekan tautan cepat untuk media sosial dan chat.
            </div>
          </div>
        </div>
      </div>

      {/* High Security Architecture */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Fitur Keamanan Tinggi (High Security Suite)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Proteksi PIN Enkripsi SHA-256</span>
            </div>
            <p className="text-slate-400">
              PIN tidak pernah disimpan dalam teks biasa. Dilengkapi proteksi anti-brute force (lockout 30 detik setelah 3x salah).
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hancur Otomatis (Burn After Read)</span>
            </div>
            <p className="text-slate-400">
              Tautan otomatis dinonaktifkan permanen segera setelah dibuka oleh 1 orang, mencegah penyebaran link rahasia.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pembersih Pelacak (Anti-Surveillance)</span>
            </div>
            <p className="text-slate-400">
              Menghapus otomatis tag iklan jahat seperti UTM, FBCLID, GCLID yang sering membocorkan data pribadi dan profil pengguna.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deteksi Serangan Homoglyph & Punycode</span>
            </div>
            <p className="text-slate-400">
              Mendeteksi apakah tautan menggunakan karakter alfabet tiruan (Cyrillic xn--) yang sering dipakai sindikat phishing.
            </p>
          </div>
        </div>
      </div>

      {/* Cloudflare Pages & GitHub Deployment Guide */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Globe className="w-5 h-5 text-indigo-400" />
          <span>Panduan Deploy ke GitHub & Cloudflare Pages (Gratis & Sangat Stabil)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Kabar Baik:</strong> Menghosting aplikasi ini di <strong>Cloudflare Pages</strong> adalah pilihan terbaik untuk bisnis Anda! Semua link yang dibuat akan <strong>100% berjalan lancar</strong> dan bisa dibuka oleh siapa saja tanpa error 403 atau 404.
        </p>
        
        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-emerald-400">Langkah 1: Push Kode ke Repositori GitHub Anda</span>
            <p className="text-slate-400">
              Download atau push seluruh source code proyek ini ke akun GitHub pribadi Anda (bisa repositori Public atau Private).
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-emerald-400">Langkah 2: Hubungkan ke Cloudflare Pages (100% Gratis)</span>
            <p className="text-slate-400">
              Buka dashboard Cloudflare &gt; <em>Compute (Workers &amp; Pages)</em> &gt; <em>Create application</em> &gt; <em>Pages</em> &gt; <em>Connect to Git</em> &gt; Pilih repo Anda.
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-indigo-300 mt-2 space-y-0.5">
              <div>• Framework preset: <strong>Vite</strong></div>
              <div>• Build command: <strong>npm run build</strong></div>
              <div>• Build output directory: <strong>dist</strong></div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-emerald-400">Langkah 3: Tautan Langsung Aktif di Seluruh Dunia</span>
            <p className="text-slate-400">
              Cloudflare Pages akan memberikan subdomain instan gratis (contoh: <code>https://nama-bisnis.pages.dev</code>) atau Anda bisa menghubungkan domain kustom sendiri (contoh: <code>https://link.perusahaan.com</code>).
            </p>
          </div>

          {/* Cloudflare Troubleshooting: Initializing stuck */}
          <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg space-y-1.5 mt-2">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Solusi Jika Build Tertahan di "Initializing build environment..." (3+ Menit)
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Jika di Cloudflare muncul status <em>Build #... Initializing build environment</em> yang tidak jalan-jalan, itu karena Anda berada di menu <strong>Cloudflare Workers</strong> (yang menggunakan antrean container serverless lambat).
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Solusinya:</strong> Klik tombol <strong>Cancel build</strong> di kanan atas, lalu buat lewat tab <strong>Pages</strong> (Workers &amp; Pages &gt; Create &gt; tab <strong>Pages</strong> &gt; Connect to Git). Cloudflare Pages khusus didesain untuk frontend Vite/React dan akan selesai hanya dalam 20–30 detik!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
