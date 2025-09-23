// Entry point for service worker (set this path in manifest)

importScripts('background/analytics.js', 'background/rules.js', 'background/dnr.js');

// On install/update: initialize storage and maybe rules
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Unlocker] Extension installed/updated.");
  initializeRules();
  initializeAnalytics();
});

// Periodic sync for remote rules
chrome.alarms.create("syncRules", { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncRules") fetchAndUpdateRules();
});

// Listen for popup/content messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getStealthStatus") {
    chrome.storage.sync.get("stealth", (data) => sendResponse({ enabled: !!data.stealth }));
    return true;
  }
  if (msg.type === "analyticsEvent") {
    logAnalyticsEvent(msg.event);
    sendResponse({ ok: true });
    return true;
  }
  // Add other message handlers as needed
});

// Hotkey example
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-stealth") {
    chrome.storage.sync.get("stealth", (data) => {
      const newStealth = !data.stealth;
      chrome.storage.sync.set({ stealth: newStealth }, () => {
        chrome.runtime.sendMessage({ type: "stealthToggled", enabled: newStealth });
      });
    });
  }
});

console.log("[Unlocker] Background worker loaded.");