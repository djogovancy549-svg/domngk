import React, { useState, useId } from 'react';
import { 
  X, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Clock, 
  EyeOff, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';
import { CloakedLink, ExpirationOption, MaskMode } from '../types';
import { auditUrlSecurity, cleanTrackingParameters, hashPin } from '../utils/security';
import { PRESET_VIRTUAL_DOMAINS } from '../utils/storage';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLink: (link: CloakedLink) => void;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  isOpen,
  onClose,
  onSaveLink,
}) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [title, setTitle] = useState('');
  const [virtualDomain, setVirtualDomain] = useState('secure-vault.internal');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [slug, setSlug] = useState('');
  const [maskMode, setMaskMode] = useState<MaskMode>('sandbox');
  
  // Security options
  const [enablePin, setEnablePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [expiration, setExpiration] = useState<ExpirationOption>('7d');
  const [hasClickLimit, setHasClickLimit] = useState(false);
  const [maxClicks, setMaxClicks] = useState<number>(20);
  const [stripTrackers, setStripTrackers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Real-time security audit
  const effectiveUrl = targetUrl.trim();
  const cleanedResult = effectiveUrl ? cleanTrackingParameters(effectiveUrl) : { cleanedUrl: '', removedCount: 0 };
  const auditReport = effectiveUrl ? auditUrlSecurity(stripTrackers ? cleanedResult.cleanedUrl : effectiveUrl) : null;

  const activeDomain = isCustomDomain ? (customDomainInput.trim() || 'my-custom-domain.com') : virtualDomain;
  const activeSlug = slug.trim() || 'secure-link';

  const generateRandomSlug = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 7; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSlug(`sec-${res}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetUrl.trim()) {
      setErrorMsg('Masukkan URL tujuan terlebih dahulu.');
      return;
    }

    let validUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      setErrorMsg('Format URL tidak valid. Pastikan format url sesuai.');
      return;
    }

    if (enablePin && (!pinCode || pinCode.length < 4)) {
      setErrorMsg('PIN Pengaman minimal 4 digit.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalCleanResult = cleanTrackingParameters(validUrl);
      const finalTargetUrl = stripTrackers ? finalCleanResult.cleanedUrl : validUrl;
      const finalAudit = auditUrlSecurity(finalTargetUrl);

      let pinHash = '';
      if (enablePin && pinCode) {
        pinHash = await hashPin(pinCode.trim());
      }

      // Calculate expiration timestamp
      let expiresAt: number | null = null;
      let burnAfterRead = false;
      const now = Date.now();

      if (expiration === '1h') expiresAt = now + 1 * 60 * 60 * 1000;
      else if (expiration === '6h') expiresAt = now + 6 * 60 * 60 * 1000;
      else if (expiration === '24h') expiresAt = now + 24 * 60 * 60 * 1000;
      else if (expiration === '7d') expiresAt = now + 7 * 24 * 60 * 60 * 1000;
      else if (expiration === '30d') expiresAt = now + 30 * 24 * 60 * 60 * 1000;
      else if (expiration === '1view') {
        expiresAt = null;
        burnAfterRead = true;
      }

      const newId = `clk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const derivedTitle = title.trim() || `Tautan Tersembunyi: ${activeDomain}/${activeSlug}`;

      const newLink: CloakedLink = {
        id: newId,
        title: derivedTitle,
        originalUrl: validUrl,
        cleanedUrl: finalTargetUrl,
        virtualDomain: activeDomain.replace(/^https?:\/\//i, ''),
        slug: activeSlug,
        maskMode,
        pinProtection: {
          enabled: enablePin,
          pinHash,
        },
        expiration,
        expiresAt,
        maxClicks: hasClickLimit ? Number(maxClicks) || 10 : null,
        clicksCount: 0,
        burnAfterRead,
        stripTrackers,
        status: 'active',
        createdAt: now,
        lastAccessedAt: null,
        securityReport: finalAudit,
        accessLogs: [],
      };

      onSaveLink(newLink);
      onClose();
    } catch (err) {
      setErrorMsg('Gagal membuat tautan terselubung. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Buat Tautan Domain Virtual Terproteksi</h3>
              <p className="text-xs text-slate-400">Samarkan URL panjang menjadi domain kustom tanpa perlu langganan registrar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. URL Tujuan */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              URL Panjang Asli (Tujuan Tautan) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Contoh: https://docs.google.com/spreadsheets/d/123... or https://mysite.com/article?utm_source=fb"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-xs"
                required
              />
            </div>

            {/* Tracker strip notice & security preview */}
            {effectiveUrl && (
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripTrackers}
                    onChange={(e) => setStripTrackers(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Hapus parameter pelacak pengintai (UTM, fbclid, gclid)</span>
                </label>

                {cleanedResult.removedCount > 0 && stripTrackers && (
                  <span className="text-emerald-400 font-medium">
                    ✓ {cleanedResult.removedCount} tracker dibersihkan
                  </span>
                )}
              </div>
            )}

            {auditReport && (
              <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    auditReport.verdict === 'safe' ? 'bg-emerald-400' : auditReport.verdict === 'caution' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className="text-slate-300">
                    Skor Keamanan URL: <strong className="text-white font-mono">{auditReport.score}/100</strong> ({auditReport.verdict === 'safe' ? 'Aman' : auditReport.verdict === 'caution' ? 'Perhatian' : 'Berisiko'})
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  {auditReport.isHttps ? 'HTTPS Terenkripsi' : 'HTTP Tidak Terenkripsi'}
                </span>
              </div>
            )}
          </div>

          {/* 2. Judul / Catatan Label */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Judul Tautan / Catatan Internal
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dokumen Kontrak Kerja / Portofolio Klien"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 3. Konfigurasi Domain Virtual & Slug */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Penyamaran Domain Virtual
              </span>
              <button
                type="button"
                onClick={() => setIsCustomDomain(!isCustomDomain)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isCustomDomain ? 'Pilih Domain Preset' : '+ Ketik Domain Sendiri'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Domain Input / Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nama Domain Samaran
                </label>
                {isCustomDomain ? (
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="misal: portal.perusahaan-rahasia.internal"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <select
                    value={virtualDomain}
                    onChange={(e) => setVirtualDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {PRESET_VIRTUAL_DOMAINS.map((item) => (
                      <option key={item.domain} value={item.domain}>
                        {item.domain} ({item.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Slug / Alias */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Alias / Path Slug
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomSlug}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Acak
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="laporan-audit-2026"
                    className="w-full pl-6 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Visual URL Preview Box */}
            <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-lg space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 block">
                Tampilan Visual Yang Dilihat Pengunjung (Address Bar Browser):
              </span>
              <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 overflow-x-auto py-1">
                <span className="text-slate-500">https://</span>
                <span className="font-semibold text-white">{activeDomain}</span>
                <span className="text-slate-500">/</span>
                <span className="text-indigo-300 font-semibold">{activeSlug}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                💡 <em>Catatan:</em> Setelah tautan dibuat, aplikasi akan menghasilkan <strong>Tautan Aktif Resmi (Share Link)</strong> berkeamanan tinggi yang 100% bisa dibuka oleh siapa saja di email atau HP mana pun tanpa perlu membeli domain di reseller.
              </p>
            </div>
          </div>

          {/* 4. Mode Penyamaran (Cloaking Engine) */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Metode Penyamaran (Masking Engine)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Sandbox Browser View */}
              <div
                onClick={() => setMaskMode('sandbox')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  maskMode === 'sandbox'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">Stealth Sandbox Frame</span>
                  <ShieldCheck className={`w-4 h-4 ${maskMode === 'sandbox' ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Menampilkan website di dalam frame browser virtual dengan address bar domain kustom.
                </p>
              </div>

              {/* Option 2: Zero-Trust Interstitial Gateway */}
              <div
                onClick={() => setMaskMode('interstitial')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  maskMode === 'interstitial'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">Security Interstitial</span>
                  <Shield className={`w-4 h-4 ${maskMode === 'interstitial' ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Layar audit keamanan ala Cloudflare sebelum mengarahkan ke link asli secara aman.
                </p>
              </div>

              {/* Option 3: Direct Disguise */}
              <div
                onClick={() => setMaskMode('direct')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  maskMode === 'direct'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">Direct Masked Route</span>
                  <ExternalLink className={`w-4 h-4 ${maskMode === 'direct' ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Redirect instan tanpa membocorkan HTTP Referrer atau jejak asal pengunjung.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Keamanan Tingkat Tinggi (Security Suite) */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-4">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Fitur Keamanan Tinggi & Hak Akses
            </span>

            {/* PIN Protection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Kunci Kata Sandi / PIN Akses
                </label>
                <p className="text-[11px] text-slate-400">Pengunjung wajib memasukkan PIN untuk membuka tautan</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enablePin}
                  onChange={(e) => setEnablePin(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                {enablePin && (
                  <input
                    type="password"
                    maxLength={8}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="PIN 4-8 digit"
                    className="w-28 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono text-center tracking-widest focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Expiration Timer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
              <div>
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Masa Berlaku Tautan (Auto Expire)
                </label>
                <p className="text-[11px] text-slate-400">Tautan akan otomatis terkunci setelah waktu habis</p>
              </div>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as ExpirationOption)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="1h">1 Jam</option>
                <option value="6h">6 Jam</option>
                <option value="24h">24 Jam (1 Hari)</option>
                <option value="7d">7 Hari (1 Minggu)</option>
                <option value="30d">30 Hari</option>
                <option value="1view">Hancur Setelah 1x Dilihat (Burn After Read)</option>
                <option value="never">Tidak Pernah Kedaluwarsa</option>
              </select>
            </div>

            {/* Click limit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
              <div>
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  Batas Maksimal Klik (Click Quota)
                </label>
                <p className="text-[11px] text-slate-400">Nonaktifkan link jika jumlah klik tercapai</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasClickLimit}
                  onChange={(e) => setHasClickLimit(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                {hasClickLimit && (
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono text-center focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Memproses Enkripsi...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Buat & Samarkan Tautan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
