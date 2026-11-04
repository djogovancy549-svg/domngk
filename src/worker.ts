// Cloudflare Worker entry point for Static Assets & SPA routing
export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

// In-memory link store that persists across requests within worker isolate lifecycle
const globalLinkMap = new Map<string, any>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Route: /api/links
    if (url.pathname === '/api/links') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          if (body && body.reset === true) {
            globalLinkMap.clear();
            return new Response(JSON.stringify({ success: true, count: 0, message: 'Store cleared' }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
          const items = Array.isArray(body) ? body : [body];
          for (const item of items) {
            if (item && item.slug) {
              const slugKey = String(item.slug).toLowerCase().trim();
              globalLinkMap.set(slugKey, item);
              if (item.virtualDomain) {
                globalLinkMap.set(`${String(item.virtualDomain).toLowerCase().trim()}/${slugKey}`, item);
              }
              if (item.id) {
                globalLinkMap.set(String(item.id).toLowerCase().trim(), item);
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

      if (request.method === 'DELETE') {
        globalLinkMap.clear();
        return new Response(JSON.stringify({ success: true, message: 'Store reset' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // GET /api/links?slug=...&domain=...
      const querySlug = (url.searchParams.get('slug') || url.searchParams.get('s') || '').toLowerCase().trim();
      const queryDomain = (url.searchParams.get('domain') || url.searchParams.get('d') || '').toLowerCase().trim();
      if (querySlug) {
        const keyWithDomain = queryDomain ? `${queryDomain}/${querySlug}` : '';
        const found = (keyWithDomain && globalLinkMap.get(keyWithDomain)) || globalLinkMap.get(querySlug);
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
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
