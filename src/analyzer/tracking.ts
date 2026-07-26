const EXACT_TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "_hsenc",
  "_hsmi"
]);

function isTrackingParameter(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.startsWith("utm_") || EXACT_TRACKING_PARAMETERS.has(normalized);
}

export function cleanTrackingParameters(url: URL): {
  cleanUrl: string;
  removed: string[];
} {
  const cleaned = new URL(url.href);
  const removed: string[] = [];

  for (const name of Array.from(cleaned.searchParams.keys())) {
    if (!isTrackingParameter(name)) continue;
    cleaned.searchParams.delete(name);
    removed.push(name);
  }

  return {
    cleanUrl: cleaned.href,
    removed: [...new Set(removed)]
  };
}
