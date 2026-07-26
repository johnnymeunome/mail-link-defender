import { analyzeUrl } from "../analyzer/analyze-url";
import type { ExtensionMessage, LinkAnalysis, PageScanSummary, RiskLevel } from "../shared/types";

const GMAIL_PATTERN = "https://mail.google.com/*";
const GMAIL_SCRIPT_ID = "mail-link-defender-gmail";
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
const providerToggle = document.querySelector<HTMLInputElement>("#provider-toggle")!;
const scanButton = document.querySelector<HTMLButtonElement>("#scan-page")!;
const scanSummary = document.querySelector<HTMLElement>("#scan-summary")!;
const urlForm = document.querySelector<HTMLFormElement>("#url-form")!;
const urlInput = document.querySelector<HTMLInputElement>("#url-input")!;
let activeTab: chrome.tabs.Tab | undefined;
let currentAnalysis: LinkAnalysis | null = null;

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
  result.hidden = false;
  riskHeading.className = `risk-heading ${analysis.level}`;
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
  scanSummary.textContent = `${summary.scanned} links analisados: ${summary.high} alta suspeita, ${summary.attention} com atenção.`;
}

async function protectionIsEnabled(): Promise<boolean> {
  return chrome.permissions.contains({ origins: [GMAIL_PATTERN] });
}

async function registerGmailProtection(): Promise<void> {
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [GMAIL_SCRIPT_ID] });
  if (existing.length === 0) {
    await chrome.scripting.registerContentScripts([{
      id: GMAIL_SCRIPT_ID,
      matches: [GMAIL_PATTERN],
      js: ["entries/content.js"],
      runAt: "document_start",
      persistAcrossSessions: true
    }]);
  }
}

providerToggle.addEventListener("change", async () => {
  providerToggle.disabled = true;
  try {
    if (providerToggle.checked) {
      const granted = await chrome.permissions.request({ origins: [GMAIL_PATTERN] });
      if (!granted) {
        providerToggle.checked = false;
        return;
      }
      await registerGmailProtection();
      const summary = await sendToActiveTab({ type: "MLD_SCAN_PAGE" });
      renderSummary(summary);
    } else {
      await chrome.scripting.unregisterContentScripts({ ids: [GMAIL_SCRIPT_ID] }).catch(() => undefined);
      if (activeTab?.id) {
        await chrome.tabs.sendMessage(activeTab.id, { type: "MLD_DISABLE_PAGE" } satisfies ExtensionMessage)
          .catch(() => undefined);
      }
      await chrome.permissions.remove({ origins: [GMAIL_PATTERN] });
      scanSummary.textContent = "Proteção automática desativada no Gmail.";
    }
  } finally {
    providerToggle.disabled = false;
  }
});

scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  scanSummary.textContent = "Analisando links visíveis...";
  try {
    renderSummary(await sendToActiveTab({ type: "MLD_SCAN_PAGE" }));
  } catch {
    scanSummary.textContent = "Não foi possível analisar esta página.";
  } finally {
    scanButton.disabled = false;
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
  } else if (activeTab?.url?.startsWith("http")) {
    renderAnalysis(analyzeUrl(activeTab.url));
  }

  if (activeTab?.url?.startsWith("https://mail.google.com/")) {
    protectionCard.hidden = false;
    providerToggle.checked = await protectionIsEnabled();
  }
}

void initialize();
