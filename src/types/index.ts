/**
 * Types for CloakURL - Secure Virtual Domain Link Masker
 */

export type MaskMode = 'sandbox' | 'interstitial' | 'direct';

export type ExpirationOption = '1h' | '6h' | '24h' | '7d' | '30d' | '1view' | 'never';

export interface SecurityReport {
  score: number; // 0 - 100
  isHttps: boolean;
  isPunycode: boolean;
  isIpHost: boolean;
  hasSuspiciousKeywords: boolean;
  removedTrackersCount: number;
  originalCleanUrl: string;
  verdict: 'safe' | 'caution' | 'danger';
  issues: string[];
  recommendations: string[];
}

export interface AccessLog {
  id: string;
  timestamp: number;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  status: 'granted' | 'blocked_pin' | 'expired' | 'limit_reached';
  ipMasked: string;
}

export interface CloakedLink {
  id: string;
  originalUrl: string;
  cleanedUrl: string;
  virtualDomain: string;
  slug: string;
  title: string;
  notes?: string;
  maskMode: MaskMode;
  pinProtection?: {
    enabled: boolean;
    pinHash: string; // SHA-256 or masked string
  };
  expiration: ExpirationOption;
  expiresAt: number | null; // null for never, timestamp otherwise
  maxClicks: number | null; // null for unlimited
  clicksCount: number;
  burnAfterRead: boolean;
  stripTrackers: boolean;
  status: 'active' | 'paused' | 'expired' | 'depleted';
  createdAt: number;
  lastAccessedAt: number | null;
  securityReport: SecurityReport;
  accessLogs: AccessLog[];
}

export interface PresavedDomainOption {
  domain: string;
  category: string;
  iconName?: string;
}
