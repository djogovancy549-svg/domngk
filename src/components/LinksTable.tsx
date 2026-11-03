import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Clock, 
  MoreVertical, 
  Play, 
  Pause, 
  Trash2, 
  QrCode, 
  ShieldCheck, 
  Plus, 
  Download, 
  Upload,
  Globe,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { CloakedLink } from '../types';
import { buildShareableUrl, buildVirtualDisplayUrl } from '../utils/storage';

interface LinksTableProps {
  links: CloakedLink[];
  onOpenCreateModal: () => void;
  onOpenDetailsModal: (link: CloakedLink) => void;
  onTestLink: (link: CloakedLink) => void;
  onToggleStatus: (id: string) => void;
  onDeleteLink: (id: string) => void;
  onExportJson: () => void;
  onImportJson: (imported: CloakedLink[]) => void;
}

export const LinksTable: React.FC<LinksTableProps> = ({
  links,
  onOpenCreateModal,
  onOpenDetailsModal,
  onTestLink,
  onToggleStatus,
  onDeleteLink,
  onExportJson,
  onImportJson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pin' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (link: CloakedLink, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = buildShareableUrl(link);
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as CloakedLink[];
        if (Array.isArray(parsed)) {
          onImportJson(parsed);
        } else {
          alert('Format berkas cadangan JSON tidak sesuai.');
        }
      } catch {
        alert('Gagal membaca berkas cadangan.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const now = Date.now();

  const filteredLinks = links.filter((link) => {
    const isExpired = link.expiresAt ? now > link.expiresAt : false;
    const isDepleted = link.status === 'depleted' || (link.maxClicks !== null && link.clicksCount >= link.maxClicks);

    // Search filter
    const matchesSearch =
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.virtualDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status tab filter
    if (statusFilter === 'active') {
      return link.status === 'active' && !isExpired && !isDepleted;
    }
    if (statusFilter === 'pin') {
      return link.pinProtection?.enabled;
    }
    if (statusFilter === 'expired') {
      return isExpired || isDepleted || link.status === 'paused';
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Control Bar: Search + Filter Tabs + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari domain virtual, alias slug, atau judul..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Segmented Controls (Interactive buttons) & Backup actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({links.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('pin')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'pin'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kunci PIN
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'expired'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kedaluwarsa/Jeda
            </button>
          </div>

          {/* Backup Export / Import */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExportJson}
              title="Ekspor Cadangan JSON"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor</span>
            </button>

            <label
              title="Impor Cadangan JSON"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Impor</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Links High Density Table */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800/80 flex items-center justify-center">
            <Globe className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Tidak ada tautan ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Tidak ada tautan yang cocok dengan kata kunci pencarian Anda.'
                : 'Mulai samarkan URL panjang menjadi domain kustom dengan keamanan tingkat tinggi sekarang.'}
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Tautan Samaran Pertama</span>
          </button>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Tautan Penyamar (Domain Virtual)</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Mode & Proteksi</th>
                  <th className="py-3 px-4 text-center">Total Akses</th>
                  <th className="py-3 px-4 hidden md:table-cell">Masa Berlaku</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredLinks.map((link) => {
                  const isLinkExpired = link.expiresAt ? now > link.expiresAt : false;
                  const isLinkDepleted = link.status === 'depleted' || (link.maxClicks !== null && link.clicksCount >= link.maxClicks);
                  const displayVirtual = buildVirtualDisplayUrl(link);

                  return (
                    <tr
                      key={link.id}
                      onClick={() => onOpenDetailsModal(link)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Virtual URL & Title */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                            {link.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 truncate">
                          <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{displayVirtual}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-1">
                          Tujuan: {link.cleanedUrl}
                        </div>
                      </td>

                      {/* Mode & Protection metadata (Clean unboxed text with dots) */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <div className="flex flex-col gap-1 text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 capitalize">
                              {link.maskMode === 'sandbox' ? 'Stealth Frame' : link.maskMode === 'interstitial' ? 'Zero-Trust Shield' : 'Direct Cloak'}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            {link.pinProtection?.enabled ? (
                              <span className="text-indigo-400 font-medium flex items-center gap-1">
                                <Lock className="w-3 h-3" /> PIN Aktif
                              </span>
                            ) : (
                              <span className="text-slate-500">Tanpa PIN</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span>Score: {link.securityReport.score}/100</span>
                            <span aria-hidden="true">·</span>
                            <span>{link.stripTrackers ? 'Anti-Track' : 'Normal'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Clicks count (Tabular figures) */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono tabular-nums text-white font-medium text-sm">
                          {link.clicksCount}
                        </span>
                        {link.maxClicks && (
                          <span className="block text-[10px] text-slate-500 font-mono">
                            / {link.maxClicks} maks
                          </span>
                        )}
                      </td>

                      {/* Expiration status */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="text-[11px]">
                          {link.burnAfterRead ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Hancur 1x Baca
                            </span>
                          ) : link.expiresAt ? (
                            <span className={isLinkExpired ? 'text-red-400' : 'text-slate-300'}>
                              {isLinkExpired ? 'Kedaluwarsa' : new Date(link.expiresAt).toLocaleDateString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Permanen</span>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {link.status === 'paused' ? 'Dijeda' : isLinkExpired ? 'Expired' : isLinkDepleted ? 'Habis' : 'Aktif'}
                          </div>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleCopyLink(link, e)}
                            title="Salin Tautan Shareable"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onTestLink(link)}
                            title="Buka / Uji Gateway Penyamar"
                            className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 rounded transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenDetailsModal(link)}
                            title="Detail & QR Code"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
