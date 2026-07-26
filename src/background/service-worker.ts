import { analyzeUrl } from "../analyzer/analyze-url";

const ANALYZE_MENU_ID = "mail-link-defender-analyze";

chrome.runtime.onInstalled.addListener(() => {
  void chrome.contextMenus.removeAll().then(() => {
    chrome.contextMenus.create({
      id: ANALYZE_MENU_ID,
      title: "Analisar link com Mail Link Defender",
      contexts: ["link"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== ANALYZE_MENU_ID || !info.linkUrl) return;

  const analysis = analyzeUrl(info.linkUrl);
  void chrome.storage.session
    .set({ pendingAnalysis: analysis })
    .then(() => chrome.action.openPopup())
    .catch((error: unknown) => {
      console.error("Mail Link Defender: não foi possível abrir o resultado", error);
    });
});
