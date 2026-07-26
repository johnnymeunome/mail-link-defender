import { parse } from "tldts";
import type { BrandMatch } from "../shared/types";
import { unicodeSkeleton } from "./unicode";

interface ProtectedBrand {
  name: string;
  domains: string[];
}

const PROTECTED_BRANDS: ProtectedBrand[] = [
  { name: "Google", domains: ["google.com"] },
  { name: "Microsoft", domains: ["microsoft.com"] },
  { name: "Apple", domains: ["apple.com"] },
  { name: "Amazon", domains: ["amazon.com", "amazon.com.br"] },
  { name: "PayPal", domains: ["paypal.com"] },
  { name: "Mercado Livre", domains: ["mercadolivre.com.br"] },
  { name: "Nubank", domains: ["nubank.com.br"] },
  { name: "Itau", domains: ["itau.com.br"] },
  { name: "Bradesco", domains: ["bradesco.com.br"] },
  { name: "Caixa", domains: ["caixa.gov.br"] }
];

function distance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let diagonal = rows[0] ?? 0;
    rows[0] = rightIndex;

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previous = rows[leftIndex] ?? leftIndex;
      const substitution = diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      rows[leftIndex] = Math.min(
        (rows[leftIndex - 1] ?? 0) + 1,
        previous + 1,
        substitution
      );
      diagonal = previous;
    }
  }

  return rows[left.length] ?? Math.max(left.length, right.length);
}

export function findBrandMatch(
  registrableDomain: string | null,
  unicodeRegistrableDomain: string | null,
  subdomain: string | null
): BrandMatch | null {
  if (!registrableDomain || !unicodeRegistrableDomain) return null;

  const parsedCandidate = parse(unicodeRegistrableDomain);
  const candidateLabel = (parsedCandidate.domainWithoutSuffix ?? "").toLowerCase();
  const candidateSkeleton = unicodeSkeleton(candidateLabel);
  const subdomainTokens = (subdomain ?? "").toLowerCase().split(/[.\-_]+/u);

  for (const brand of PROTECTED_BRANDS) {
    for (const officialDomain of brand.domains) {
      if (registrableDomain === officialDomain) continue;

      const officialLabel = parse(officialDomain).domainWithoutSuffix?.toLowerCase() ?? "";
      const officialSkeleton = unicodeSkeleton(officialLabel);

      if (candidateSkeleton === officialSkeleton) {
        return { brand: brand.name, officialDomain, kind: "confusable" };
      }

      const compactCandidate = candidateSkeleton.replace(/[-_]/g, "");
      if (
        officialSkeleton.length >= 5 &&
        distance(compactCandidate, officialSkeleton) === 1
      ) {
        return { brand: brand.name, officialDomain, kind: "typo" };
      }

      if (
        candidateLabel.split(/[-_]/u).includes(officialLabel) ||
        subdomainTokens.includes(officialLabel)
      ) {
        return { brand: brand.name, officialDomain, kind: "typo" };
      }
    }
  }

  return null;
}
