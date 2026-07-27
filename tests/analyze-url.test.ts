import { toASCII } from "punycode";
import { describe, expect, it } from "vitest";
import { analyzeUrl } from "../src/analyzer/analyze-url";
import { isScannableLink } from "../src/content/link-filter";

describe("analyzeUrl", () => {
  it("reveals the registrable domain behind a misleading subdomain", () => {
    const result = analyzeUrl("https://google.com.login-seguro.xyz/conta");

    expect(result.domain.registrableDomain).toBe("login-seguro.xyz");
    expect(result.domain.subdomain).toBe("google.com");
    expect(result.brandMatch?.brand).toBe("Google");
  });

  it("uses the public suffix list", () => {
    const result = analyzeUrl("https://conta.example.co.uk/login");

    expect(result.domain.registrableDomain).toBe("example.co.uk");
    expect(result.domain.publicSuffix).toBe("co.uk");
    expect(result.domain.subdomain).toBe("conta");
  });

  it("detects a Unicode confusable PayPal domain", () => {
    const spoofed = toASCII("pаypal.com");
    const result = analyzeUrl(`https://${spoofed}/login`);

    expect(result.domain.unicodeHostname).toBe("pаypal.com");
    expect(result.brandMatch?.brand).toBe("PayPal");
    expect(result.level).toBe("high");
  });

  it("detects when visible URL text and destination differ", () => {
    const result = analyzeUrl("https://conta-insegura.xyz", {
      displayText: "Acesse https://nubank.com.br agora"
    });

    expect(result.findings.some((item) => item.id === "display-destination-mismatch")).toBe(true);
    expect(result.level).toBe("high");
  });

  it("removes only unambiguous tracking parameters", () => {
    const result = analyzeUrl(
      "https://example.com/watch?v=123&t=40&utm_source=email&fbclid=abc&ref=partner"
    );

    expect(result.cleanUrl).toContain("v=123");
    expect(result.cleanUrl).toContain("t=40");
    expect(result.cleanUrl).toContain("ref=partner");
    expect(result.cleanUrl).not.toContain("utm_source");
    expect(result.cleanUrl).not.toContain("fbclid");
  });

  it("flags executable URL schemes", () => {
    const result = analyzeUrl("javascript:alert(1)");

    expect(result.findings.some((item) => item.id === "unsupported-scheme")).toBe(true);
    expect(result.level).toBe("high");
  });

  it("flags known URL shorteners", () => {
    const result = analyzeUrl("https://bit.ly/example");

    expect(result.findings.some((item) => item.id === "shortener")).toBe(true);
    expect(result.level).toBe("attention");
  });

  it.each([
    "mailto:security@example.com",
    "tel:+5511999999999",
    "sms:+5511999999999",
    "cid:logo@example.com"
  ])("treats the passive link as neutral: %s", (url) => {
    const result = analyzeUrl(url);

    expect(result.level).toBe("none");
    expect(result.findings).toHaveLength(0);
  });

  it("does not flag a same-domain redirect parameter", () => {
    const result = analyzeUrl(
      "https://accounts.google.com/start?continue=https%3A%2F%2Fmyaccount.google.com%2Fsecurity"
    );

    expect(result.findings.some((item) => item.id === "redirect-parameter")).toBe(false);
  });

  it("flags a redirect parameter that points to another domain", () => {
    const result = analyzeUrl(
      "https://accounts.google.com/start?continue=https%3A%2F%2Fevil.example%2Flogin"
    );

    expect(result.findings.some((item) => item.id === "redirect-parameter")).toBe(true);
    expect(result.level).toBe("attention");
  });

  it("treats URL length alone as information", () => {
    const result = analyzeUrl(`https://example.com/${"a".repeat(230)}`);

    expect(result.findings.find((item) => item.id === "long-url")?.severity).toBe("info");
    expect(result.level).toBe("none");
  });

  it("flags an IP address used as host", () => {
    const result = analyzeUrl("http://192.0.2.1/login");

    expect(result.domain.isIp).toBe(true);
    expect(result.findings.some((item) => item.id === "ip-host")).toBe(true);
  });

  it("adds HTTPS to a hostname without scheme", () => {
    const result = analyzeUrl("example.com/path");

    expect(result.normalizedUrl).toBe("https://example.com/path");
  });

  it.each([
    "https://google.com",
    "https://microsoft.com/security",
    "https://apple.com/br",
    "https://paypal.com/signin",
    "https://nubank.com.br"
  ])("does not imitate the official brand domain: %s", (url) => {
    const result = analyzeUrl(url);

    expect(result.brandMatch).toBeNull();
    expect(result.level).toBe("none");
  });

  it.each([
    "utm_source",
    "utm_campaign",
    "fbclid",
    "gclid",
    "dclid",
    "msclkid",
    "mc_cid",
    "_hsenc"
  ])("removes the tracking parameter %s", (parameter) => {
    const result = analyzeUrl(`https://example.com/page?keep=1&${parameter}=tracking`);

    expect(result.cleanUrl).toContain("keep=1");
    expect(result.cleanUrl).not.toContain(`${parameter}=`);
  });

  it.each([
    ["embedded-credentials", "https://usuario:senha@example.com/login"],
    ["unusual-port", "https://example.com:8443/login"],
    ["deep-subdomain", "https://a.b.c.d.e.example.com/login"],
    ["redirect-parameter", "https://example.com/?redirect=https%3A%2F%2Fother.test"],
    ["encoded-content", "https://example.com/%41%42%43%44%45%46%47%48%49"],
    ["brand-imitation", "https://micros0ft.com/login"],
    ["unsupported-scheme", "javascript:alert(1)"]
  ])("detects the signal %s", (findingId, url) => {
    const result = analyzeUrl(url);

    expect(result.findings.some((item) => item.id === findingId)).toBe(true);
  });
});

describe("isScannableLink", () => {
  it.each([
    ["mailto:security@example.com", "mailto:security@example.com"],
    ["tel:+5511999999999", "tel:+5511999999999"],
    ["sms:+5511999999999", "sms:+5511999999999"],
    ["#settings", "https://mail.google.com/mail/u/0/#settings"]
  ])("ignores the non-web link %s", (rawHref, resolvedHref) => {
    expect(isScannableLink(rawHref, resolvedHref)).toBe(false);
  });

  it.each([
    ["https://example.com", "https://example.com/"],
    ["/security", "https://example.com/security"]
  ])("accepts the web link %s", (rawHref, resolvedHref) => {
    expect(isScannableLink(rawHref, resolvedHref)).toBe(true);
  });
});
