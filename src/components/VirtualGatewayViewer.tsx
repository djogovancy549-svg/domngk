import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertOctagon, 
  ExternalLink, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ArrowLeft, 
  Check, 
  Copy, 
  ShieldAlert, 
  Flame, 
  Fingerprint,
  Info
} from 'lucide-react';
import { CloakedLink } from '../types';
import { hashPin, isKnownFrameRestrictedDomain } from '../utils/security';
import { buildVirtualDisplayUrl } from '../utils/storage';

interface VirtualGatewayViewerProps {
  link: CloakedLink;
  onBackToDashboard: () => void;
  onLinkUpdated: (updatedLink: CloakedLink) => void;
}

export const VirtualGatewayViewer: React.FC<VirtualGatewayViewerProps> = ({
  link,
  onBackToDashboard,
  onLinkUpdated,
}) => {
  // Security gate states
  const [isUnlocked, setIsUnlocked] = useState(!link.pinProtection?.enabled);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Viewer states
  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState(3);
  const [frameLoadError, setFrameLoadError] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check expiration & quotas
  const now = Date.now();
  const isExpired = link.expiresAt ? now > link.expiresAt : false;
  const isQuotaExceeded = link.maxClicks !== null ? link.clicksCount >= link.maxClicks : false;
  const isBlocked = link.status === 'paused' || isExpired || isQuotaExceeded || link.status === 'depleted';

  // Handle lockout countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  // Handle Interstitial auto-redirect countdown
  useEffect(() => {
    if (isUnlocked && !isBlocked && link.maskMode === 'interstitial' && interstitialCountdown > 0) {
      const timer = setTimeout(() => {
        setInterstitialCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, isBlocked, link.maskMode, interstitialCountdown]);

  // Handle direct mode redirect
  useEffect(() => {
    if (isUnlocked && !isBlocked && link.maskMode === 'direct') {
      window.location.replace(link.cleanedUrl);
    }
  }, [isUnlocked, isBlocked, link.maskMode, link.cleanedUrl]);

  // Check known frame restricted domains (e.g. google.com, youtube.com)
  const restrictionInfo = isKnownFrameRestrictedDomain(link.cleanedUrl);

  const recordAccess = (status: 'granted' | 'blocked_pin' | 'expired' | 'limit_reached') => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      device: deviceType as 'Desktop' | 'Mobile' | 'Tablet',
      browser: navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : navigator.userAgent.includes('Safari')
        ? 'Safari'
        : navigator.userAgent.includes('Firefox')
        ? 'Firefox'
        : 'Browser Web',
      status,
      ipMasked: `103.${Math.floor(Math.random() * 200) + 50}.xxx.${Math.floor(Math.random() * 90) + 10}`,
    };

    const newClicks = status === 'granted' ? link.clicksCount + 1 : link.clicksCount;
    let newStatus = link.status;
    if (status === 'granted' && link.burnAfterRead) {
      newStatus = 'depleted';
    } else if (link.maxClicks !== null && newClicks >= link.maxClicks) {
      newStatus = 'depleted';
    }

    const updated: CloakedLink = {
      ...link,
      clicksCount: newClicks,
      status: newStatus,
      lastAccessedAt: Date.now(),
      accessLogs: [newLog, ...link.accessLogs.slice(0, 49)],
    };

    onLinkUpdated(updated);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    if (!pinInput.trim()) return;

    setIsVerifying(true);
    setPinError('');

    try {
      const hashedInput = await hashPin(pinInput.trim());
      if (hashedInput === link.pinProtection?.pinHash) {
        setIsUnlocked(true);
        recordAccess('granted');
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        recordAccess('blocked_pin');

        if (nextAttempts >= 3) {
          setLockoutTimer(30);
          setPinError('PIN salah 3 kali. Akses terkunci selama 30 detik untuk pencegahan brute-force.');
        } else {
          setPinError(`PIN salah. Sisa kesempatan: ${3 - nextAttempts}x.`);
        }
      }
    } catch {
      setPinError('Gagal memverifikasi PIN.');
    } finally {
      setIsVerifying(false);
      setPinInput('');
    }
  };

  const handleCopyVirtualUrl = () => {
    navigator.clipboard.writeText(buildVirtualDisplayUrl(link));
    setHasCopiedUrl(true);
    setTimeout(() => setHasCopiedUrl(false), 2000);
  };

  const virtualUrl = buildVirtualDisplayUrl(link);

  // 1. LINK BLOCKED / EXPIRED SCREEN
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center">
            <AlertOctagon className="w-7 h-7 text-red-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">Tautan Tidak Tersedia</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {link.status === 'paused'
                ? 'Tautan ini telah dinonaktifkan sementara oleh pemilik.'
                : link.burnAfterRead
                ? 'Tautan ini dikonfigurasi "Hancur Setelah 1x Baca" dan telah dibuka sebelumnya.'
                : isExpired
                ? 'Masa aktif tautan telah berakhir demi standar keamanan.'
                : isQuotaExceeded
                ? 'Batas maksimal kuota klik untuk tautan ini telah tercapai.'
                : 'Tautan telah ditutup secara permanen.'}
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-left text-xs space-y-1">
            <div className="text-slate-500">Domain Virtual:</div>
            <div className="text-slate-200 font-mono truncate">{virtualUrl}</div>
          </div>

          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor CloakURL</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. PIN LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-7 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Tautan Terlindungi PIN</h2>
            <p className="text-xs text-slate-400 mt-1">
              Pemilik tautan mewajibkan kode otentikasi untuk membuka konten ini.
            </p>
          </div>

          {/* Virtual domain identity badge */}
          <div className="p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 truncate flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{virtualUrl}</span>
          </div>

          {pinError && (
            <div className="p-2.5 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300">
              {pinError}
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                disabled={lockoutTimer > 0 || isVerifying}
                placeholder="Masukkan PIN"
                autoFocus
                className="w-full py-3 px-4 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              {lockoutTimer > 0 && (
                <p className="text-[11px] text-amber-400 mt-1.5 font-mono">
                  Tunggu {lockoutTimer} detik sebelum mencoba lagi...
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={lockoutTimer > 0 || isVerifying || !pinInput}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Buka Enkripsi Tautan</span>
            </button>
          </form>

          <button
            onClick={onBackToDashboard}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Kembali ke Dasbor
          </button>
        </div>
      </div>
    );
  }

  // 3. ZERO-TRUST INTERSTITIAL GATEWAY SCREEN
  if (link.maskMode === 'interstitial') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle top scanline */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500 animate-pulse" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Pemeriksaan Keamanan Zero-Trust</h2>
                <span className="text-xs text-emerald-400">Tautan Terverifikasi Aman</span>
              </div>
            </div>

            <button
              onClick={onBackToDashboard}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800"
            >
              Dasbor
            </button>
          </div>

          {/* Virtual Domain Identity */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-500 mb-1">Domain Virtual Penyamar:</div>
            <div className="text-sm font-mono text-white flex items-center justify-between">
              <span className="truncate">{virtualUrl}</span>
              <button
                onClick={handleCopyVirtualUrl}
                className="text-slate-400 hover:text-white p-1"
                title="Salin Virtual URL"
              >
                {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Security Checklist */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
              <span className="text-slate-300">Enkripsi SSL / TLS:</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 256-bit Valid
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
              <span className="text-slate-300">Penyaringan Pelacak (Anti-Tracking):</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> UTM & Ad-Tags Dihapus
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
              <span className="text-slate-300">Proteksi Kebocoran Referrer:</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> No-Referrer Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5">
              <span className="text-slate-300">Skor Reputasi Tautan:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {link.securityReport.score}/100
              </span>
            </div>
          </div>

          {/* Action button & countdown */}
          <div className="pt-3 space-y-3">
            <a
              href={link.cleanedUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Lanjutkan ke Situs Tujuan</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <p className="text-[11px] text-slate-500 text-center">
              Mengarahkan otomatis dalam <span className="font-mono text-slate-300 font-bold">{interstitialCountdown}s</span>...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. STEALTH SANDBOX FRAME VIEW (Simulated Browser Omnibox with Custom Virtual Domain)
  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Simulated Browser Navigation Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0 shadow-md">
        {/* Left: Window Controls + Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dasbor</span>
          </button>

          {/* Window dots */}
          <div className="hidden md:flex items-center gap-1.5 ml-1">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
        </div>

        {/* Center: The Simulated Address Bar (Shows Virtual Domain) */}
        <div className="flex-1 max-w-2xl mx-auto flex items-center">
          <div className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 overflow-hidden">
              <span title="SSL Terenkripsi Valid">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </span>
              <span className="text-xs font-mono text-slate-300 truncate select-all">
                {virtualUrl}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyVirtualUrl}
                title="Salin Virtual URL"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              >
                {hasCopiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setIframeKey((prev) => prev + 1)}
                title="Muat Ulang Frame"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Device frame switcher & fullscreen & open external */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Responsive Device Viewport Switcher */}
          <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => setDeviceFrame('desktop')}
              title="Tampilan Desktop (100%)"
              className={`p-1.5 rounded ${deviceFrame === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              title="Tampilan Tablet (768px)"
              className={`p-1.5 rounded ${deviceFrame === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('mobile')}
              title="Tampilan Smartphone (390px)"
              className={`p-1.5 rounded ${deviceFrame === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={link.cleanedUrl}
            target="_blank"
            rel="noreferrer noopener"
            title="Buka Langsung di Tab Baru (Proteksi No-Referrer)"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Frame Restricted or Google Permission Notice Banner */}
      {restrictionInfo.isRestricted && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Situs tujuan (<strong>{restrictionInfo.domainName}</strong>) memiliki kebijakan keamanan ketat. Jika muncul <em>Google 403</em> atau frame kosong, pastikan izin file disetel <strong>"Siapa saja yang memiliki link"</strong>.
            </span>
          </div>
          <a
            href={link.cleanedUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shrink-0 flex items-center justify-center gap-1.5 shadow"
          >
            <span>Buka Langsung di Tab Baru</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Frame Viewport Container */}
      <div className="flex-1 bg-slate-950 p-2 sm:p-4 flex items-center justify-center overflow-auto">
        <div
          className={`h-full transition-all duration-300 rounded-lg overflow-hidden border border-slate-800 shadow-2xl bg-white flex flex-col ${
            deviceFrame === 'desktop'
              ? 'w-full'
              : deviceFrame === 'tablet'
              ? 'w-[768px] max-w-full'
              : 'w-[390px] max-w-full'
          }`}
          style={{ minHeight: 'calc(100vh - 120px)' }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={link.cleanedUrl}
            title={link.title}
            className="w-full h-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            onError={() => setFrameLoadError(true)}
          />
        </div>
      </div>
    </div>
  );
};
