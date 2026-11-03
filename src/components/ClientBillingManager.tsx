import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Search, 
  Calendar, 
  DollarSign,
  Briefcase,
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { ClientSubscription, InvoiceRecord, SubscriptionTier, BillingCycle, SUBSCRIPTION_PLANS } from '../types/business';
import { buildWhatsappInvoiceLink } from '../utils/businessStorage';

interface ClientBillingManagerProps {
  clients: ClientSubscription[];
  invoices: InvoiceRecord[];
  onAddClient: (client: ClientSubscription) => void;
  onUpdateClient: (client: ClientSubscription) => void;
  onPayInvoice: (invoiceId: string) => void;
  onOpenPricingModal: () => void;
  onOpenGoogleSync: () => void;
}

export const ClientBillingManager: React.FC<ClientBillingManagerProps> = ({
  clients,
  invoices,
  onAddClient,
  onUpdateClient,
  onPayInvoice,
  onOpenPricingModal,
  onOpenGoogleSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'invoices'>('clients');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  // New Client Form state
  const [clientName, setClientName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<SubscriptionTier>('pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual_paid_monthly');
  const [notes, setNotes] = useState('');

  // Selected plan calculation
  const planInfo = SUBSCRIPTION_PLANS[tier];
  const monthlyRate =
    billingCycle === 'annual_paid_monthly'
      ? planInfo.annualCommitmentMonthlyPrice
      : billingCycle === 'annual_upfront'
      ? Math.round(planInfo.annualUpfrontPrice / 12)
      : planInfo.monthlyPrice;

  // Filter clients
  const filteredClients = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneWhatsapp.includes(searchTerm)
  );

  // Filter invoices
  const filteredInvoices = invoices.filter(
    (i) =>
      i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalMonthlyRevenue = clients.reduce((sum, c) => sum + (c.status === 'active' || c.status === 'due' ? c.monthlyRate : 0), 0);
  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !businessName.trim() || !phoneWhatsapp.trim()) return;

    const now = Date.now();
    const contractDuration = billingCycle === 'monthly' ? 1 : 12;

    const newClient: ClientSubscription = {
      id: `cli_${Date.now().toString(36)}`,
      clientName: clientName.trim(),
      businessName: businessName.trim(),
      phoneWhatsapp: phoneWhatsapp.trim(),
      email: email.trim(),
      tier,
      billingCycle,
      monthlyRate,
      contractDurationMonths: contractDuration,
      paidMonthsCount: 1, // First month billed
      startDate: now,
      nextDueDate: now + 30 * 24 * 60 * 60 * 1000,
      status: 'active',
      assignedLinksCount: 1,
      notes: notes.trim(),
    };

    onAddClient(newClient);
    setIsAddClientModalOpen(false);

    // Reset
    setClientName('');
    setBusinessName('');
    setPhoneWhatsapp('');
    setEmail('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI strip for Business Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Pendapatan Bulanan Rutin (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2 tabular-nums">
            Rp {totalMonthlyRevenue.toLocaleString('id-ID')}
            <span className="text-xs text-slate-500 font-sans font-normal">/bln</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            Dari {clients.length} pelanggan bisnis lokal
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Total Tagihan Tertunda</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2 tabular-nums">
            Rp {unpaidTotal.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {unpaidInvoices.length} tagihan belum dibayar
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Database Google Workspace</span>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onOpenGoogleSync}
              className="w-full py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Kelola Google Sheets & Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls: Search & Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'clients'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar Klien Bisnis ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tagihan & Invoice ({invoices.length})
            </button>
          </div>

          <button
            onClick={onOpenPricingModal}
            className="px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 rounded-lg transition-colors"
          >
            Skema Paket Biaya
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama klien / usaha..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Klien Baru</span>
          </button>
        </div>
      </div>

      {/* 1. Clients List Table */}
      {activeTab === 'clients' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Nama Klien & Usaha</th>
                  <th className="py-3 px-4">Paket & Skema</th>
                  <th className="py-3 px-4 text-right">Tarif Bulanan</th>
                  <th className="py-3 px-4">Progres Kontrak</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4 text-right">Aksi Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredClients.map((client) => {
                  const isDue = client.status === 'due';
                  return (
                    <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{client.businessName}</div>
                        <div className="text-[11px] text-slate-400">
                          {client.clientName} · <span className="font-mono text-slate-500">{client.phoneWhatsapp}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200 capitalize">
                          {client.tier} ({client.billingCycle === 'annual_paid_monthly' ? 'Kontrak 1 Thn / Bln' : 'Bulanan'})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {client.assignedLinksCount} Tautan Terdaftar
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-white tabular-nums">
                        Rp {client.monthlyRate.toLocaleString('id-ID')}
                        <span className="text-[10px] text-slate-500 block font-sans">/bln</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-300 font-mono tabular-nums">
                          Bulan ke-{client.paidMonthsCount} dari {client.contractDurationMonths} bln
                        </div>
                        <div className="w-28 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (client.paidMonthsCount / client.contractDurationMonths) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono tabular-nums ${
                            isDue ? 'text-amber-400 font-medium' : 'text-slate-300'
                          }`}
                        >
                          {new Date(client.nextDueDate).toLocaleDateString('id-ID', {
                            dateStyle: 'medium',
                          })}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {isDue ? 'Menunggu Pembayaran' : 'Aktif'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {/* Instant WhatsApp Invoice Reminder */}
                        {invoices.find((inv) => inv.clientId === client.id && inv.status === 'unpaid') ? (
                          <a
                            href={buildWhatsappInvoiceLink(
                              invoices.find((inv) => inv.clientId === client.id && inv.status === 'unpaid')!
                            )}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 shadow transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim Tagihan WA</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Invoices List Table */}
      {activeTab === 'invoices' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4">No. Invoice & Klien</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4">Status Pembayaran</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-white">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400">
                          {inv.businessName} ({inv.clientName})
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {inv.periodLabel}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums">
                        Rp {inv.amount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </td>

                      <td className="py-3 px-4">
                        {isPaid ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Belum Dibayar
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid ? (
                            <>
                              <button
                                onClick={() => onPayInvoice(inv.id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors"
                              >
                                Tandai Lunas
                              </button>
                              <a
                                href={buildWhatsappInvoiceLink(inv)}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 rounded border border-emerald-500/30"
                                title="Kirim Tagihan via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              Lunas pada {new Date(inv.paidDate!).toLocaleDateString('id-ID')}
                            </span>
                          )}
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

      {/* Modal: Tambah Klien Baru */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Daftarkan Klien Bisnis Lokal Baru</h3>
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Nama Bisnis / Perusahaan Klien *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Klinik Pratama Sehat / Resto Padang Jaya"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Nama Penanggung Jawab *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Contoh: Bpk. Hendra Wijaya"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Pilihan Paket Langganan</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as SubscriptionTier)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="starter">Paket Starter UMKM (10 Tautan)</option>
                  <option value="pro">Paket Pro Bisnis (50 Tautan) — Rekomendasi</option>
                  <option value="agency">Paket Enterprise Agensi (250+ Tautan)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Skema Pembayaran (Komitmen 1 Tahun Bayar Bulanan)</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="annual_paid_monthly">Kontrak 1 Tahun (Bayar Bulanan Rp {planInfo.annualCommitmentMonthlyPrice.toLocaleString('id-ID')}/bln)</option>
                  <option value="monthly">Bulanan Biasa (Rp {planInfo.monthlyPrice.toLocaleString('id-ID')}/bln)</option>
                  <option value="annual_upfront">1 Tahun Lunas di Awal (Rp {planInfo.annualUpfrontPrice.toLocaleString('id-ID')})</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Catatan / Domain Virtual Khusus Klien</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Menggunakan domain menu.restopadang.internal"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow"
                >
                  Simpan & Daftarkan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
