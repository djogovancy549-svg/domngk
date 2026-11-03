/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Lock, 
  Eye, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Shield,
  Layers,
  Flame,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CloakedLink } from './types';
import { 
  ClientSubscription, 
  InvoiceRecord, 
  GoogleSyncMetadata, 
  SubscriptionTier, 
  BillingCycle,
  SUBSCRIPTION_PLANS
} from './types/business';
import { getInitialLinks, saveLinks, exportLinksToJson, decodeTokenToLink } from './utils/storage';
import { 
  getInitialClients, 
  saveClients, 
  getInitialInvoices, 
  saveInvoices, 
  getSyncMetadata, 
  saveSyncMetadata 
} from './utils/businessStorage';
import { initAuth, auth, setCachedAccessToken } from './services/firebaseAuth';
import { Header } from './components/Header';
import { LinksTable } from './components/LinksTable';
import { CreateLinkModal } from './components/CreateLinkModal';
import { LinkDetailsModal } from './components/LinkDetailsModal';
import { VirtualGatewayViewer } from './components/VirtualGatewayViewer';
import { SecurityAuditor } from './components/SecurityAuditor';
import { KnowledgeGuide } from './components/KnowledgeGuide';
import { ClientBillingManager } from './components/ClientBillingManager';
import { GoogleWorkspaceSyncModal } from './components/GoogleWorkspaceSyncModal';
import { PricingCalculatorModal } from './components/PricingCalculatorModal';

