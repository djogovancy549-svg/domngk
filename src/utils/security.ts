import { SecurityReport } from '../types';

// Common surveillance and ad-tracking query parameters to strip
export const TRACKER_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'ttclid',
  'twclid',
  'wbraid',
  'gbraid',
  '_hsenc',
  '_hsmi',
  'mc_eid',
  'oly_anon_id',
  'oly_enc_id',
  'vero_id',
  'wickedid',
  'yclid',
  'zanpid',
  's_kwcid',
  'sc_campaign',
  'igshid',
];

// Suspicious phishing or credential-harvesting keywords
const SUSPICIOUS_KEYWORDS = [
  'free-gift',
  'login-verify',
  'account-update',
  'claim-prize',
  'verify-bank',
  'security-alert-center',
  'recover-password',
  'crypto-airdrop',
  'wallet-connect-fix',
  'urgent-notice',
];

/**
 * Strips tracking parameters from a URL while preserving valid functional query parameters.
 */
export function cleanTrackingParameters(rawUrl: string): { cleanedUrl: string; removedCount: number } {
  try {
    let urlToParse = rawUrl.trim();
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }

    const parsed = new URL(urlToParse);
    let removedCount = 0;

    const paramsToRemove: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (
        TRACKER_PARAMS.includes(lowerKey) ||
        lowerKey.startsWith('utm_') ||
        lowerKey.startsWith('tracking_')
      ) {
        paramsToRemove.push(key);
      }
    });

    paramsToRemove.forEach((key) => {
      parsed.searchParams.delete(key);
      removedCount++;
    });

    return {
      cleanedUrl: parsed.toString(),
      removedCount,
    };
  } catch {
    return { cleanedUrl: rawUrl, removedCount: 0 };
  }
}

/**
 * Detects if a domain uses Punycode (often used in homograph phishing attacks).
 */
export function isPunycodeDomain(hostname: string): boolean {
  return hostname.toLowerCase().includes('xn--');
}

/**
 * Detects if the hostname is a raw IP address (v4 or v6).
 */
export function isIpAddress(hostname: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 check
  const ipv6Regex = /^\[?[a-fA-F0-9:]+\]?$/;
  return ipv4Regex.test(hostname) || (hostname.includes(':') && ipv6Regex.test(hostname));
}

/**
 * Perform comprehensive heuristic security audit on a URL.
 */
export function auditUrlSecurity(targetUrl: string): SecurityReport {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  let urlToAudit = targetUrl.trim();
  if (!/^https?:\/\//i.test(urlToAudit)) {
    urlToAudit = 'https://' + urlToAudit;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToAudit);
  } catch {
    return {
      score: 10,
      isHttps: false,
      isPunycode: false,
      isIpHost: false,
      hasSuspiciousKeywords: false,
      removedTrackersCount: 0,
      originalCleanUrl: targetUrl,
      verdict: 'danger',
      issues: ['Format URL tidak valid atau rusak.'],
      recommendations: ['Periksa kembali penulisan URL tujuan Anda.'],
    };
  }

  const isHttps = parsed.protocol.toLowerCase() === 'https:';
  if (!isHttps) {
    score -= 35;
    issues.push('Protokol tidak terenkripsi (HTTP standar). Data dapat diintip di jaringan publik.');
    recommendations.push('Gunakan protokol HTTPS terenkripsi untuk keamanan maksimal.');
  }

  const isPunycode = isPunycodeDomain(parsed.hostname);
  if (isPunycode) {
    score -= 40;
    issues.push('Domain terdeteksi menggunakan format Punycode (xn--), potensi serangan homograph (kloning nama domain).');
    recommendations.push('Pastikan domain ini bukan tiruan dari situs resmi.');
  }

  const isIpHost = isIpAddress(parsed.hostname);
  if (isIpHost) {
    score -= 30;
    issues.push('Host menggunakan alamat IP langsung tanpa nama domain terdaftar.');
    recommendations.push('Hindari mengarahkan pengunjung ke IP mentah jika untuk keperluan publik.');
  }

  const lowerPath = (parsed.pathname + parsed.search).toLowerCase();
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter((kw) => lowerPath.includes(kw));
  const hasSuspiciousKeywords = foundKeywords.length > 0;
  if (hasSuspiciousKeywords) {
    score -= 25;
    issues.push(`Mengandung kata kunci berisiko tinggi (${foundKeywords.join(', ')}).`);
    recommendations.push('Pastikan tautan tidak digunakan untuk phishing atau penipuan.');
  }

  const { cleanedUrl, removedCount } = cleanTrackingParameters(urlToAudit);
  if (removedCount > 0) {
    issues.push(`Ditemukan ${removedCount} parameter pelacak/pengintai (UTM/Ad click tags).`);
    recommendations.push('Fitur Pembersih Privasi CloakURL akan otomatis membuang pelacak ini.');
  }

  // Determine verdict
  const finalScore = Math.max(0, Math.min(100, score));
  let verdict: 'safe' | 'caution' | 'danger' = 'safe';
  if (finalScore < 50) {
    verdict = 'danger';
  } else if (finalScore < 80) {
    verdict = 'caution';
  }

  if (issues.length === 0) {
    recommendations.push('Tautan memenuhi standar keamanan dasar dan siap disamarkan.');
  }

  return {
    score: finalScore,
    isHttps,
    isPunycode,
    isIpHost,
    hasSuspiciousKeywords,
    removedTrackersCount: removedCount,
    originalCleanUrl: cleanedUrl,
    verdict,
    issues,
    recommendations,
  };
}

/**
 * Checks if a destination domain is typically known to enforce X-Frame-Options: DENY or SAMEORIGIN
 * so we can provide seamless user advice when using Sandbox Cloaking.
 */
export function isKnownFrameRestrictedDomain(url: string): { isRestricted: boolean; domainName: string } {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    const restrictedList = [
      'google.com',
      'youtube.com',
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'github.com',
      'linkedin.com',
      'reddit.com',
      'netflix.com',
      'amazon.com',
      'paypal.com',
      'apple.com',
      'bankofamerica.com',
      'bca.co.id',
      'mandiri.co.id',
    ];

    const match = restrictedList.some((d) => host === d || host.endsWith('.' + d));
    return {
      isRestricted: match,
      domainName: host,
    };
  } catch {
    return { isRestricted: false, domainName: '' };
  }
}

/**
 * Simple client-side pseudo-hash for PIN verification (avoids storing plaintext PIN)
 */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`cloakurl_salt_${pin}_2026`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
