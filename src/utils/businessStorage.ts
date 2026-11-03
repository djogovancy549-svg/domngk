import { ClientSubscription, InvoiceRecord, GoogleSyncMetadata } from '../types/business';

const CLIENTS_STORAGE_KEY = 'cloakurl_clients_v1';
const INVOICES_STORAGE_KEY = 'cloakurl_invoices_v1';
const SYNC_METADATA_KEY = 'cloakurl_sync_meta_v1';

export function getInitialClients(): ClientSubscription[] {
  const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }

  // Pre-seed with realistic local business clients demonstrating the 1-year paid monthly model
  const now = Date.now();
  const sampleClients: ClientSubscription[] = [
    {
      id: 'cli_notaris_sudirman',
      clientName: 'Bambang Hartono, S.H.',
      businessName: 'Kantor Notaris & PPAT Sudirman',
      phoneWhatsapp: '081288991234',
      email: 'notaris.hartono@gmail.com',
      tier: 'pro',
      billingCycle: 'annual_paid_monthly', // 1 tahun, bayar bulanan
      monthlyRate: 75000,
      contractDurationMonths: 12,
      paidMonthsCount: 4,
      startDate: now - 95 * 24 * 60 * 60 * 1000,
      nextDueDate: now + 5 * 24 * 60 * 60 * 1000,
      status: 'active',
      assignedLinksCount: 12,
      notes: 'Menggunakan domain virtual notaris-sudirman.internal untuk dokumen akta klien.',
    },
    {
      id: 'cli_klinik_medika',
      clientName: 'dr. Sarah Amanda',
      businessName: 'Klinik Pratama Medika Sejahtera',
      phoneWhatsapp: '081399887766',
      email: 'admin@klinikmedika.id',
      tier: 'pro',
      billingCycle: 'annual_paid_monthly',
      monthlyRate: 75000,
      contractDurationMonths: 12,
      paidMonthsCount: 2,
      startDate: now - 40 * 24 * 60 * 60 * 1000,
      nextDueDate: now - 2 * 24 * 60 * 60 * 1000, // Jatuh tempo 2 hari lalu
      status: 'due',
      assignedLinksCount: 8,
      notes: 'Tautan virtual resep dan hasil lab pasien terproteksi PIN.',
    },
    {
      id: 'cli_kopi_senja',
      clientName: 'Reza Pratama',
      businessName: 'Senja Kopi Roastery & Cafe',
      phoneWhatsapp: '087711223344',
      email: 'senjakopi.id@gmail.com',
      tier: 'starter',
      billingCycle: 'monthly',
      monthlyRate: 49000,
      contractDurationMonths: 1,
      paidMonthsCount: 1,
      startDate: now - 15 * 24 * 60 * 60 * 1000,
      nextDueDate: now + 15 * 24 * 60 * 60 * 1000,
      status: 'active',
      assignedLinksCount: 3,
      notes: 'Tautan menu QR digital disamarkan menjadi menu.senjakopi.internal.',
    },
  ];

  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(sampleClients));
  return sampleClients;
}

export function saveClients(clients: ClientSubscription[]): void {
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

export function getInitialInvoices(): InvoiceRecord[] {
  const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }

  const now = Date.now();
  const sampleInvoices: InvoiceRecord[] = [
    {
      id: 'inv_1001',
      invoiceNumber: 'INV-2026-001',
      clientId: 'cli_notaris_sudirman',
      clientName: 'Bambang Hartono, S.H.',
      businessName: 'Kantor Notaris & PPAT Sudirman',
      phoneWhatsapp: '081288991234',
      amount: 75000,
      periodLabel: 'Bulan ke-4 (Kontrak 1 Tahun)',
      dueDate: now + 5 * 24 * 60 * 60 * 1000,
      paidDate: null,
      status: 'unpaid',
      paymentMethod: 'Transfer Bank BCA',
    },
    {
      id: 'inv_1002',
      invoiceNumber: 'INV-2026-002',
      clientId: 'cli_klinik_medika',
      clientName: 'dr. Sarah Amanda',
      businessName: 'Klinik Pratama Medika Sejahtera',
      phoneWhatsapp: '081399887766',
      amount: 75000,
      periodLabel: 'Bulan ke-2 (Kontrak 1 Tahun)',
      dueDate: now - 2 * 24 * 60 * 60 * 1000,
      paidDate: null,
      status: 'unpaid',
      paymentMethod: 'QRIS',
    },
    {
      id: 'inv_1000',
      invoiceNumber: 'INV-2026-000',
      clientId: 'cli_kopi_senja',
      clientName: 'Reza Pratama',
      businessName: 'Senja Kopi Roastery & Cafe',
      phoneWhatsapp: '087711223344',
      amount: 49000,
      periodLabel: 'Bulan Pertama (Starter UMKM)',
      dueDate: now - 15 * 24 * 60 * 60 * 1000,
      paidDate: now - 15 * 24 * 60 * 60 * 1000,
      status: 'paid',
      paymentMethod: 'QRIS',
    },
  ];

  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(sampleInvoices));
  return sampleInvoices;
}

export function saveInvoices(invoices: InvoiceRecord[]): void {
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
}

export function getSyncMetadata(): GoogleSyncMetadata {
  const stored = localStorage.getItem(SYNC_METADATA_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return {
    spreadsheetId: null,
    spreadsheetUrl: null,
    driveFolderId: null,
    driveFolderUrl: null,
    lastSyncedAt: null,
    syncedRowCount: 0,
  };
}

export function saveSyncMetadata(meta: GoogleSyncMetadata): void {
  localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(meta));
}

/**
 * Generates an instant WhatsApp message link to send billing invoice to client
 */
export function buildWhatsappInvoiceLink(invoice: InvoiceRecord): string {
  const cleanPhone = invoice.phoneWhatsapp.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  
  const text = `Halo Bapak/Ibu ${invoice.clientName} (${invoice.businessName}),%0A%0ABerikut adalah rincian tagihan langganan Tautan Domain Virtual CloakURL Anda:%0A• No. Invoice: *${invoice.invoiceNumber}*%0A• Periode: *${invoice.periodLabel}*%0A• Total Tagihan: *Rp ${invoice.amount.toLocaleString('id-ID')}*%0A• Jatuh Tempo: *${new Date(invoice.dueDate).toLocaleDateString('id-ID')}*%0A%0AMetode Pembayaran:%0A- Transfer BCA: 1234-567-890 a.n. CloakURL Bisnis%0A- QRIS: Semua E-Wallet (Gopay/OVO/Dana)%0A%0ASilakan kirimkan bukti transfer setelah pembayaran berhasil. Terima kasih! 🙏`;

  return `https://wa.me/${targetPhone}?text=${text}`;
}
