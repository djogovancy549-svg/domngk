import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  RotateCw, 
  FolderLock, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertCircle,
  HardDrive,
  LogOut,
  UserCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CloakedLink } from '../types';
import { ClientSubscription, InvoiceRecord, GoogleSyncMetadata } from '../types/business';
import { 
  googleSignIn, 
  getCachedAccessToken, 
  logoutGoogle, 
  setCachedAccessToken 
} from '../services/firebaseAuth';
import { 
  createOrFindDatabaseSpreadsheet, 
  syncAllToGoogleSheets, 
  createOrFindDriveBackupFolder, 
  saveSnapshotToDrive 
} from '../services/googleSheetsDrive';

interface GoogleWorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  links: CloakedLink[];
  clients: ClientSubscription[];
  invoices: InvoiceRecord[];
  syncMetadata: GoogleSyncMetadata;
  onSyncCompleted: (meta: GoogleSyncMetadata) => void;
}

export const GoogleWorkspaceSyncModal: React.FC<GoogleWorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  links,
  clients,
  invoices,
  syncMetadata,
  onSyncCompleted,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSignInGoogle = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      onUserChanged(res.user);
      setStatusMessage({
        type: 'success',
        text: `Berhasil terhubung dengan Google Workspace (${res.user.email}).`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal login ke Google Workspace. Silakan coba kembali.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOutGoogle = async () => {
    await logoutGoogle();
    onUserChanged(null);
    setStatusMessage({ type: 'info', text: 'Telah keluar dari akun Google Workspace.' });
  };

  const handleSyncToSheets = async () => {
    setStatusMessage(null);
    let token = getCachedAccessToken();

    // If no in-memory token, prompt user to connect first
    if (!currentUser || !token) {
      try {
        const res = await googleSignIn();
        onUserChanged(res.user);
        token = res.accessToken;
      } catch {
        setStatusMessage({ type: 'error', text: 'Perlu otorisasi Google untuk menyinkronkan spreadsheet.' });
        return;
      }
    }

    // Explicit confirmation dialog per Workspace Integration rules
    const confirmed = window.confirm(
      `Apakah Anda ingin memperbarui database di Google Sheets? Data (${links.length} tautan, ${clients.length} klien, ${invoices.length} invoice) akan disinkronkan ke spreadsheet.`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const sheet = await createOrFindDatabaseSpreadsheet(token);
      await syncAllToGoogleSheets(token, sheet.id, links, clients, invoices);

      const updatedMeta: GoogleSyncMetadata = {
        ...syncMetadata,
        spreadsheetId: sheet.id,
        spreadsheetUrl: sheet.url,
        lastSyncedAt: Date.now(),
        syncedRowCount: links.length + clients.length + invoices.length,
      };

      onSyncCompleted(updatedMeta);
      setStatusMessage({
        type: 'success',
        text: `Berhasil menyinkronkan data ke Google Sheets ("CloakURL_Business_Database")!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menyinkronkan ke Google Sheets.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackupToDrive = async () => {
    setStatusMessage(null);
    let token = getCachedAccessToken();

    if (!currentUser || !token) {
      try {
        const res = await googleSignIn();
        onUserChanged(res.user);
        token = res.accessToken;
      } catch {
        setStatusMessage({ type: 'error', text: 'Perlu otorisasi Google untuk membuat backup di Google Drive.' });
        return;
      }
    }

    const confirmed = window.confirm(
      'Apakah Anda ingin membuat file cadangan snapshot JSON terenkripsi baru di folder Google Drive Anda?'
    );
    if (!confirmed) return;

    setIsBackingUp(true);
    try {
      const folder = await createOrFindDriveBackupFolder(token);
      const snapshotPayload = {
        exportedAt: new Date().toISOString(),
        businessName: 'CloakURL Local Business SaaS',
        version: '1.0',
        links,
        clients,
        invoices,
      };

      const backupFile = await saveSnapshotToDrive(token, folder.id, snapshotPayload);

      const updatedMeta: GoogleSyncMetadata = {
        ...syncMetadata,
        driveFolderId: folder.id,
        driveFolderUrl: folder.url,
        lastSyncedAt: Date.now(),
      };

      onSyncCompleted(updatedMeta);
      setStatusMessage({
        type: 'success',
        text: `Berkas cadangan "${backupFile.fileName}" berhasil disimpan di folder Google Drive!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menyimpan cadangan ke Google Drive.',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Database Google Sheets & Google Drive</h3>
              <p className="text-xs text-slate-400">Penyimpanan awan terenkripsi berkeamanan tinggi untuk bisnis Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/40 border-red-800/80 text-red-300'
                  : 'bg-indigo-950/40 border-indigo-800/80 text-indigo-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Account Connection Status */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-10 h-10 rounded-full border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div>
                <span className="text-xs font-semibold text-white block">
                  {currentUser ? currentUser.displayName || 'Akun Google Terhubung' : 'Google Workspace Belum Terhubung'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentUser ? currentUser.email : 'Hubungkan akun Google Anda untuk mengaktifkan database Sheets & Drive'}
                </span>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={handleSignOutGoogle}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan</span>
              </button>
            ) : (
              <button
                onClick={handleSignInGoogle}
                disabled={isLoggingIn}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Google Sheets Database Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Google Sheets Database</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Menyimpan tabel <strong>Tautan Virtual</strong>, <strong>Langganan Klien</strong>, dan <strong>Riwayat Invoice</strong> secara terstruktur di Spreadsheet Anda.
                </p>
                {syncMetadata.lastSyncedAt && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    Sinkron terakhir: {new Date(syncMetadata.lastSyncedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSyncToSheets}
                  disabled={isSyncing}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Google Sheets'}</span>
                </button>

                {syncMetadata.spreadsheetUrl && (
                  <a
                    href={syncMetadata.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Buka Spreadsheet Google</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>

            {/* 2. Google Drive Automated Backups Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
                  <FolderLock className="w-4 h-4" />
                  <span>Google Drive Snapshot Backup</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Menyimpan file snapshot cadangan terenkripsi ke dalam folder <strong>"CloakURL_Database_Backups"</strong> di Google Drive Anda.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleBackupToDrive}
                  disabled={isBackingUp}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{isBackingUp ? 'Menyimpan Backup...' : 'Simpan Backup ke Google Drive'}</span>
                </button>

                {syncMetadata.driveFolderUrl && (
                  <a
                    href={syncMetadata.driveFolderUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Buka Folder Google Drive</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Security & Least Privilege Statement */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Standar Keamanan Tinggi Google Workspace</span>
            </div>
            <p className="leading-relaxed">
              Aplikasi menggunakan prinsip <em>Least Privilege</em>: izin dibatasi hanya pada file spreadsheet dan folder yang dibuat khusus oleh aplikasi ini (<code>drive.file</code> dan <code>spreadsheets</code>). Token akses hanya disimpan sementara di memori RAM dan tidak pernah dibocorkan ke server luar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
