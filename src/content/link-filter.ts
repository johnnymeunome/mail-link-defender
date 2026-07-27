const WEB_PROTOCOLS = new Set(["http:", "https:"]);

export function isScannableLink(rawHref: string | null, resolvedHref: string): boolean {
  const raw = rawHref?.trim();
  if (!raw || raw.startsWith("#")) return false;

  try {
    return WEB_PROTOCOLS.has(new URL(resolvedHref).protocol);
  } catch {
    return false;
  }
}
