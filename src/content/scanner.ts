import { analyzeUrl } from "../analyzer/analyze-url";
import type { ExtensionMessage, LinkAnalysis, PageScanSummary } from "../shared/types";

declare global {
  interface Window {
    __mailLinkDefenderInstalled?: boolean;
  }
}

const CLASS_ATTENTION = "mld-link-attention";
const CLASS_HIGH = "mld-link-high";
const STYLE_ID = "mld-protection-styles";
const MODAL_HOST_ID = "mld-warning-host";
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
      border-radius: 3px !important;
      outline-offset: 2px !important;
      position: relative !important;
    }
    a.${CLASS_ATTENTION} { outline: 2px solid #d59b00 !important; }
    a.${CLASS_HIGH} { outline: 3px solid #c9362b !important; }
    a.${CLASS_ATTENTION}::after, a.${CLASS_HIGH}::after {
      font: 12px/1 system-ui, sans-serif !important;
      margin-left: 4px !important;
      vertical-align: middle !important;
    }
    a.${CLASS_ATTENTION}::after { content: "⚠"; }
    a.${CLASS_HIGH}::after { content: "⛔"; }
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

function decorate(anchor: HTMLAnchorElement, analysis: LinkAnalysis): void {
  anchor.classList.remove(CLASS_ATTENTION, CLASS_HIGH);
  anchor.removeAttribute("data-mail-link-defender");

  if (analysis.level === "none") return;

  const className = analysis.level === "high" ? CLASS_HIGH : CLASS_ATTENTION;
  anchor.classList.add(className);
  anchor.dataset.mailLinkDefender = analysis.level;
  const reason = analysis.findings.find((item) => item.severity === analysis.level)?.title
    ?? analysis.findings[0]?.title
    ?? "Link merece verificação";
  anchor.title = `${anchor.title ? `${anchor.title}\n` : ""}Mail Link Defender: ${reason}`;
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

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "MAIL LINK DEFENDER";
  const title = document.createElement("h2");
  title.id = "mld-warning-title";
  title.textContent = "Possível link de phishing";
  const domain = document.createElement("p");
  domain.className = "domain";
  domain.textContent = analysis.domain.unicodeRegistrableDomain ?? analysis.domain.hostname ?? anchor.href;
  const explanation = document.createElement("p");
  explanation.textContent = "O link apresenta sinais que merecem verificação antes de continuar.";

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
  cancel.textContent = "Voltar";
  cancel.addEventListener("click", closeWarning);
  const proceed = document.createElement("button");
  proceed.className = "proceed";
  proceed.textContent = "Abrir mesmo assim";
  proceed.addEventListener("click", () => openDestination(anchor));
  actions.append(cancel, proceed);

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .overlay { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
      padding: 24px; background: rgba(17, 24, 39, .72); font-family: system-ui, sans-serif; }
    .dialog { box-sizing: border-box; width: min(480px, 100%); padding: 28px; border-radius: 18px;
      background: #fff; color: #172033; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
    .eyebrow { margin: 0 0 8px; color: #ad261f; font-size: 12px; font-weight: 800; letter-spacing: .1em; }
    h2 { margin: 0 0 12px; font-size: 25px; line-height: 1.2; }
    p { font-size: 15px; line-height: 1.5; }
    .domain { overflow-wrap: anywhere; padding: 12px; border-radius: 10px; background: #fff0ef;
      color: #8d201a; font-family: ui-monospace, monospace; font-weight: 700; }
    ul { margin: 16px 0; padding-left: 22px; font-size: 14px; line-height: 1.6; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
    button { cursor: pointer; border-radius: 9px; padding: 10px 14px; font: 700 14px system-ui, sans-serif; }
    .cancel { border: 0; background: #16243a; color: #fff; }
    .proceed { border: 1px solid #d3d8df; background: #fff; color: #4d5561; }
  `;

  dialog.append(eyebrow, title, domain, explanation, list, actions);
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
    element.classList.remove(CLASS_ATTENTION, CLASS_HIGH);
    element.removeAttribute("data-mail-link-defender");
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
