import { CloakedLink, PresavedDomainOption } from '../types';
import { auditUrlSecurity, hashPin } from './security';

const STORAGE_KEY = 'cloakurl_links_v2';

// Preset virtual domains to give users instant professional options without registering anything
export const PRESET_VIRTUAL_DOMAINS: PresavedDomainOption[] = [
  { domain: 'siberes.com', category: 'Layanan Publik & Retribusi' },
  { domain: 'siberes-ngk.net', category: 'Portal Daerah' },
  { domain: 'secure-vault.internal', category: 'Enterprise Security' },
  { domain: 'cloud-drive.docs-share.io', category: 'Dokumen & Cloud' },
  { domain: 'portal.company-portal.net', category: 'Korporat' },
  { domain: 'auth.verify-access.id', category: 'Autentikasi' },
  { domain: 'link.direct-preview.co', category: 'Ringkas & Cepat' },
  { domain: 'safe-gateway.zero-trust.org', category: 'Privasi & Zero-Trust' },
  { domain: 'payment-invoice.secure-pay.app', category: 'Finansial & Tagihan' },
];

export async function getInitialLinks(): Promise<CloakedLink[]> {
  let localLinks: CloakedLink[] = [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      localLinks = JSON.parse(stored) as CloakedLink[];
    } catch {
      // ignore
    }
  }

  // Fetch server-persisted links (stored on disk in server.ts)
  try {
    const serverLinks = await fetchAllServerLinks();
    if (serverLinks && serverLinks.length > 0) {
      const mergedMap = new Map<string, CloakedLink>();
      for (const s of serverLinks) {
        if (s && s.id) mergedMap.set(s.id, s);
      }
      for (const l of localLinks) {
        if (l && l.id) mergedMap.set(l.id, l);
      }
      localLinks = Array.from(mergedMap.values());
    }
  } catch (err) {
    console.warn('Could not fetch server links on init:', err);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(localLinks));
  return localLinks;
}

export async function syncLinksToServer(links: CloakedLink[]): Promise<void> {
  try {
    await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(links),
    });
  } catch (err) {
    console.warn('Server sync failed:', err);
  }
}

export async function clearAllLinks(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    });
  } catch (err) {
    console.warn('Failed to reset links on server:', err);
  }
}

