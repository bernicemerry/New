const REMOTE_RULES_URL = ""; // Fill this if you want remote sync

function initializeRules() {
  if (!REMOTE_RULES_URL) return;
  fetchAndUpdateRules();
}

function fetchAndUpdateRules() {
  if (!REMOTE_RULES_URL) return;
  fetch(REMOTE_RULES_URL)
    .then(r => r.json())
    .then(remoteRules => chrome.storage.sync.set({ sites: remoteRules }))
    .catch(e => console.warn("[Unlocker] Remote rules sync failed:", e));
}