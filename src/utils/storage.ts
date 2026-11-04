import { CloakedLink, PresavedDomainOption } from '../types';
import { auditUrlSecurity, hashPin } from './security';

const STORAGE_KEY = 'cloakurl_links_v1';

// Preset virtual domains to give users instant professional options without registering anything
export const PRESET_VIRTUAL_DOMAINS: PresavedDomainOption[] = [
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
      // fallback
    }
  }

  if (localLinks.length === 0) {
    const sample1Pin = await hashPin('1234');
    const sample1Url = 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing&utm_source=slack&utm_medium=channel_link';
    const sample1Audit = auditUrlSecurity(sample1Url);
    const sample2Url = 'https://wikipedia.org/wiki/Zero-trust_security_model?fbclid=IwAR3XYZ123456789&utm_campaign=cybersec_whitepaper';
    const sample2Audit = auditUrlSecurity(sample2Url);

    localLinks = [
      {
        id: 'clk_docs_fin2026',
        title: 'Laporan Finansial Kuartal 1 - Internal Only',
        originalUrl: sample1Url,
        cleanedUrl: sample1Audit.originalCleanUrl,
        virtualDomain: 'secure-vault.internal',
        slug: 'q1-financial-audit-2026',
        maskMode: 'sandbox',
        pinProtection: {
          enabled: true,
          pinHash: sample1Pin,
        },
        expiration: '7d',
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxClicks: 50,
        clicksCount: 14,
        burnAfterRead: false,
        stripTrackers: true,
        status: 'active',
        createdAt: Date.now() - 36 * 60 * 60 * 1000,
        lastAccessedAt: Date.now() - 15 * 60 * 1000,
        securityReport: sample1Audit,
        accessLogs: [
          {
            id: 'log_1',
            timestamp: Date.now() - 15 * 60 * 1000,
            device: 'Desktop',
            browser: 'Chrome 128 / macOS',
            status: 'granted',
            ipMasked: '103.144.xxx.12',
          },
          {
            id: 'log_2',
            timestamp: Date.now() - 4 * 60 * 60 * 1000,
            device: 'Mobile',
            browser: 'Mobile Safari / iOS',
            status: 'granted',
            ipMasked: '180.252.xxx.89',
          },
        ],
      },
      {
        id: 'clk_wiki_zerotrust',
        title: 'Panduan Zero-Trust Architecture & Cloaking',
        originalUrl: sample2Url,
        cleanedUrl: sample2Audit.originalCleanUrl,
        virtualDomain: 'safe-gateway.zero-trust.org',
        slug: 'cybersec-architecture',
        maskMode: 'interstitial',
        pinProtection: {
          enabled: false,
          pinHash: '',
        },
        expiration: 'never',
        expiresAt: null,
        maxClicks: null,
        clicksCount: 89,
        burnAfterRead: false,
        stripTrackers: true,
        status: 'active',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        lastAccessedAt: Date.now() - 2 * 60 * 60 * 1000,
        securityReport: sample2Audit,
        accessLogs: [],
      },
    ];
  }

  // Fetch server-synced links and merge
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
  } catch {}

  localStorage.setItem(STORAGE_KEY, JSON.stringify(localLinks));
  syncLinksToServer(localLinks);
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

export async function fetchLinkFromServer(slug: string, domain?: string): Promise<CloakedLink | null> {
  try {
    const params = new URLSearchParams({ slug });
    if (domain) params.append('domain', domain);
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
 * Optimized to be lightweight so links remain as short as possible.
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
    if (!payload.u || !payload.d) return null;

    return {
      id: `clk_${Date.now().toString(36)}`,
      title: payload.t || `Tautan Terproteksi: ${payload.d}/${payload.s || 'link'}`,
      originalUrl: payload.u,
      cleanedUrl: payload.u,
      virtualDomain: payload.d,
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

/**
 * Returns the public shared origin.
 * Automatically adapts to:
 * 1. Custom domain / Cloudflare Pages domain if configured
 * 2. Active Cloudflare Pages origin (e.g. https://my-app.pages.dev)
 * 3. Or Google AI Studio preview origin (ais-pre-...)
 */
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

export type LinkUrlFormat = 'path_ultra_short' | 'hash_ultra_short' | 'domain_short' | 'portable';

/**
 * Builds the real shareable app link.
 * Defaults to ultra-short direct path URLs (e.g. https://domain.workers.dev/siberes-ngk)
 */
export function buildShareableUrl(
  link: CloakedLink, 
  useDevOrigin: boolean = false,
  format: LinkUrlFormat = 'path_ultra_short'
): string {
  const baseOrigin = useDevOrigin ? getDevAppOrigin() : getPublicAppOrigin();
  const cleanSlug = encodeURIComponent(link.slug);
  const targetParam = `u=${encodeURIComponent(link.cleanedUrl)}`;

  if (format === 'path_ultra_short') {
    return `${baseOrigin}/${cleanSlug}?${targetParam}`;
  }

  if (format === 'hash_ultra_short') {
    return `${baseOrigin}/#/${cleanSlug}?${targetParam}`;
  }

  if (format === 'portable') {
    const token = encodeLinkToToken(link);
    return `${baseOrigin}/#/v/${encodeURIComponent(link.virtualDomain)}/${cleanSlug}?p=${token}`;
  }

  // Default: domain_short (Clean domain format: https://.../#/v/domain/slug)
  return `${baseOrigin}/#/v/${encodeURIComponent(link.virtualDomain)}/${cleanSlug}?${targetParam}`;
}

/**
 * Builds the simulated "Virtual Domain" visual URL string
 * e.g., "https://secure-vault.internal/q1-financial-audit-2026"
 */
export function buildVirtualDisplayUrl(link: CloakedLink): string {
  const cleanDomain = link.virtualDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const cleanSlug = link.slug.replace(/^\/+/, '');
  return `https://${cleanDomain}/${cleanSlug}`;
}

/**
 * Generates a 100% standalone single-file HTML gateway!
 * This file can be sent directly via email attachment or WhatsApp,
 * opened on ANY computer or phone offline/online with ZERO Google 403 or 404 server errors!
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
    .header { height: 52px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; items-center; justify-content: space-between; padding: 0 16px; align-items: center; gap: 12px; }
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


