/**
 * Google Sheets & Google Drive Integration Services
 * Uses Client-Side OAuth Access Token with least privilege:
 * - https://www.googleapis.com/auth/spreadsheets
 * - https://www.googleapis.com/auth/drive.file
 */

import { CloakedLink } from '../types';
import { ClientSubscription, InvoiceRecord } from '../types/business';

export interface SyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  linksCount: number;
  clientsCount: number;
  invoicesCount: number;
  timestamp: number;
  error?: string;
}

const DATABASE_SPREADSHEET_NAME = 'CloakURL_Business_Database';
const BACKUP_FOLDER_NAME = 'CloakURL_Database_Backups';

/**
 * Searches for existing database spreadsheet in Google Drive or creates a new one
 */
export async function createOrFindDatabaseSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  // 1. Search for existing spreadsheet file in Drive
  const query = encodeURIComponent(`name = '${DATABASE_SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Gagal mencari database di Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    return {
      id: existing.id,
      url: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
    };
  }

  // 2. Create new spreadsheet with 3 tabs
  const createPayload = {
    properties: {
      title: DATABASE_SPREADSHEET_NAME,
    },
    sheets: [
      { properties: { title: 'Tautan_Virtual', index: 0 } },
      { properties: { title: 'Langganan_Klien', index: 1 } },
      { properties: { title: 'Riwayat_Transaksi', index: 2 } },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Sheets baru: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Writes or updates all data tables in Google Sheets
 */
export async function syncAllToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  links: CloakedLink[],
  clients: ClientSubscription[],
  invoices: InvoiceRecord[]
): Promise<void> {
  // Prepare Tautan_Virtual rows
  const linkHeader = [
    'ID Tautan',
    'Judul',
    'Domain Virtual',
    'Slug',
    'URL Asli (Tujuan)',
    'URL Bersih (Tanpa Tracker)',
    'Mode Penyamaran',
    'Status',
    'Proteksi PIN',
    'Masa Berlaku',
    'Total Akses',
    'Batas Klik',
    'Waktu Dibuat',
  ];

  const linkRows = links.map((l) => [
    l.id,
    l.title,
    l.virtualDomain,
    l.slug,
    l.originalUrl,
    l.cleanedUrl,
    l.maskMode,
    l.status,
    l.pinProtection?.enabled ? 'YA (Aktif)' : 'TIDAK',
    l.burnAfterRead ? 'Hancur 1x Baca' : l.expiresAt ? new Date(l.expiresAt).toISOString() : 'Permanen',
    l.clicksCount,
    l.maxClicks ?? 'Tanpa Batas',
    new Date(l.createdAt).toLocaleString('id-ID'),
  ]);

  // Prepare Langganan_Klien rows
  const clientHeader = [
    'ID Pelanggan',
    'Nama Klien',
    'Nama Bisnis',
    'Kontak WhatsApp',
    'Email',
    'Paket Langganan',
    'Skema Tagihan',
    'Biaya Bulanan (IDR)',
    'Durasi Kontrak (Bulan)',
    'Bulan Terbayar',
    'Jatuh Tempo Berikutnya',
    'Status Langganan',
    'Jumlah Tautan',
  ];

  const clientRows = clients.map((c) => [
    c.id,
    c.clientName,
    c.businessName,
    c.phoneWhatsapp,
    c.email,
    c.tier.toUpperCase(),
    c.billingCycle === 'annual_paid_monthly'
      ? '1 Tahun (Bayar Bulanan)'
      : c.billingCycle === 'annual_upfront'
      ? '1 Tahun (Bayar di Awal)'
      : 'Bulanan Reguler',
    c.monthlyRate,
    c.contractDurationMonths,
    c.paidMonthsCount,
    new Date(c.nextDueDate).toLocaleDateString('id-ID'),
    c.status.toUpperCase(),
    c.assignedLinksCount,
  ]);

  // Prepare Riwayat_Transaksi rows
  const invoiceHeader = [
    'Nomor Invoice',
    'Nama Klien',
    'Nama Bisnis',
    'WhatsApp',
    'Nominal Tagihan (IDR)',
    'Periode Tagihan',
    'Jatuh Tempo',
    'Tanggal Lunas',
    'Status Pembayaran',
    'Metode Pembayaran',
  ];

  const invoiceRows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.clientName,
    inv.businessName,
    inv.phoneWhatsapp,
    inv.amount,
    inv.periodLabel,
    new Date(inv.dueDate).toLocaleDateString('id-ID'),
    inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('id-ID') : '-',
    inv.status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR',
    inv.paymentMethod || 'QRIS / Transfer Bank',
  ]);

  // Send batchUpdate values
  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Tautan_Virtual!A1:M' + (linkRows.length + 10),
        values: [linkHeader, ...linkRows],
      },
      {
        range: 'Langganan_Klien!A1:M' + (clientRows.length + 10),
        values: [clientHeader, ...clientRows],
      },
      {
        range: 'Riwayat_Transaksi!A1:J' + (invoiceRows.length + 10),
        values: [invoiceHeader, ...invoiceRows],
      },
    ],
  };

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Gagal menyinkronkan data ke Google Sheets: ${errText}`);
  }
}

/**
 * Creates or finds backup folder in Google Drive
 */
export async function createOrFindDriveBackupFolder(accessToken: string): Promise<{ id: string; url: string }> {
  const query = encodeURIComponent(`name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const folder = searchData.files[0];
      return {
        id: folder.id,
        url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      };
    }
  }

  // Create new folder
  const folderMetadata = {
    name: BACKUP_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(folderMetadata),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Gagal membuat folder di Google Drive: ${err}`);
  }

  const created = await createRes.json();
  return {
    id: created.id,
    url: `https://drive.google.com/drive/folders/${created.id}`,
  };
}

/**
 * Creates a JSON snapshot file in Google Drive inside the backup folder
 */
export async function saveSnapshotToDrive(
  accessToken: string,
  folderId: string,
  snapshotPayload: any
): Promise<{ fileId: string; fileName: string }> {
  const fileName = `cloakurl-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(snapshotPayload, null, 2) +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal menyimpan cadangan ke Google Drive: ${err}`);
  }

  const data = await res.json();
  return { fileId: data.id, fileName };
}
