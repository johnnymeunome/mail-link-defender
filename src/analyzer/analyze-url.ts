import { parse } from "tldts";
import type { Finding, LinkAnalysis, RiskLevel } from "../shared/types";
import { findBrandMatch } from "./brands";
import { isKnownShortener } from "./shorteners";
import { cleanTrackingParameters } from "./tracking";
import { decodeHostname, getScripts } from "./unicode";

const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const PASSIVE_PROTOCOLS = new Set(["cid:", "mailto:", "sms:", "tel:"]);
const REDIRECT_PARAMETERS = new Set([
  "continue",
  "dest",
  "destination",
  "redirect",
  "redirect_uri",
  "redirect_url",
  "target",
  "url"
]);

const EMPTY_DOMAIN = {
  hostname: "",
  unicodeHostname: "",
  registrableDomain: null,
  unicodeRegistrableDomain: null,
  publicSuffix: null,
  subdomain: null,
  isIp: false
};

function normalizeInput(input: string): string {
  const trimmed = input.trim();
  if (/^[a-z][a-z\d+.-]*:/iu.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function finding(
  id: string,
  severity: Finding["severity"],
  category: Finding["category"],
  title: string,
  description: string,
  evidence?: string
): Finding {
  return { id, severity, category, title, description, ...(evidence ? { evidence } : {}) };
}

function riskLevel(findings: Finding[]): RiskLevel {
  if (findings.some((item) => item.severity === "high")) return "high";
  if (findings.some((item) => item.severity === "attention")) return "attention";
  return "none";
}

function invalidAnalysis(input: string, message: string): LinkAnalysis {
  const invalidFinding = finding(
    "invalid-url",
    "high",
    "obfuscation",
    "Endereço inválido",
    "O endereço não pode ser interpretado com segurança."
  );

  return {
    input,
    originalUrl: input,
    normalizedUrl: input,
    cleanUrl: input,
    protocol: "",
    port: "",
    usernamePresent: false,
    passwordPresent: false,
    domain: EMPTY_DOMAIN,
    removedTrackingParameters: [],
    scripts: [],
    brandMatch: null,
    findings: [invalidFinding],
    level: "high",
    valid: false,
    error: message
  };
}

function passiveLinkAnalysis(input: string, url: URL): LinkAnalysis {
  return {
    input,
    originalUrl: url.href,
    normalizedUrl: url.href,
    cleanUrl: url.href,
    protocol: url.protocol,
    port: "",
    usernamePresent: false,
    passwordPresent: false,
    domain: EMPTY_DOMAIN,
    removedTrackingParameters: [],
    scripts: [],
    brandMatch: null,
    findings: [],
    level: "none",
    valid: true
  };
}

function findExternalRedirect(url: URL, sourceDomain: string | null): {
  parameter: string;
  target: URL;
} | null {
  for (const [name, value] of url.searchParams.entries()) {
    if (!REDIRECT_PARAMETERS.has(name.toLowerCase()) || !value) continue;

    try {
      const target = new URL(value, url);
      if (!WEB_PROTOCOLS.has(target.protocol)) continue;
      const targetDomain = parse(target.hostname).domain ?? null;
      if (!targetDomain || targetDomain === sourceDomain) continue;
      return { parameter: name, target };
    } catch {
      // Valores que não formam um endereço navegável não são tratados como redirecionamento.
    }
  }

  return null;
}

function extractDisplayedUrl(displayText?: string): URL | null {
  if (!displayText) return null;
  const match = displayText.trim().match(/https?:\/\/[^\s<>]+/iu);
  if (!match) return null;

  try {
    return new URL(match[0].replace(/[),.;!?]+$/u, ""));
  } catch {
    return null;
  }
}

export function analyzeUrl(input: string, context?: { displayText?: string }): LinkAnalysis {
  const normalizedInput = normalizeInput(input);
  let url: URL;

  try {
    url = new URL(normalizedInput);
  } catch (error) {
    return invalidAnalysis(input, error instanceof Error ? error.message : "URL inválida");
  }

  if (PASSIVE_PROTOCOLS.has(url.protocol)) return passiveLinkAnalysis(input, url);

  const findings: Finding[] = [];
  const isWebProtocol = WEB_PROTOCOLS.has(url.protocol);

  if (!isWebProtocol) {
    findings.push(
      finding(
        "unsupported-scheme",
        "high",
        "obfuscation",
        "Tipo de link inesperado",
        `O endereço usa o protocolo ${url.protocol || "desconhecido"}.`,
        url.protocol
      )
    );
  }

  const parsed = parse(url.hostname);
  const unicodeHostname = decodeHostname(url.hostname);
  const unicodeRegistrableDomain = parsed.domain ? decodeHostname(parsed.domain) : null;
  const scripts = getScripts(unicodeRegistrableDomain ?? unicodeHostname);
  const domain = {
    hostname: url.hostname,
    unicodeHostname,
    registrableDomain: parsed.domain ?? null,
    unicodeRegistrableDomain,
    publicSuffix: parsed.publicSuffix ?? null,
    subdomain: parsed.subdomain ?? null,
    isIp: parsed.isIp ?? false
  };

  const brandMatch = findBrandMatch(
    domain.registrableDomain,
    domain.unicodeRegistrableDomain,
    domain.subdomain
  );

  if (url.username || url.password) {
    findings.push(
      finding(
        "embedded-credentials",
        "high",
        "obfuscation",
        "Credenciais escondem o destino",
        "O endereço possui dados antes de @, uma técnica que pode confundir sobre o domínio real."
      )
    );
  }

  if (url.protocol === "http:") {
    findings.push(
      finding(
        "http",
        "attention",
        "transport",
        "Conexão sem HTTPS",
        "O link usa HTTP e não protege o tráfego com HTTPS."
      )
    );
  }

  if (domain.isIp) {
    findings.push(
      finding(
        "ip-host",
        "attention",
        "identity",
        "Endereço IP no lugar do domínio",
        "O destino usa um endereço numérico, o que dificulta reconhecer quem o controla.",
        domain.hostname
      )
    );
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    findings.push(
      finding(
        "unusual-port",
        "attention",
        "transport",
        "Porta incomum",
        `O endereço usa a porta ${url.port}.`,
        url.port
      )
    );
  }

  if (domain.hostname.includes("xn--")) {
    findings.push(
      finding(
        "international-domain",
        "attention",
        "identity",
        "Domínio internacionalizado",
        "O domínio contém caracteres codificados em Punycode. Confira a forma Unicode exibida.",
        domain.unicodeHostname
      )
    );
  }

  if (scripts.length > 1) {
    findings.push(
      finding(
        "mixed-scripts",
        brandMatch?.kind === "confusable" ? "high" : "attention",
        "obfuscation",
        "Mistura de sistemas de escrita",
        `O domínio combina caracteres dos sistemas: ${scripts.join(", ")}.`
      )
    );
  }

  if (brandMatch) {
    findings.push(
      finding(
        "brand-imitation",
        brandMatch.kind === "confusable" ? "high" : "attention",
        "identity",
        `Possível imitação de ${brandMatch.brand}`,
        `O domínio se parece com ${brandMatch.officialDomain}, mas não é o domínio oficial.`,
        domain.unicodeRegistrableDomain ?? domain.hostname
      )
    );
  }

  if (isKnownShortener(domain.registrableDomain)) {
    findings.push(
      finding(
        "shortener",
        "attention",
        "obfuscation",
        "Destino encurtado",
        "O endereço usa um encurtador e não revela o destino final antes da conexão."
      )
    );
  }

  const subdomainDepth = domain.subdomain?.split(".").filter(Boolean).length ?? 0;
  if (subdomainDepth > 3) {
    findings.push(
      finding(
        "deep-subdomain",
        "attention",
        "identity",
        "Muitos níveis de subdomínio",
        `O endereço possui ${subdomainDepth} níveis antes do domínio registrado.`
      )
    );
  }

  if (url.hostname.length > 60 || url.href.length > 220) {
    findings.push(
      finding(
        "long-url",
        "info",
        "obfuscation",
        "Endereço muito longo",
        "O comprimento dificulta a leitura, mas isoladamente não indica fraude."
      )
    );
  }

  if ((url.href.match(/%[\da-f]{2}/giu) ?? []).length > 8) {
    findings.push(
      finding(
        "encoded-content",
        "attention",
        "obfuscation",
        "Muito conteúdo codificado",
        "O endereço possui muitos caracteres percent-encoded."
      )
    );
  }

  const externalRedirect = findExternalRedirect(url, domain.registrableDomain);
  if (externalRedirect) {
    findings.push(
      finding(
        "redirect-parameter",
        "attention",
        "obfuscation",
        "Redirecionamento para outro domínio",
        `O link encaminha para ${externalRedirect.target.hostname}. O parâmetro não será removido automaticamente.`,
        externalRedirect.parameter
      )
    );
  }

  const displayedUrl = extractDisplayedUrl(context?.displayText);
  if (displayedUrl) {
    const displayedDomain = parse(displayedUrl.hostname).domain;
    if (
      displayedDomain &&
      domain.registrableDomain &&
      displayedDomain.toLowerCase() !== domain.registrableDomain.toLowerCase()
    ) {
      findings.push(
        finding(
          "display-destination-mismatch",
          "high",
          "identity",
          "Texto e destino não correspondem",
          `O e-mail mostra ${displayedDomain}, mas o clique leva a ${domain.registrableDomain}.`
        )
      );
    }
  }

  const cleaned = isWebProtocol
    ? cleanTrackingParameters(url)
    : { cleanUrl: url.href, removed: [] as string[] };

  if (cleaned.removed.length > 0) {
    findings.push(
      finding(
        "tracking-parameters",
        "info",
        "tracking",
        "Parâmetros de rastreamento",
        `Podem ser removidos: ${cleaned.removed.join(", ")}.`
      )
    );
  }

  return {
    input,
    originalUrl: url.href,
    normalizedUrl: url.href,
    cleanUrl: cleaned.cleanUrl,
    protocol: url.protocol,
    port: url.port,
    usernamePresent: Boolean(url.username),
    passwordPresent: Boolean(url.password),
    domain,
    removedTrackingParameters: cleaned.removed,
    scripts,
    brandMatch,
    findings,
    level: riskLevel(findings),
    valid: true
  };
}
