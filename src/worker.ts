// Cloudflare Worker entry point for Static Assets & SPA routing
export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
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
