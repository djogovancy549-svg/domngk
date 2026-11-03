import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Shield
} from 'lucide-react';
import { auditUrlSecurity, cleanTrackingParameters, isKnownFrameRestrictedDomain } from '../utils/security';
import { SecurityReport } from '../types';

interface SecurityAuditorProps {
  onQuickCloak: (url: string) => void;
}

export const SecurityAuditor: React.FC<SecurityAuditorProps> = ({ onQuickCloak }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleAudit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsAuditing(true);
    setTimeout(() => {
      const result = auditUrlSecurity(inputUrl);
      setReport(result);
      setIsAuditing(false);
    }, 250);
  };

  const sampleTargets = [
    'https://drive.google.com/drive/folders/1a2b3c?utm_source=facebook&utm_medium=cpc&fbclid=IwAR999',
    'https://wikipedia.org/wiki/Computer_security',
    'http://192.168.1.1/admin-login-verify',
  ];

  const frameInfo = report ? isKnownFrameRestrictedDomain(report.originalCleanUrl) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span>Audit Keamanan & Forensik URL</span>
        </h2>
        <p className="text-xs text-slate-400">
          Uji tingkat keamanan tautan sebelum Anda menyamarkannya. Deteksi serangan homoglyph punycode, pelacak pengintai, dan kerentanan SSL.
        </p>
      </div>

      {/* Audit Input Form */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-xl">
        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Tempelkan URL panjang untuk dianalisis (contoh: https://...)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isAuditing || !inputUrl.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {isAuditing ? 'Menganalisis...' : 'Mulai Audit Keamanan'}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">Uji Cepat Contoh:</span>
          {sampleTargets.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputUrl(s);
                const result = auditUrlSecurity(s);
                setReport(result);
              }}
              className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              Contoh #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {report && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
          {/* Top Score Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xl border ${
                report.verdict === 'safe'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : report.verdict === 'caution'
                  ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                  : 'bg-red-950/40 text-red-400 border-red-500/30'
              }`}>
                <span>{report.score}</span>
                <span className="text-[10px] font-sans font-normal opacity-80">/ 100</span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  {report.verdict === 'safe'
                    ? 'Tautan Memenuhi Standar Keamanan'
                    : report.verdict === 'caution'
                    ? 'Tautan Memerlukan Perhatian'
                    : 'Tautan Memiliki Risiko Tinggi'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {report.verdict === 'safe'
                    ? 'Tautan aman untuk disamarkan dan dibagikan ke pengunjung.'
                    : 'Ditemukan beberapa anomali atau pelacak yang disarankan dibersihkan.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onQuickCloak(report.originalCleanUrl)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <span>Samarkan URL Ini Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Detailed Security Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* HTTPS */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Protokol SSL/TLS</span>
              <span className={`text-xs font-medium mt-1 flex items-center gap-1.5 ${report.isHttps ? 'text-emerald-400' : 'text-red-400'}`}>
                {report.isHttps ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {report.isHttps ? 'HTTPS Terenkripsi' : 'HTTP Polos (Tidak Aman)'}
              </span>
            </div>

            {/* Homograph / Punycode */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Punycode / Homograph</span>
              <span className={`text-xs font-medium mt-1 flex items-center gap-1.5 ${!report.isPunycode ? 'text-emerald-400' : 'text-red-400'}`}>
                {!report.isPunycode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {!report.isPunycode ? 'Domain Normal (Aman)' : 'Indikasi Kloning (Punycode)'}
              </span>
            </div>

            {/* Host Type */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Tipe Host Domain</span>
              <span className={`text-xs font-medium mt-1 flex items-center gap-1.5 ${!report.isIpHost ? 'text-emerald-400' : 'text-amber-400'}`}>
                {!report.isIpHost ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {!report.isIpHost ? 'Domain FQDN Resmi' : 'Host Alamat IP Mentah'}
              </span>
            </div>

            {/* Trackers removed */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Parameter Pelacak</span>
              <span className={`text-xs font-medium mt-1 flex items-center gap-1.5 ${report.removedTrackersCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {report.removedTrackersCount === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {report.removedTrackersCount === 0 ? 'Bersih dari Tracker' : `${report.removedTrackersCount} Tracker Terdeteksi`}
              </span>
            </div>
          </div>

          {/* Issues and Recommendations */}
          <div className="space-y-4 pt-2">
            {report.issues.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Temuan Analisis Keamanan:</span>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {report.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cleaned version preview */}
            {report.removedTrackersCount > 0 && (
              <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-lg space-y-1">
                <span className="text-[11px] font-semibold text-emerald-400 block">
                  Hasil Pembersihan Privasi CloakURL (Siap Disamarkan):
                </span>
                <p className="text-xs font-mono text-slate-300 break-all">
                  {report.originalCleanUrl}
                </p>
              </div>
            )}

            {/* Frame capability note */}
            {frameInfo?.isRestricted && (
              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-lg text-xs text-indigo-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Catatan Mode: Domain ini menerapkan header <em>X-Frame-Options: SAMEORIGIN</em>. Saat disamarkan, disarankan memilih <strong>Mode Security Interstitial</strong> untuk pengalaman terbaik.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
