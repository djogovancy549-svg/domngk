import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Eye, 
  Play, 
  Pause, 
  Trash2, 
  Globe, 
  AlertTriangle, 
  Flame, 
  Shield,
  FileCode,
  Share2,
  Info
} from 'lucide-react';
import { CloakedLink } from '../types';
import { 
  buildShareableUrl, 
  buildVirtualDisplayUrl, 
  downloadStandaloneHtml 
} from '../utils/storage';

interface LinkDetailsModalProps {
  link: CloakedLink | null;
  isOpen: boolean;
  onClose: () => void;
  onTestLink: (link: CloakedLink) => void;
  onToggleStatus: (id: string) => void;
  onDeleteLink: (id: string) => void;
}

export const LinkDetailsModal: React.FC<LinkDetailsModalProps> = ({
  link,
  isOpen,
  onClose,
  onTestLink,
  onToggleStatus,
  onDeleteLink,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedVirtual, setCopiedVirtual] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [useDevUrl, setUseDevUrl] = useState(false);

  useEffect(() => {
    if (link) {
      const shareUrl = buildShareableUrl(link, useDevUrl);
      QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [link, useDevUrl]);

  if (!isOpen || !link) return null;

  const shareableUrl = buildShareableUrl(link, useDevUrl);
  const virtualDisplayUrl = buildVirtualDisplayUrl(link);

  const handleCopy = (text: string, type: 'share' | 'virtual' | 'original') => {
    navigator.clipboard.writeText(text);
    if (type === 'share') {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else if (type === 'virtual') {
      setCopiedVirtual(true);
      setTimeout(() => setCopiedVirtual(false), 2000);
    } else {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `qr-${link.virtualDomain}-${link.slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isExpired = link.expiresAt ? Date.now() > link.expiresAt : false;
  const isDepleted = link.status === 'depleted' || (link.maxClicks !== null && link.clicksCount >= link.maxClicks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{link.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Dibuat: {new Date(link.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                <span>·</span>
                <span className={
                  link.status === 'active' && !isExpired && !isDepleted
                    ? 'text-emerald-400 font-medium'
                    : 'text-amber-400 font-medium'
                }>
                  Status: {link.status === 'paused' ? 'Dijeda' : isExpired ? 'Kedaluwarsa' : isDepleted ? 'Kuota Habis' : 'Aktif'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onTestLink(link);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tautan (Uji Coba)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* 1. Primary Active Working Link Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-2 border-emerald-500/60 rounded-xl space-y-3.5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Tautan Aktif Untuk Dibagikan ke Klien
                </span>
              </div>

              {/* URL Mode Toggle: Public vs Dev */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUseDevUrl(false)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    !useDevUrl ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tautan Publik (ais-pre)
                </button>
                <button
                  type="button"
                  onClick={() => setUseDevUrl(true)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    useDevUrl ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tautan Dev Pribadi (ais-dev)
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-emerald-300 select-all break-all shadow-inner">
              {shareableUrl}
            </div>

            {/* Action Buttons: Copy, Test, and Standalone HTML Download */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(shareableUrl, 'share')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  {copiedShare ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedShare ? 'Tautan Tersalin!' : 'Salin Tautan'}</span>
                </button>

                <a
                  href={shareableUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </a>
              </div>

              {/* Standalone HTML File Button: Zero server error guarantee */}
              <button
                type="button"
                onClick={() => downloadStandaloneHtml(link)}
                className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                title="Unduh file HTML mandiri yang bisa dikirim sebagai lampiran email/WA tanpa butuh hosting"
              >
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Unduh File HTML Mandiri (.html)</span>
              </button>
            </div>

            {/* Crucial Notice About AI Studio Share Button to prevent 404 */}
            {!useDevUrl && (
              <div className="p-2.5 bg-slate-950/80 border border-indigo-500/30 rounded-lg text-[11px] text-slate-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Petunjuk Publikasi AI Studio:</strong> Jika membuka link publik <code>ais-pre-...</code> muncul <em>"Page not found (404)"</em>, klik tombol <strong>"Share" / "Bagikan"</strong> di pojok kanan atas layar AI Studio terlebih dahulu untuk mempublikasikan applet ke server publik Google Cloud.
                </div>
              </div>
            )}
          </div>

          {/* 2. Visual Domain Disguise Explanation & Warning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: What Visitor Sees in Browser */}
            <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  Hasil Tampilan Yang Dilihat Penerima
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Simulated Omnibox</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-white flex items-center gap-2 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-semibold">{virtualDisplayUrl}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Di dalam browser frame, pengunjung melihat alamat domain virtual ini seolah-olah domain mandiri asli Anda.
              </p>
            </div>

            {/* Right: Crucial Notice About Why Not to Send Raw String */}
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1.5 text-xs text-amber-200/90">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Penting: Mengapa Perlu Menggunakan Link Aktif?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Karena domain seperti <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">{link.virtualDomain}</code> tidak dibeli di reseller ICANN, jika Anda mengetik teks tersebut langsung di browser lain tanpa link aktif aplikasi kita, browser akan mencarinya di DNS publik dan menampilkannya sebagai "domain belum dibeli".
              </p>
            </div>
          </div>

          {/* Original URL disclosure */}
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden mr-3">
              <span className="text-slate-500 shrink-0">URL Asli:</span>
              <span className="text-slate-300 font-mono truncate">{link.cleanedUrl}</span>
            </div>
            <button
              onClick={() => handleCopy(link.cleanedUrl, 'original')}
              className="text-slate-400 hover:text-white shrink-0 p-1"
              title="Salin URL Asli"
            >
              {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Middle Row: QR Code & Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* QR Code Card */}
            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-white mb-3">QR Code Akses Aman</span>
              {qrCodeDataUrl ? (
                <div className="p-2 bg-white rounded-lg shadow-md mb-3">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-36 h-36" />
                </div>
              ) : (
                <div className="w-36 h-36 bg-slate-800 rounded-lg animate-pulse mb-3" />
              )}
              <button
                onClick={downloadQrCode}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </button>
            </div>

            {/* Security Config Card */}
            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3.5 md:col-span-2">
              <span className="text-xs font-semibold text-white block">Konfigurasi Keamanan Aktif</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Mode */}
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                  <span className="text-slate-500 text-[11px] block">Mode Penyamaran:</span>
                  <span className="text-white font-medium capitalize mt-0.5 block">
                    {link.maskMode === 'sandbox' ? 'Stealth Sandbox Frame' : link.maskMode === 'interstitial' ? 'Zero-Trust Interstitial' : 'Direct Redirection'}
                  </span>
                </div>

                {/* PIN */}
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                  <span className="text-slate-500 text-[11px] block">Proteksi PIN:</span>
                  <span className={`font-medium mt-0.5 block ${link.pinProtection?.enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {link.pinProtection?.enabled ? '✓ Terproteksi Sandi PIN' : 'Nonaktif (Akses Langsung)'}
                  </span>
                </div>

                {/* Expiration */}
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                  <span className="text-slate-500 text-[11px] block">Masa Berlaku:</span>
                  <span className="text-white font-medium mt-0.5 block">
                    {link.burnAfterRead
                      ? 'Hancur Setelah 1x Baca (Self-Destruct)'
                      : link.expiresAt
                      ? new Date(link.expiresAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Selamanya Aktif'}
                  </span>
                </div>

                {/* Clicks */}
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                  <span className="text-slate-500 text-[11px] block">Total Akses / Kuota:</span>
                  <span className="text-indigo-400 font-mono font-medium mt-0.5 block tabular-nums">
                    {link.clicksCount} {link.maxClicks ? `/ ${link.maxClicks} klik maks` : 'klik (Tanpa batas)'}
                  </span>
                </div>
              </div>

              {/* Privacy strip badge */}
              <div className="p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pembersih Privasi Aktif: Semua parameter pelacak iklan (UTM, fbclid) otomatis dinetralkan.</span>
              </div>
            </div>
          </div>

          {/* Bottom: Access Logs History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Log Riwayat Akses Real-Time</span>
              <span className="text-xs text-slate-500">{link.accessLogs.length} entri tercatat</span>
            </div>

            {link.accessLogs.length === 0 ? (
              <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Belum ada aktivitas kunjungan pada tautan ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Waktu Akses</th>
                      <th className="py-2.5 px-3">Perangkat</th>
                      <th className="py-2.5 px-3">Browser</th>
                      <th className="py-2.5 px-3">IP (Anonim)</th>
                      <th className="py-2.5 px-3">Status Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {link.accessLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">
                          {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="py-2.5 px-3">{log.device}</td>
                        <td className="py-2.5 px-3">{log.browser}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{log.ipMasked}</td>
                        <td className="py-2.5 px-3">
                          {log.status === 'granted' ? (
                            <span className="text-emerald-400 font-medium">Lolos Akses</span>
                          ) : (
                            <span className="text-red-400 font-medium">PIN Salah</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Management Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (confirm('Yakin ingin menghapus tautan ini secara permanen?')) {
                  onDeleteLink(link.id);
                  onClose();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 p-2 rounded hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Tautan</span>
            </button>

            <button
              onClick={() => onToggleStatus(link.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                link.status === 'active'
                  ? 'border-amber-800/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40'
                  : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              {link.status === 'active' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Jeda Tautan</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Aktifkan Kembali</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
