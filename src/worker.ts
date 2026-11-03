// Cloudflare Worker entry point for Static Assets & SPA routing
export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

// In-memory link store that persists across requests within worker isolate lifecycle
const globalLinkMap = new Map<string, any>();

// Seed initial sample links into worker memory
const sample1Url = 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
const sample2Url = 'https://wikipedia.org/wiki/Zero-trust_security_model';

const initialSamples = [
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
  globalLinkMap.set(link.slug.toLowerCase(), link);
  globalLinkMap.set(`${link.virtualDomain.toLowerCase()}/${link.slug.toLowerCase()}`, link);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Route: /api/links
    if (url.pathname === '/api/links') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const items = Array.isArray(body) ? body : [body];
          for (const item of items) {
            if (item && item.slug) {
              const slugKey = item.slug.toLowerCase();
              globalLinkMap.set(slugKey, item);
              if (item.virtualDomain) {
                globalLinkMap.set(`${item.virtualDomain.toLowerCase()}/${slugKey}`, item);
              }
              if (item.id) {
                globalLinkMap.set(item.id.toLowerCase(), item);
              }
            }
          }
          return new Response(JSON.stringify({ success: true, count: globalLinkMap.size }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
        }
      }

      // GET /api/links?slug=...&domain=...
      const querySlug = url.searchParams.get('slug') || url.searchParams.get('s');
      const queryDomain = url.searchParams.get('domain') || url.searchParams.get('d');
      if (querySlug) {
        const keyWithDomain = queryDomain ? `${queryDomain.toLowerCase()}/${querySlug.toLowerCase()}` : '';
        const found = (keyWithDomain && globalLinkMap.get(keyWithDomain)) || globalLinkMap.get(querySlug.toLowerCase());
        if (found) {
          return new Response(JSON.stringify({ success: true, link: found }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }

      // Return all stored links
      const allLinks = Array.from(new Set(globalLinkMap.values()));
      return new Response(JSON.stringify({ success: true, links: allLinks }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Serve static assets from ./dist
    if (env.ASSETS) {
      try {
        const response = await env.ASSETS.fetch(request);
        if (response.status !== 404) {
          return response;
        }
        // SPA Fallback to /index.html if route not found directly
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      } catch {
        // Fallback
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

