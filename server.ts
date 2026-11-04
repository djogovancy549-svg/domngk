import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent JSON file storage for registered links
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'links_store.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data dir:', err);
  }
}

// In-memory store
const linksStore = new Map<string, any>();

// Load persisted links on startup
function loadPersistedLinks() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.slug) {
            indexLink(item);
          }
        }
        console.log(`Loaded ${parsed.length} persisted links from disk.`);
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted links from disk:', err);
  }
}

function saveLinksToDisk() {
  try {
    const allLinks = Array.from(new Set(linksStore.values()));
    fs.writeFileSync(DATA_FILE, JSON.stringify(allLinks, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist links to disk:', err);
  }
}

function indexLink(item: any) {
  if (!item || !item.slug) return;
  const slugKey = String(item.slug).toLowerCase().trim();
  linksStore.set(slugKey, item);
  if (item.virtualDomain) {
    const domainKey = String(item.virtualDomain).toLowerCase().trim();
    linksStore.set(`${domainKey}/${slugKey}`, item);
  }
  if (item.id) {
    linksStore.set(String(item.id).toLowerCase().trim(), item);
  }
}

loadPersistedLinks();

// API Routes
app.post('/api/links', (req, res) => {
  try {
    const body = req.body;
    // Check if this is a reset/clear command
    if (body && body.reset === true) {
      linksStore.clear();
      saveLinksToDisk();
      return res.json({ success: true, count: 0, message: 'All links cleared' });
    }

    const items = Array.isArray(body) ? body : [body];
    for (const item of items) {
      if (item && item.slug) {
        indexLink(item);
      }
    }
    saveLinksToDisk();
    res.json({ success: true, count: linksStore.size });
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON payload' });
  }
});

app.delete('/api/links', (_req, res) => {
  try {
    linksStore.clear();
    saveLinksToDisk();
    res.json({ success: true, message: 'Store reset' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset store' });
  }
});

app.get('/api/links', (req, res) => {
  const querySlug = ((req.query.slug || req.query.s) as string || '').toLowerCase().trim();
  const queryDomain = ((req.query.domain || req.query.d) as string || '').toLowerCase().trim();

  if (querySlug) {
    const keyWithDomain = queryDomain ? `${queryDomain}/${querySlug}` : '';
    const found = (keyWithDomain && linksStore.get(keyWithDomain)) || linksStore.get(querySlug);
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
    
    // SPA fallback for HTML in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) return next();
      try {
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
