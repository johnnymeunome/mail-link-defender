import { analyzeUrl } from "../analyzer/analyze-url";
import type { ExtensionMessage, LinkAnalysis, PageScanSummary, RiskLevel } from "../shared/types";

const GMAIL_SETTING = "gmailProtectionEnabled";
const levelLabels: Record<RiskLevel, string> = {
  none: "Nenhum indício relevante detectado",
  attention: "Atenção recomendada",
  high: "Alta suspeita"
};

const result = document.querySelector<HTMLElement>("#result")!;
const riskHeading = document.querySelector<HTMLElement>("#risk-heading")!;
const realDomain = document.querySelector<HTMLElement>("#real-domain")!;
const domainDetails = document.querySelector<HTMLDListElement>("#domain-details")!;
const findings = document.querySelector<HTMLUListElement>("#findings")!;
const cleanActions = document.querySelector<HTMLElement>("#clean-actions")!;
const copyClean = document.querySelector<HTMLButtonElement>("#copy-clean")!;
const protectionCard = document.querySelector<HTMLElement>("#protection-card")!;
const protectionStatus = document.querySelector<HTMLElement>("#protection-status")!;
const providerToggle = document.querySelector<HTMLInputElement>("#provider-toggle")!;
const scanButton = document.querySelector<HTMLButtonElement>("#scan-page")!;
const scanActionLabel = document.querySelector<HTMLElement>("#scan-action-label")!;
const scanSummary = document.querySelector<HTMLElement>("#scan-summary")!;
const urlForm = document.querySelector<HTMLFormElement>("#url-form")!;
const urlInput = document.querySelector<HTMLInputElement>("#url-input")!;
let activeTab: chrome.tabs.Tab | undefined;
let currentAnalysis: LinkAnalysis | null = null;
let scanIdleLabel = "Verificar esta página";

type VisualState = RiskLevel | "idle" | "scanning";

function renderVisualState(state: VisualState): void {
  document.body.dataset.scanState = state;
}

function appendDetail(label: string, value: string | null): void {
  if (!value) return;
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value;
  domainDetails.append(term, description);
}

function renderAnalysis(analysis: LinkAnalysis): void {
  currentAnalysis = analysis;
  renderVisualState(analysis.level);
  result.hidden = false;
  result.className = `result ${analysis.level}`;
  riskHeading.className = "risk-heading";
  riskHeading.textContent = levelLabels[analysis.level];
  realDomain.textContent = analysis.domain.unicodeRegistrableDomain
    ?? analysis.domain.unicodeHostname
    ?? analysis.originalUrl;

  domainDetails.replaceChildren();
  appendDetail("Host", analysis.domain.unicodeHostname);
  appendDetail("Subdomínio", analysis.domain.subdomain);
  appendDetail("Sufixo público", analysis.domain.publicSuffix);
  if (analysis.domain.hostname !== analysis.domain.unicodeHostname) {
    appendDetail("Punycode", analysis.domain.hostname);
  }

  findings.replaceChildren();
  if (analysis.findings.length === 0) {
    const item = document.createElement("li");
    item.textContent = "A análise local não encontrou características incomuns. Isso não garante que o site seja legítimo.";
    findings.append(item);
  } else {
    analysis.findings.forEach((finding) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = finding.title;
      const description = document.createElement("span");
      description.textContent = finding.description;
      item.append(title, description);
      findings.append(item);
    });
  }

  cleanActions.hidden = analysis.removedTrackingParameters.length === 0;
}

function renderProtectionStatus(enabled: boolean): void {
  protectionCard.classList.toggle("is-off", !enabled);
  protectionStatus.textContent = enabled ? "Proteção ativa" : "Proteção pausada";
}

function renderScanning(scanning: boolean): void {
  scanButton.classList.toggle("is-scanning", scanning);
  scanButton.disabled = scanning;
  scanButton.setAttribute("aria-label", scanning ? "Analisando links" : scanIdleLabel);
  scanActionLabel.textContent = scanning ? "Analisando links..." : scanIdleLabel;
  if (scanning) renderVisualState("scanning");
}

