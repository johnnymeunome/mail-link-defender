import { toUnicode } from "punycode";
import { rectifyConfusion } from "unicode-confusables";

const SCRIPT_TESTS: Array<[string, RegExp]> = [
  ["Latin", /\p{Script=Latin}/u],
  ["Cyrillic", /\p{Script=Cyrillic}/u],
  ["Greek", /\p{Script=Greek}/u],
  ["Arabic", /\p{Script=Arabic}/u],
  ["Hebrew", /\p{Script=Hebrew}/u],
  ["Devanagari", /\p{Script=Devanagari}/u],
  ["Han", /\p{Script=Han}/u],
  ["Hiragana", /\p{Script=Hiragana}/u],
  ["Katakana", /\p{Script=Katakana}/u],
  ["Hangul", /\p{Script=Hangul}/u]
];

export function decodeHostname(hostname: string): string {
  try {
    return toUnicode(hostname);
  } catch {
    return hostname;
  }
}

export function getScripts(value: string): string[] {
  const scripts = new Set<string>();

  for (const character of value) {
    if (/^[\p{Script=Common}\p{Script=Inherited}]$/u.test(character)) continue;
    const script = SCRIPT_TESTS.find(([, expression]) => expression.test(character));
    scripts.add(script?.[0] ?? "Other");
  }

  return [...scripts];
}

export function unicodeSkeleton(value: string): string {
  return rectifyConfusion(value.normalize("NFD").toLowerCase())
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase();
}