export default function App() {
  const [links, setLinks] = useState<CloakedLink[]>([]);
  const [clients, setClients] = useState<ClientSubscription[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [syncMetadata, setSyncMetadata] = useState<GoogleSyncMetadata>(getSyncMetadata());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'business' | 'auditor' | 'guide'>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedLinkForDetails, setSelectedLinkForDetails] = useState<CloakedLink | null>(null);
  const [activeGatewayLink, setActiveGatewayLink] = useState<CloakedLink | null>(null);
  const [prefilledAuditUrl, setPrefilledAuditUrl] = useState('');

  // 1. Initialize data from storage & listen for Google Auth
  useEffect(() => {
    getInitialLinks().then((initial) => {
      setLinks(initial);
      checkHashRoute(initial);
    });

    setClients(getInitialClients());
    setInvoices(getInitialInvoices());
    setSyncMetadata(getSyncMetadata());

    // Listen for auth state
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setCachedAccessToken(token);
      },
      () => {
        if (auth.currentUser) {
          setCurrentUser(auth.currentUser);
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 2. Hash routing detector: e.g. #/v/:domain/:slug?p=:token
  const checkHashRoute = (currentLinks: CloakedLink[]) => {
    const hash = window.location.hash;
    if (hash.startsWith('#/v/')) {
      const pathAndQuery = hash.replace('#/v/', '');
      const [pathPart, queryPart] = pathAndQuery.split('?');
      const parts = pathPart.split('/');
      const domain = parts[0] ? decodeURIComponent(parts[0]) : '';
      const slug = parts[1] ? decodeURIComponent(parts[1]) : '';

      // Check if portable token exists in query string
      let tokenFromQuery: string | null = null;
      if (queryPart) {
        const qParams = new URLSearchParams(queryPart);
        tokenFromQuery = qParams.get('p') || qParams.get('d');
      }

      // 1. Try finding in current stored links
      let targetLink = currentLinks.find(
        (l) => l.virtualDomain.toLowerCase() === domain.toLowerCase() && l.slug.toLowerCase() === slug.toLowerCase()
      );

      // 2. If not found in local memory (e.g. opened from another email or device!), decode from portable token!
      if (!targetLink && tokenFromQuery) {
        const decoded = decodeTokenToLink(tokenFromQuery);
        if (decoded) {
          targetLink = decoded;
          // Cache it so it appears in recent session
          setLinks((prev) => [decoded, ...prev.filter((p) => p.id !== decoded.id)]);
        }
      }

      if (targetLink) {
        setActiveGatewayLink(targetLink);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      checkHashRoute(links);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [links]);

  // Handlers for Links
  const handleSaveNewLink = (newLink: CloakedLink) => {
    const updated = [newLink, ...links];
    setLinks(updated);
    saveLinks(updated);
    setSelectedLinkForDetails(newLink);
  };

  const handleUpdateLink = (updatedLink: CloakedLink) => {
    const updated = links.map((l) => (l.id === updatedLink.id ? updatedLink : l));
    setLinks(updated);
    saveLinks(updated);
    if (activeGatewayLink?.id === updatedLink.id) {
      setActiveGatewayLink(updatedLink);
    }
    if (selectedLinkForDetails?.id === updatedLink.id) {
      setSelectedLinkForDetails(updatedLink);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = links.map((l) => {
      if (l.id === id) {
        return {
          ...l,
          status: l.status === 'active' ? ('paused' as const) : ('active' as const),
        };
      }
      return l;
    });
    setLinks(updated);
    saveLinks(updated);
  };

  const handleDeleteLink = (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    saveLinks(updated);
    if (selectedLinkForDetails?.id === id) {
      setSelectedLinkForDetails(null);
    }
  };

  const handleImportJson = (imported: CloakedLink[]) => {
    setLinks(imported);
    saveLinks(imported);
    alert(`Berhasil mengimpor ${imported.length} tautan terselubung.`);
  };

  const handleQuickCloakFromAuditor = (url: string) => {
    setPrefilledAuditUrl(url);
    setIsCreateModalOpen(true);
  };

  const handleExitGateway = () => {
    setActiveGatewayLink(null);
    if (window.location.hash.startsWith('#/v/')) {
      window.location.hash = '';
    }
  };

  // Handlers for Clients & Billing
  const handleAddClient = (newClient: ClientSubscription) => {
    const updated = [newClient, ...clients];
    setClients(updated);
    saveClients(updated);

    // Create first invoice for this client
    const newInvoice: InvoiceRecord = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      clientId: newClient.id,
      clientName: newClient.clientName,
      businessName: newClient.businessName,
      phoneWhatsapp: newClient.phoneWhatsapp,
      amount: newClient.monthlyRate,
      periodLabel: newClient.billingCycle === 'annual_paid_monthly'
        ? 'Bulan ke-1 dari Kontrak 1 Tahun'
        : 'Bulan Pertama',
      dueDate: newClient.nextDueDate,
      paidDate: null,
      status: 'unpaid',
      paymentMethod: 'QRIS',
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);
  };

  const handleUpdateClient = (updatedClient: ClientSubscription) => {
    const updated = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    setClients(updated);
    saveClients(updated);
  };

  const handlePayInvoice = (invoiceId: string) => {
    const targetInvoice = invoices.find((i) => i.id === invoiceId);
    if (!targetInvoice) return;

    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: 'paid' as const, paidDate: Date.now() } : inv
    );
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    // Also advance the client's paid count and set next due date
    const targetClient = clients.find((c) => c.id === targetInvoice.clientId);
    if (targetClient) {
      const nextPaidCount = targetClient.paidMonthsCount + 1;
      const nextDueDate = targetClient.nextDueDate + 30 * 24 * 60 * 60 * 1000;
      const updatedClient: ClientSubscription = {
        ...targetClient,
        paidMonthsCount: nextPaidCount,
        nextDueDate,
        status: nextPaidCount >= targetClient.contractDurationMonths && targetClient.contractDurationMonths > 1
          ? 'completed'
          : 'active',
      };
      handleUpdateClient(updatedClient);
    }
  };

  const handleSelectPlanForNewClient = (
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'annual_paid_monthly' | 'annual_upfront'
  ) => {
    setCurrentTab('business');
  };

  const handleSyncCompleted = (meta: GoogleSyncMetadata) => {
    setSyncMetadata(meta);
    saveSyncMetadata(meta);
  };

  // If in gateway mode (either via hash or test button), render the gateway viewer
  if (activeGatewayLink) {
    return (
      <VirtualGatewayViewer
        link={activeGatewayLink}
        onBackToDashboard={handleExitGateway}
        onLinkUpdated={handleUpdateLink}
      />
    );
  }

  // Dashboard Stats Calculations
  const totalClicks = links.reduce((acc, curr) => acc + curr.clicksCount, 0);
  const pinProtectedCount = links.filter((l) => l.pinProtection?.enabled).length;
  const avgSecurityScore = links.length
    ? Math.round(links.reduce((acc, curr) => acc + curr.securityReport.score, 0) / links.length)
    : 100;
  const totalMrr = clients.reduce(
    (sum, c) => sum + (c.status === 'active' || c.status === 'due' ? c.monthlyRate : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Clean Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
        linksCount={links.length}
        clientsCount={clients.length}
        hasGoogleUser={currentUser !== null}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero / Focal Anchor Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Platform Bisnis Penyamaran URL & Database Google Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              Jalankan Bisnis Tautan Domain Virtual Lokal dengan Skema Langganan 1 Tahun
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Tawarkan layanan penyamaran link profesional untuk UMKM dan profesional lokal. Pelanggan dapat berlangganan hingga 1 tahun dan dibayar per bulan, dengan database otomatis tersimpan aman di Google Sheets dan Google Drive Anda.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Tautan Domain Virtual</span>
              </button>

              <button
                onClick={() => setCurrentTab('business')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Kelola Klien & Tagihan (MRR)</span>
              </button>

              <button
                onClick={() => setIsGoogleSyncModalOpen(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700/80 transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Database Google Sheets & Drive</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-Column KPI Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs block">Tautan Domain Virtual</span>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              {links.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Tersimpan di sistem & cloud</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs block">Pelanggan Bisnis Lokal</span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1 tabular-nums">
              {clients.length} Klien
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Kontrak bulanan & tahunan</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs block">Pendapatan Rutin (MRR)</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              Rp {totalMrr.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Arus kas per bulan</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs block">Database Google Workspace</span>
            <div className="text-sm font-semibold text-white mt-1.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${syncMetadata.spreadsheetId ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{syncMetadata.spreadsheetId ? 'Tersinkronisasi' : 'Siap Sinkron'}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {syncMetadata.lastSyncedAt ? new Date(syncMetadata.lastSyncedAt).toLocaleDateString('id-ID') : 'Sheets & Drive'}
            </span>
          </div>
        </div>

        {/* Tab View Content */}
        {currentTab === 'dashboard' && (
          <LinksTable
            links={links}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenDetailsModal={(link) => setSelectedLinkForDetails(link)}
            onTestLink={(link) => setActiveGatewayLink(link)}
            onToggleStatus={handleToggleStatus}
            onDeleteLink={handleDeleteLink}
            onExportJson={() => exportLinksToJson(links)}
            onImportJson={handleImportJson}
          />
        )}

        {currentTab === 'business' && (
          <ClientBillingManager
            clients={clients}
            invoices={invoices}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onPayInvoice={handlePayInvoice}
            onOpenPricingModal={() => setIsPricingModalOpen(true)}
            onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
          />
        )}

        {currentTab === 'auditor' && (
          <SecurityAuditor onQuickCloak={handleQuickCloakFromAuditor} />
        )}

        {currentTab === 'guide' && <KnowledgeGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">CloakURL Security & Local Business Engine</span>
            <span>·</span>
            <span>Google Sheets & Drive Database Connected</span>
          </div>
          <div>
            Model Bisnis Berlangganan 1 Tahun Bayar Bulanan untuk Agensi & UMKM
          </div>
        </div>
      </footer>

      {/* Create Link Modal */}
      <CreateLinkModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPrefilledAuditUrl('');
        }}
        onSaveLink={handleSaveNewLink}
      />

      {/* Link Details & QR Code Modal */}
      <LinkDetailsModal
        link={selectedLinkForDetails}
        isOpen={selectedLinkForDetails !== null}
        onClose={() => setSelectedLinkForDetails(null)}
        onTestLink={(link) => setActiveGatewayLink(link)}
        onToggleStatus={handleToggleStatus}
        onDeleteLink={handleDeleteLink}
      />

      {/* Google Sheets & Drive Sync Modal */}
      <GoogleWorkspaceSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(u) => setCurrentUser(u)}
        links={links}
        clients={clients}
        invoices={invoices}
        syncMetadata={syncMetadata}
        onSyncCompleted={handleSyncCompleted}
      />

      {/* Pricing & Business Scheme Calculator Modal */}
      <PricingCalculatorModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSelectPlanForNewClient={handleSelectPlanForNewClient}
      />
    </div>
  );
}
