const KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "buff.ly",
  "cutt.ly",
  "goo.gl",
  "is.gd",
  "rebrand.ly",
  "t.co",
  "tiny.cc",
  "tinyurl.com",
  "tr.im"
]);

export function isKnownShortener(domain: string | null): boolean {
  return domain !== null && KNOWN_SHORTENERS.has(domain.toLowerCase());
}
