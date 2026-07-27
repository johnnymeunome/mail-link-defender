import { analyzeUrl } from "../analyzer/analyze-url";
import type { ExtensionMessage, LinkAnalysis, PageScanSummary } from "../shared/types";
import { isScannableLink } from "./link-filter";

declare global {
  interface Window {
    __mailLinkDefenderInstalled?: boolean;
  }
}

const CLASS_ATTENTION = "mld-link-attention";
const CLASS_HIGH = "mld-link-high";
const STYLE_ID = "mld-protection-styles";
const MODAL_HOST_ID = "mld-warning-host";
const ORIGINAL_TITLE_ATTRIBUTE = "data-mail-link-defender-original-title";
const analyses = new WeakMap<HTMLAnchorElement, LinkAnalysis>();
let observer: MutationObserver | null = null;
let scanTimer: number | null = null;
let lastSummary: PageScanSummary = { scanned: 0, none: 0, attention: 0, high: 0 };

function installStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const root = document.head ?? document.documentElement;
  if (!root) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    a.${CLASS_ATTENTION}, a.${CLASS_HIGH} {
      border-radius: 2px !important;
      box-decoration-break: clone !important;
      -webkit-box-decoration-break: clone !important;
      position: relative !important;
      text-decoration-color: currentColor !important;
      text-decoration-thickness: 1px !important;
      text-underline-offset: 3px !important;
    }
    a.${CLASS_ATTENTION} {
      background: rgba(154, 103, 0, .08) !important;
      box-shadow: inset 0 -2px 0 #b77900 !important;
    }
    a.${CLASS_HIGH} {
      background: rgba(196, 61, 54, .08) !important;
      box-shadow: inset 0 -2px 0 #c43d36 !important;
    }
    a.${CLASS_ATTENTION}::after, a.${CLASS_HIGH}::after {
      display: inline-grid !important;
      width: 14px !important;
      height: 14px !important;
      place-items: center !important;
      margin-left: 5px !important;
      border-radius: 50% !important;
      color: #fff !important;
      content: "!" !important;
      font: 700 10px/1 system-ui, sans-serif !important;
      vertical-align: middle !important;
    }
    a.${CLASS_ATTENTION}::after { background: #9a6700 !important; }
    a.${CLASS_HIGH}::after { background: #c43d36 !important; }
  `;
  root.append(style);
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  return element.getClientRects().length > 0;
}

function scanRoots(): ParentNode[] {
  const gmailBodies = Array.from(document.querySelectorAll<HTMLElement>(".a3s"));
  if (gmailBodies.some(isVisible)) return gmailBodies.filter(isVisible);

  const main = document.querySelector<HTMLElement>("[role='main'], main");
  return [main ?? document.body ?? document.documentElement];
}

function clearDecoration(anchor: HTMLAnchorElement): void {
  anchor.classList.remove(CLASS_ATTENTION, CLASS_HIGH);
  anchor.removeAttribute("data-mail-link-defender");

  if (!anchor.hasAttribute(ORIGINAL_TITLE_ATTRIBUTE)) return;
  const originalTitle = anchor.getAttribute(ORIGINAL_TITLE_ATTRIBUTE) ?? "";
  if (originalTitle) anchor.title = originalTitle;
  else anchor.removeAttribute("title");
  anchor.removeAttribute(ORIGINAL_TITLE_ATTRIBUTE);
}

function decorate(anchor: HTMLAnchorElement, analysis: LinkAnalysis): void {
  anchor.classList.remove(CLASS_ATTENTION, CLASS_HIGH);
  anchor.removeAttribute("data-mail-link-defender");

  if (analysis.level === "none") {
    clearDecoration(anchor);
    return;
  }

  const className = analysis.level === "high" ? CLASS_HIGH : CLASS_ATTENTION;
  anchor.classList.add(className);
  anchor.dataset.mailLinkDefender = analysis.level;
  const reason = analysis.findings.find((item) => item.severity === analysis.level)?.title
    ?? analysis.findings[0]?.title
    ?? "Link merece verificação";
  if (!anchor.hasAttribute(ORIGINAL_TITLE_ATTRIBUTE)) {
    anchor.setAttribute(ORIGINAL_TITLE_ATTRIBUTE, anchor.getAttribute("title") ?? "");
  }
  const originalTitle = anchor.getAttribute(ORIGINAL_TITLE_ATTRIBUTE) ?? "";
  anchor.title = `${originalTitle ? `${originalTitle}\n` : ""}Mail Link Defender: ${reason}`;
}

function scanPage(): PageScanSummary {
  installStyles();
  const anchors = new Set<HTMLAnchorElement>();
  for (const root of scanRoots()) {
    root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => anchors.add(anchor));
  }

  const summary: PageScanSummary = { scanned: 0, none: 0, attention: 0, high: 0 };
  for (const anchor of anchors) {
    if (!isVisible(anchor)) continue;
    if (!isScannableLink(anchor.getAttribute("href"), anchor.href)) {
      analyses.delete(anchor);
      clearDecoration(anchor);
      continue;
    }
    const href = anchor.href;
    if (!href) continue;

    const analysis = analyzeUrl(href, { displayText: anchor.textContent ?? "" });
    analyses.set(anchor, analysis);
    decorate(anchor, analysis);
    summary.scanned += 1;
    summary[analysis.level] += 1;
  }

  lastSummary = summary;
  return summary;
}

function scheduleScan(): void {
  if (scanTimer !== null) window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => {
    scanTimer = null;
    scanPage();
  }, 300);
}

function closeWarning(): void {
  document.getElementById(MODAL_HOST_ID)?.remove();
}

function openDestination(anchor: HTMLAnchorElement): void {
  const href = anchor.href;
  closeWarning();
  if (anchor.target === "_blank") {
    window.open(href, "_blank", "noopener,noreferrer");
  } else {
    window.location.assign(href);
  }
}

function showWarning(anchor: HTMLAnchorElement, analysis: LinkAnalysis): void {
  closeWarning();
  const host = document.createElement("div");
  host.id = MODAL_HOST_ID;
  const shadow = host.attachShadow({ mode: "closed" });

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  const dialog = document.createElement("section");
  dialog.className = "dialog";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "mld-warning-title");

  const dialogHead = document.createElement("div");
  dialogHead.className = "dialog-head";
  const warningMark = document.createElement("span");
  warningMark.className = "warning-mark";
  warningMark.textContent = "!";
  const headingCopy = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Perigo detectado · navegação interrompida";
  const title = document.createElement("h2");
  title.id = "mld-warning-title";
  title.textContent = "Este link parece perigoso";
  headingCopy.append(eyebrow, title);
  dialogHead.append(warningMark, headingCopy);
  const destinationLabel = document.createElement("p");
  destinationLabel.className = "destination-label";
  destinationLabel.textContent = "Destino real";
  const domain = document.createElement("p");
  domain.className = "domain";
  domain.textContent = analysis.domain.unicodeRegistrableDomain ?? analysis.domain.hostname ?? anchor.href;
  const explanation = document.createElement("p");
  explanation.className = "explanation";
  explanation.textContent = "Encontramos sinais comuns em links de phishing. Confira o endereço antes de continuar.";

  const list = document.createElement("ul");
  analysis.findings
    .filter((item) => item.severity !== "info")
    .slice(0, 4)
    .forEach((item) => {
      const row = document.createElement("li");
      row.textContent = item.title;
      list.append(row);
    });

  const actions = document.createElement("div");
  actions.className = "actions";
  const cancel = document.createElement("button");
  cancel.className = "cancel";
  cancel.textContent = "Voltar em segurança";
  cancel.addEventListener("click", closeWarning);
  const proceed = document.createElement("button");
  proceed.className = "proceed";
  proceed.textContent = "Continuar mesmo assim";
  proceed.addEventListener("click", () => openDestination(anchor));
  actions.append(cancel, proceed);

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .overlay { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
      padding: clamp(28px, 6vw, 88px); overflow: auto; background: #b42318; color: #fff;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif; animation: danger-enter .22s ease-out; }
    .dialog { width: min(760px, 100%); color: #fff; }
    .dialog-head { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 32px; }
    .warning-mark { display: grid; width: 58px; height: 58px; flex: none; place-items: center; border: 2px solid rgba(255,255,255,.72);
      border-radius: 50%; background: #fff; color: #b42318; font: 850 30px/1 system-ui, sans-serif; }
    .eyebrow { margin: 1px 0 5px; color: rgba(255,255,255,.78); font-size: 14px; font-weight: 650; line-height: 1.35; }
    h2 { margin: 0; color: #fff; font-size: clamp(32px, 5vw, 48px); line-height: 1.08; letter-spacing: -.035em; }
    .destination-label { margin: 0 0 8px; color: rgba(255,255,255,.74); font-size: 13px; }
    .domain { margin: 0; overflow-wrap: anywhere; padding: 17px 18px; border-radius: 10px; background: #fff;
      color: #9f2f29; font: 750 18px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .explanation { max-width: 650px; margin: 24px 0 14px; color: rgba(255,255,255,.9); font-size: 16px; line-height: 1.55; }
    ul { margin: 0; padding: 0; list-style: none; }
    li { position: relative; padding: 12px 0 12px 22px; border-top: 1px solid rgba(255,255,255,.24);
      color: #fff; font-size: 14px; line-height: 1.45; }
    li::before { position: absolute; top: 18px; left: 3px; width: 6px; height: 6px; border-radius: 50%;
      background: #fff; content: ""; }
    .actions { display: flex; align-items: center; gap: 10px; margin-top: 32px; }
    button { cursor: pointer; border-radius: 9px; padding: 13px 17px; font: 700 14px system-ui, sans-serif; }
    .cancel { border: 1px solid #fff; background: #fff; color: #9f2f29; }
    .cancel:hover { background: #fff5f4; }
    .proceed { border: 1px solid rgba(255,255,255,.58); background: transparent; color: #fff; }
    .proceed:hover { background: rgba(255,255,255,.1); }
    button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
    @keyframes danger-enter { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 600px) {
      .overlay { place-items: start center; padding: 32px 22px; }
      .dialog-head { gap: 13px; margin-bottom: 24px; }
      .warning-mark { width: 44px; height: 44px; font-size: 23px; }
      h2 { font-size: 30px; }
      .domain { font-size: 15px; }
      .explanation { margin-top: 20px; font-size: 14px; }
      .actions { align-items: stretch; flex-direction: column; }
      .cancel { order: -1; }
    }
    @media (prefers-reduced-motion: reduce) { .overlay { animation: none; } }
  `;

  dialog.append(dialogHead, destinationLabel, domain, explanation, list, actions);
  overlay.append(dialog);
  shadow.append(style, overlay);
  document.documentElement.append(host);
  cancel.focus();
}

function clickGuard(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  const target = event.composedPath().find((item) => item instanceof Element) as Element | undefined;
  const anchor = target?.closest<HTMLAnchorElement>("a[href]");
  if (!anchor) return;
  if (!isScannableLink(anchor.getAttribute("href"), anchor.href)) return;

  const analysis = analyses.get(anchor)
    ?? analyzeUrl(anchor.href, { displayText: anchor.textContent ?? "" });
  analyses.set(anchor, analysis);
  decorate(anchor, analysis);
  if (analysis.level !== "high") return;

  event.preventDefault();
  event.stopImmediatePropagation();
  showWarning(anchor, analysis);
}

function disableProtection(): void {
  observer?.disconnect();
  observer = null;
  document.removeEventListener("click", clickGuard, true);
  document.querySelectorAll(`.${CLASS_ATTENTION}, .${CLASS_HIGH}`).forEach((element) => {
    if (element instanceof HTMLAnchorElement) clearDecoration(element);
  });
  document.getElementById(STYLE_ID)?.remove();
  closeWarning();
  window.__mailLinkDefenderInstalled = false;
}

function initialize(): void {
  if (window.__mailLinkDefenderInstalled) return;
  window.__mailLinkDefenderInstalled = true;
  document.addEventListener("click", clickGuard, true);

  const startDomProtection = (): void => {
    if (!document.documentElement) {
      window.setTimeout(startDomProtection, 0);
      return;
    }
    installStyles();
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scanPage, { once: true });
    } else {
      scanPage();
    }
  };

  startDomProtection();
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (response: PageScanSummary) => void) => {
    if (message.type === "MLD_SCAN_PAGE") {
      if (!window.__mailLinkDefenderInstalled) initialize();
      sendResponse(scanPage());
    }
    if (message.type === "MLD_GET_SCAN_SUMMARY") sendResponse(lastSummary);
    if (message.type === "MLD_DISABLE_PAGE") {
      disableProtection();
      sendResponse(lastSummary);
    }
  }
);

async function initializeFromSettings(): Promise<void> {
  const stored = await chrome.storage.local.get("gmailProtectionEnabled");
  if (stored.gmailProtectionEnabled !== false) initialize();
}

void initializeFromSettings();
