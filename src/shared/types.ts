export type RiskLevel = "none" | "attention" | "high";

export type FindingSeverity = "info" | "attention" | "high";

export type FindingCategory =
  | "identity"
  | "transport"
  | "obfuscation"
  | "tracking";

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  evidence?: string;
}

export interface DomainParts {
  hostname: string;
  unicodeHostname: string;
  registrableDomain: string | null;
  unicodeRegistrableDomain: string | null;
  publicSuffix: string | null;
  subdomain: string | null;
  isIp: boolean;
}

export interface BrandMatch {
  brand: string;
  officialDomain: string;
  kind: "confusable" | "typo";
}

export interface LinkAnalysis {
  input: string;
  originalUrl: string;
  normalizedUrl: string;
  cleanUrl: string;
  protocol: string;
  port: string;
  usernamePresent: boolean;
  passwordPresent: boolean;
  domain: DomainParts;
  removedTrackingParameters: string[];
  scripts: string[];
  brandMatch: BrandMatch | null;
  findings: Finding[];
  level: RiskLevel;
  valid: boolean;
  error?: string;
}

export interface PageScanSummary {
  scanned: number;
  none: number;
  attention: number;
  high: number;
}

export type ExtensionMessage =
  | { type: "MLD_SCAN_PAGE" }
  | { type: "MLD_GET_SCAN_SUMMARY" }
  | { type: "MLD_DISABLE_PAGE" };