async function sendToActiveTab(message: ExtensionMessage): Promise<PageScanSummary> {
  if (!activeTab?.id) throw new Error("Nenhuma aba ativa encontrada.");

  try {
    return await chrome.tabs.sendMessage(activeTab.id, message) as PageScanSummary;
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["entries/content.js"]
    });
    return await chrome.tabs.sendMessage(activeTab.id, message) as PageScanSummary;
  }
}

function renderSummary(summary: PageScanSummary): void {
  if (summary.scanned === 0) {
    renderVisualState("idle");
    scanSummary.textContent = "Nenhum link web para verificar";
    return;
  }

  if (summary.high > 0) {
    renderVisualState("high");
    scanSummary.textContent = `${summary.scanned} links verificados · ${summary.high} suspeito${summary.high > 1 ? "s" : ""}`;
    return;
  }

  if (summary.attention > 0) {
    renderVisualState("attention");
    scanSummary.textContent = `${summary.scanned} links verificados · ${summary.attention} exige${summary.attention > 1 ? "m" : ""} atenção`;
    return;
  }

  renderVisualState("none");
  scanSummary.textContent = `${summary.scanned} links verificados · nenhum alerta`;
}

async function protectionIsEnabled(): Promise<boolean> {
  const stored = await chrome.storage.local.get(GMAIL_SETTING);
  return stored[GMAIL_SETTING] !== false;
}

providerToggle.addEventListener("change", async () => {
  providerToggle.disabled = true;
  try {
    if (providerToggle.checked) {
      await chrome.storage.local.set({ [GMAIL_SETTING]: true });
      renderProtectionStatus(true);
      const summary = await sendToActiveTab({ type: "MLD_SCAN_PAGE" });
      renderSummary(summary);
    } else {
      await chrome.storage.local.set({ [GMAIL_SETTING]: false });
      renderProtectionStatus(false);
      if (activeTab?.id) {
        await chrome.tabs.sendMessage(activeTab.id, { type: "MLD_DISABLE_PAGE" } satisfies ExtensionMessage)
          .catch(() => undefined);
      }
      scanSummary.textContent = "Proteção automática desativada no Gmail.";
      renderVisualState("idle");
    }
  } finally {
    providerToggle.disabled = false;
  }
});

scanButton.addEventListener("click", async () => {
  renderScanning(true);
  scanSummary.textContent = "";
  try {
    renderSummary(await sendToActiveTab({ type: "MLD_SCAN_PAGE" }));
  } catch {
    renderVisualState("idle");
    scanSummary.textContent = "Não foi possível analisar esta página.";
  } finally {
    renderScanning(false);
  }
});

urlForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!urlInput.value.trim()) return;
  renderAnalysis(analyzeUrl(urlInput.value));
});

copyClean.addEventListener("click", async () => {
  if (!currentAnalysis) return;
  await navigator.clipboard.writeText(currentAnalysis.cleanUrl);
  copyClean.textContent = "Link limpo copiado";
  window.setTimeout(() => { copyClean.textContent = "Copiar link sem rastreadores"; }, 1500);
});

async function initialize(): Promise<void> {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pending = await chrome.storage.session.get("pendingAnalysis");
  if (pending.pendingAnalysis) {
    renderAnalysis(pending.pendingAnalysis as LinkAnalysis);
    await chrome.storage.session.remove("pendingAnalysis");
  }

  if (activeTab?.url?.startsWith("https://mail.google.com/")) {
    protectionCard.hidden = false;
    providerToggle.checked = await protectionIsEnabled();
    renderProtectionStatus(providerToggle.checked);
    scanIdleLabel = "Verificar este e-mail";
    renderScanning(false);
    try {
      renderSummary(await sendToActiveTab({ type: "MLD_GET_SCAN_SUMMARY" }));
    } catch {
      scanSummary.textContent = "A proteção será iniciada ao abrir um e-mail.";
    }
  } else if (!pending.pendingAnalysis && activeTab?.url?.startsWith("http")) {
    renderAnalysis(analyzeUrl(activeTab.url));
  }
}

void initialize();
