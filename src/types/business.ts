export type BillingCycle = 'monthly' | 'annual_paid_monthly' | 'annual_upfront';

export type SubscriptionTier = 'starter' | 'pro' | 'agency';

export interface PlanPricing {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number; // Regular monthly price
  annualCommitmentMonthlyPrice: number; // 1-year contract paid monthly
  annualUpfrontPrice: number; // 1-year upfront
  maxLinks: number;
  maxMonthlyClicks: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanPricing> = {
  starter: {
    tier: 'starter',
    name: 'Paket Starter UMKM',
    description: 'Cocok untuk toko lokal, cafe, kuliner, dan profesional mandiri.',
    monthlyPrice: 49000,
    annualCommitmentMonthlyPrice: 39000, // Rp 39rb/bln (hemat 20% komitmen 1 thn)
    annualUpfrontPrice: 390000, // bayar 10 bulan gratis 2 bulan
    maxLinks: 10,
    maxMonthlyClicks: 3000,
    features: [
      '10 Tautan Domain Virtual',
      'Proteksi Sandi PIN',
      'Pembersih Pelacak UTM Dasar',
      'QR Code PNG Berkualitas Tinggi',
      'Support WhatsApp Prioritas',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Paket Pro Bisnis',
    description: 'Paling diminati! Untuk bisnis berkembang, klinik, retail, dan konsultan.',
    monthlyPrice: 99000,
    annualCommitmentMonthlyPrice: 75000, // Rp 75rb/bln (hemat 24% komitmen 1 thn)
    annualUpfrontPrice: 750000,
    maxLinks: 50,
    maxMonthlyClicks: 25000,
    features: [
      '50 Tautan Domain Virtual',
      'Semua Fitur Starter',
      'Mode Stealth Frame & Zero-Trust Shield',
      'Opsi Hancur 1x Baca (Self-Destruct)',
      'Sinkronisasi Database Google Sheets Real-Time',
      'Laporan Forensik Tautan Lengkap',
    ],
  },
  agency: {
    tier: 'agency',
    name: 'Paket Enterprise Agensi',
    description: 'Untuk agensi digital, pengembang web, dan bisnis multi-cabang.',
    monthlyPrice: 199000,
    annualCommitmentMonthlyPrice: 149000, // Rp 149rb/bln (hemat 25% komitmen 1 thn)
    annualUpfrontPrice: 1490000,
    maxLinks: 250,
    maxMonthlyClicks: 150000,
    features: [
      '250+ Tautan Domain Virtual',
      'Domain Virtual Kustom Tak Terbatas',
      'Semua Fitur Pro',
      'Otomasi Backup Google Drive Harian',
      'Kwitansi & Invoice Otomatis Logo Klien',
      'Integrasi API & Multi-Client Tenant',
    ],
  },
};

export interface ClientSubscription {
  id: string;
  clientName: string;
  businessName: string;
  phoneWhatsapp: string;
  email: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  monthlyRate: number; // Tagihan bulanan berjalan (IDR)
  contractDurationMonths: number; // 1 atau 12 bulan
  paidMonthsCount: number; // Berapa bulan yang sudah dibayar
  startDate: number;
  nextDueDate: number;
  status: 'active' | 'due' | 'overdue' | 'completed';
  assignedLinksCount: number;
  notes?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  businessName: string;
  phoneWhatsapp: string;
  amount: number;
  periodLabel: string; // misal "Bulan ke-3 dari Kontrak 1 Tahun"
  dueDate: number;
  paidDate: number | null;
  status: 'paid' | 'unpaid';
  paymentMethod?: 'QRIS' | 'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'GoPay/OVO' | 'Tunai';
}

export interface GoogleSyncMetadata {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  lastSyncedAt: number | null;
  syncedRowCount: number;
}