export async function fetchLinkFromServer(slug: string, domain?: string): Promise<CloakedLink | null> {
  try {
    const params = new URLSearchParams({ slug: slug.trim() });
    if (domain) params.append('domain', domain.trim());
    const res = await fetch(`/api/links?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.link) {
        return data.link as CloakedLink;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch link from server:', err);
  }
  return null;
}

export async function fetchAllServerLinks(): Promise<CloakedLink[]> {
  try {
    const res = await fetch('/api/links');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        return data.links as CloakedLink[];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch all links from server:', err);
  }
  return [];
}

export function saveLinks(links: CloakedLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    syncLinksToServer(links);
  } catch (err) {
    console.error('Failed to save links to localStorage:', err);
  }
}

export interface PortableLinkPayload {
  u: string; // cleaned url
  d: string; // virtual domain
  s: string; // slug
  m?: string; // maskMode
  p?: string; // pinHash (if enabled)
  e?: number; // expiresAt
  b?: boolean; // burnAfterRead
  c?: number; // maxClicks
  t?: string; // optional short title
}

/**
 * Encodes a cloaked link into a compact, URL-safe portable token.
 */
export function encodeLinkToToken(link: CloakedLink): string {
  const payload: PortableLinkPayload = {
    u: link.cleanedUrl,
    d: link.virtualDomain,
    s: link.slug,
    m: link.maskMode !== 'sandbox' ? link.maskMode : undefined,
    p: link.pinProtection?.enabled ? link.pinProtection.pinHash : undefined,
    e: link.expiresAt || undefined,
    b: link.burnAfterRead || undefined,
    c: link.maxClicks || undefined,
    t: link.title !== `Tautan Tersembunyi: ${link.virtualDomain}/${link.slug}` ? link.title : undefined,
  };
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a portable token back into a working CloakedLink
 */
export function decodeTokenToLink(token: string): CloakedLink | null {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = decodeURIComponent(atob(base64));
    const payload = JSON.parse(json) as PortableLinkPayload;
    if (!payload.u) return null;

    return {
      id: `clk_${Date.now().toString(36)}`,
      title: payload.t || `Tautan Terproteksi: ${payload.d || 'siberes.com'}/${payload.s || 'link'}`,
      originalUrl: payload.u,
      cleanedUrl: payload.u,
      virtualDomain: payload.d || 'siberes.com',
      slug: payload.s || 'link',
      maskMode: (payload.m as any) || 'sandbox',
      pinProtection: {
        enabled: !!payload.p,
        pinHash: payload.p || '',
      },
      expiration: payload.b ? '1view' : payload.e ? '7d' : 'never',
      expiresAt: payload.e || null,
      maxClicks: payload.c || null,
      clicksCount: 0,
      burnAfterRead: !!payload.b,
      stripTrackers: true,
      status: 'active',
      createdAt: Date.now(),
      lastAccessedAt: null,
      securityReport: {
        score: 100,
        isHttps: payload.u.startsWith('https:'),
        isPunycode: false,
        isIpHost: false,
        hasSuspiciousKeywords: false,
        removedTrackersCount: 0,
        originalCleanUrl: payload.u,
        verdict: 'safe',
        issues: [],
        recommendations: ['Tautan terverifikasi dari token portabel aman.'],
      },
      accessLogs: [],
    };
  } catch (err) {
    console.error('Failed to decode portable token:', err);
    return null;
  }
}

const CUSTOM_BASE_KEY = 'cloakurl_custom_base_host';

export function getCustomBaseOrigin(): string {
  try {
    const saved = localStorage.getItem(CUSTOM_BASE_KEY);
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  } catch {}
  return '';
}

export function setCustomBaseOrigin(host: string): void {
  try {
    if (!host.trim()) {
      localStorage.removeItem(CUSTOM_BASE_KEY);
    } else {
      let clean = host.trim().replace(/\/+$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      localStorage.setItem(CUSTOM_BASE_KEY, clean);
    }
  } catch {}
}

export function getPublicAppOrigin(): string {
  const custom = getCustomBaseOrigin();
  if (custom) return custom;

  const origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin;
}

export function getDevAppOrigin(): string {
  return window.location.origin;
}

export type LinkUrlFormat = 'hash_ultra_short' | 'portable' | 'domain_short' | 'self_contained';

/**
 * Builds the real shareable app link.
 * ALWAYS uses /#/ hash routing so that Google Cloud Run static hosting NEVER gives 404!
 */
export function buildShareableUrl(
  link: CloakedLink, 
  useDevOrigin: boolean = false,
  format: LinkUrlFormat = 'hash_ultra_short'
): string {
  const baseOrigin = useDevOrigin ? getDevAppOrigin() : getPublicAppOrigin();
  const cleanSlug = encodeURIComponent(link.slug);
  const cleanDomain = encodeURIComponent(link.virtualDomain);

  if (format === 'portable') {
    const token = encodeLinkToToken(link);
    return `${baseOrigin}/#/${cleanSlug}?p=${token}`;
  }

  if (format === 'self_contained') {
    return `${baseOrigin}/#/${cleanSlug}?u=${encodeURIComponent(link.cleanedUrl)}`;
  }

  if (format === 'domain_short') {
    return `${baseOrigin}/#/v/${cleanDomain}/${cleanSlug}`;
  }

  // Default: hash_ultra_short (e.g. https://ais-pre-...run.app/#/siberes-ngk)
  return `${baseOrigin}/#/${cleanSlug}`;
}

/**
 * Builds the simulated "Virtual Domain" visual URL string
 * e.g., "https://siberes.com/siberes-ngk"
 */
export function buildVirtualDisplayUrl(link: CloakedLink): string {
  const cleanDomain = link.virtualDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const cleanSlug = link.slug.replace(/^\/+/, '');
  return `https://${cleanDomain}/${cleanSlug}`;
}

/**
 * Generates a 100% standalone single-file HTML gateway
 */
export function generateStandaloneHtml(link: CloakedLink): string {
  const virtualUrl = buildVirtualDisplayUrl(link);
  const pinProtected = link.pinProtection?.enabled;
  const pinHash = link.pinProtection?.pinHash || '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${link.title} - ${virtualUrl}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .header { height: 52px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; gap: 12px; }
    .omnibox { flex: 1; max-width: 600px; margin: 0 auto; background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 13px; color: #34d399; }
    .lock { color: #34d399; font-size: 14px; }
    .viewport { flex: 1; display: flex; align-items: center; justify-content: center; background: #020617; padding: 12px; }
    .frame-box { width: 100%; height: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b; background: #fff; }
    iframe { width: 100%; height: 100%; border: none; }
    .pin-gate { position: fixed; inset: 0; background: #020617; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .pin-box { background: #0f172a; border: 1px solid #1e293b; padding: 32px; border-radius: 16px; text-align: center; max-width: 380px; width: 100%; }
    .pin-input { width: 100%; padding: 12px; margin: 16px 0; background: #020617; border: 1px solid #334155; border-radius: 8px; color: #fff; text-align: center; font-size: 18px; font-family: monospace; letter-spacing: 4px; }
    .pin-btn { width: 100%; padding: 12px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .pin-btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  ${pinProtected ? `
  <div id="pinGate" class="pin-gate">
    <div class="pin-box">
      <div style="font-size:32px; margin-bottom:12px;">🔒</div>
      <h2 style="font-size:18px; font-weight:bold; margin-bottom:8px;">Tautan Terproteksi PIN</h2>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:16px;">Masukkan kode PIN otentikasi untuk membuka konten ini.</p>
      <div style="font-family:monospace; font-size:12px; color:#34d399; margin-bottom:12px;">${virtualUrl}</div>
      <input type="password" id="pinCode" class="pin-input" placeholder="••••" maxlength="8" autofocus>
      <div id="pinError" style="color:#f87171; font-size:12px; margin-bottom:12px; display:none;">PIN salah!</div>
      <button class="pin-btn" onclick="verifyPin()">Buka Akses</button>
    </div>
  </div>
  ` : ''}

  <div class="header">
    <div style="font-size:12px; font-weight:bold; color:#818cf8;">CloakURL Gateway</div>
    <div class="omnibox">
      <span class="lock">🔒</span>
      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${virtualUrl}</span>
    </div>
    <a href="${link.cleanedUrl}" target="_blank" rel="noreferrer" style="font-size:12px; color:#94a3b8; text-decoration:none; padding:6px 10px; background:#1e293b; border-radius:6px;">Buka di Tab Baru ↗</a>
  </div>

  <div class="viewport">
    <div class="frame-box">
      <iframe src="${link.cleanedUrl}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
    </div>
  </div>

  <script>
    async function hash(str) {
      const enc = new TextEncoder().encode('cloakurl_salt_' + str + '_2026');
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async function verifyPin() {
      const val = document.getElementById('pinCode').value.trim();
      const targetHash = '${pinHash}';
      if (!val) return;
      const h = await hash(val);
      if (h === targetHash) {
        document.getElementById('pinGate').style.display = 'none';
      } else {
        document.getElementById('pinError').style.display = 'block';
      }
    }
    document.getElementById('pinCode')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyPin();
    });
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtml(link: CloakedLink): void {
  const htmlContent = generateStandaloneHtml(link);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${link.slug || 'gateway'}-standalone.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportLinksToJson(links: CloakedLink[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(links, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `cloakurl-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
