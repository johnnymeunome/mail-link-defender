import { analyzeUrl } from "../src/analyzer/analyze-url";
import type { LinkAnalysis } from "../src/shared/types";

const mode = new URLSearchParams(window.location.search).get("showcase");

function decorate(): LinkAnalysis | null {
  let firstHigh: LinkAnalysis | null = null;
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const analysis = analyzeUrl(anchor.href, { displayText: anchor.textContent ?? "" });
    if (analysis.level === "none") return;
    anchor.classList.add(analysis.level === "high" ? "showcase-high" : "showcase-attention");
    const marker = document.createElement("span");
    marker.className = `showcase-marker ${analysis.level}`;
    marker.textContent = "!";
    anchor.after(marker);
    if (!firstHigh && analysis.level === "high") firstHigh = analysis;
  });
  return firstHigh;
}

function showWarning(analysis: LinkAnalysis): void {
  const overlay = document.createElement("div");
  overlay.className = "showcase-overlay";
  const dialog = document.createElement("section");
  dialog.className = "showcase-dialog";
  dialog.innerHTML = `
    <div class="dialog-head">
      <span class="warning-mark">!</span>
      <div>
        <p class="eyebrow">Perigo detectado · navegação interrompida</p>
        <h2>Este link parece perigoso</h2>
      </div>
    </div>
    <p class="destination-label">Destino real</p>
    <p class="domain"></p>
    <p class="explanation">Encontramos sinais comuns em links de phishing. Confira o endereço antes de continuar.</p>
    <ul></ul>
    <div class="actions">
      <button class="back">Voltar em segurança</button>
      <button class="proceed">Continuar mesmo assim</button>
    </div>
  `;
  dialog.querySelector<HTMLElement>(".domain")!.textContent =
    analysis.domain.unicodeRegistrableDomain ?? analysis.domain.hostname;
  const list = dialog.querySelector("ul")!;
  analysis.findings.filter((finding) => finding.severity !== "info").slice(0, 4).forEach((finding) => {
    const item = document.createElement("li");
    item.textContent = finding.title;
    list.append(item);
  });
  overlay.append(dialog);
  document.body.append(overlay);
}

if (mode) {
  const firstHigh = decorate();
  if (mode === "warning" && firstHigh) showWarning(firstHigh);
}
