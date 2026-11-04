import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory store for links
const linksStore = new Map<string, any>();

// Seed initial sample link keys
const sample1Url = 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
const sample2Url = 'https://wikipedia.org/wiki/Zero-trust_security_model';

const initialSamples = [
  {
    id: 'clk_siberes_ngk',
    title: 'Layanan Portal Daerah Siberes NGK',
    originalUrl: sample2Url,
    cleanedUrl: sample2Url,
    virtualDomain: 'siberes.com',
    slug: 'siberes-ngk',
    maskMode: 'sandbox',
    status: 'active',
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
    securityReport: { score: 100, isHttps: true, verdict: 'safe', issues: [], recommendations: [] },
    accessLogs: []
  },
  {
    id: 'clk_wajipretribusi',
    title: 'Portal Pembayaran Wajib Retribusi Daerah',
    originalUrl: sample1Url,
    cleanedUrl: sample1Url,
    virtualDomain: 'siberes.com',
    slug: 'wajipretribusi',
    maskMode: 'sandbox',
    status: 'active',
    createdAt: Date.now() - 72 * 60 * 60 * 1000,
    securityReport: { score: 100, isHttps: true, verdict: 'safe', issues: [], recommendations: [] },
    accessLogs: []
  },
  {
    id: 'clk_sipermas',
    title: 'Sistem Informasi Pelayanan Masyarakat (SIPERMAS)',
    originalUrl: sample1Url,
    cleanedUrl: sample1Url,
    virtualDomain: 'sipermas',
    slug: 'secure-link',
    maskMode: 'sandbox',
    status: 'active',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    securityReport: { score: 100, isHttps: true, verdict: 'safe', issues: [], recommendations: [] },
    accessLogs: []
  },
  {
    id: 'clk_sec_36kfk7z',
    title: 'Tautan Terproteksi CloakURL: sec-36kfk7z',
    originalUrl: sample1Url,
    cleanedUrl: sample1Url,
    virtualDomain: 'siberes.com',
    slug: 'sec-36kfk7z',
    maskMode: 'sandbox',
    status: 'active',
    createdAt: Date.now() - 12 * 60 * 60 * 1000,
    securityReport: { score: 100, isHttps: true, verdict: 'safe', issues: [], recommendations: [] },
    accessLogs: []
  },
  {
    id: 'clk_docs_fin2026',
    title: 'Laporan Finansial Kuartal 1 - Internal Only',
    originalUrl: sample1Url,
    cleanedUrl: sample1Url,
    virtualDomain: 'secure-vault.internal',
    slug: 'q1-financial-audit-2026',
    maskMode: 'sandbox',
    status: 'active',
    createdAt: Date.now() - 36 * 60 * 60 * 1000,
    securityReport: { score: 100, isHttps: true, verdict: 'safe', issues: [], recommendations: [] },
    accessLogs: []
  },
  {
    id: 'clk_wiki_zerotrust',
    title: 'Panduan Zero-Trust Architecture & Cloaking',
    originalUrl: sample2Url,
    cleanedUrl: sample2Url,
    virtualDomain: 'safe-gateway.zero-trust.org',
    slug: 'cybersec-architecture',
    maskMode: 'interstitial',
    status: 'active',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    securityReport: { score: 100, isHttps: true, verdict: 'safe', issues: [], recommendations: [] },
    accessLogs: []
  }
];

for (const link of initialSamples) {
  linksStore.set(link.slug.toLowerCase(), link);
  linksStore.set(`${link.virtualDomain.toLowerCase()}/${link.slug.toLowerCase()}`, link);
}

// API Routes
app.post('/api/links', (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (const item of items) {
      if (item && item.slug) {
        const slugKey = item.slug.toLowerCase();
        linksStore.set(slugKey, item);
        if (item.virtualDomain) {
          linksStore.set(`${item.virtualDomain.toLowerCase()}/${slugKey}`, item);
        }
        if (item.id) {
          linksStore.set(item.id.toLowerCase(), item);
        }
      }
    }
    res.json({ success: true, count: linksStore.size });
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

app.get('/api/links', (req, res) => {
  const querySlug = (req.query.slug || req.query.s) as string;
  const queryDomain = (req.query.domain || req.query.d) as string;

  if (querySlug) {
    const keyWithDomain = queryDomain ? `${queryDomain.toLowerCase()}/${querySlug.toLowerCase()}` : '';
    const found = (keyWithDomain && linksStore.get(keyWithDomain)) || linksStore.get(querySlug.toLowerCase());
    if (found) {
      return res.json({ success: true, link: found });
    }
  }

  const allLinks = Array.from(new Set(linksStore.values()));
  res.json({ success: true, links: allLinks });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
