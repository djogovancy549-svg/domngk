import React from 'react';
import { ShieldCheck, Plus, Sparkles, Compass, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'business' | 'auditor' | 'guide';
  onSelectTab: (tab: 'dashboard' | 'business' | 'auditor' | 'guide') => void;
  onOpenCreateModal: () => void;
  onOpenGoogleSync: () => void;
  linksCount: number;
  clientsCount: number;
  hasGoogleUser: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
  onOpenGoogleSync,
  linksCount,
  clientsCount,
  hasGoogleUser,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (Single text element wordmark + clean icon) */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            Cloak<span className="text-indigo-400">URL</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed, hover underline/state) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'dashboard'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Dasbor Tautan ({linksCount})
          </button>

          <button
            onClick={() => onSelectTab('business')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              currentTab === 'business'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <span>Bisnis & Klien ({clientsCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('auditor')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              currentTab === 'auditor'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Forensik</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              currentTab === 'guide'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cara Kerja</span>
          </button>
        </nav>

        {/* Zone 3: Google Sheets/Drive Sync indicator + Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenGoogleSync}
            title="Database Google Sheets & Drive"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              hasGoogleUser
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${hasGoogleUser ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span className="hidden sm:inline">Google Database</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/25 transition-all whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tautan Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
