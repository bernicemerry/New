function updateDNRBlockPaywalls() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "paywall",
          resourceTypes: ["xmlhttprequest"]
        }
      }
    ]
  });
}