(function () {
  'use strict';

  // xAI API configuration with provided key
  const XAI_API_CONFIG = {
    endpoint: 'https://api.x.ai/v1/chat/completions',
    apiKey: 'xai-S1Ta8W0MoRxL9bSwiUmioatH5YPXFIrRGwaw705HcCGW9sYArfohG4o5BRfVqqWLCArd3AslwmuXXQDM',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer xai-S1Ta8W0MoRxL9bSwiUmioatH5YPXFIrRGwaw705HcCGW9sYArfohG4o5BRfVqqWLCArd3AslwmuXXQDM'
    }
  };

  // Community server configuration (optional, placeholder)
  const COMMUNITY_SERVER = ''; // e.g., 'https://your-community-server.com/rules'

  // Validate API rules for MV3 compliance
  function validateApiRules(rules) {
    return rules.every(rule => {
      return (
        Number.isInteger(rule.id) &&
        rule.priority >= 1 &&
        rule.action?.type === 'modifyHeaders' &&
        rule.condition?.urlFilter &&
        Array.isArray(rule.condition.resourceTypes) &&
        rule.action.responseHeaders?.every(header => header.header && header.operation && header.value)
      );
    });
  }

  // Fetch rules from xAI API
  async function fetchXaiRules() {
    try {
      const domains = Object.keys(DEFAULT_SITES_CONFIG || {});
      const response = await fetch(XAI_API_CONFIG.endpoint, {
        method: 'POST',
        headers: XAI_API_CONFIG.headers,
        body: JSON.stringify({
          model: 'grok-4-fast', // Cost-efficient model; use 'grok-4' for advanced
          messages: [
            {
              role: 'user',
              content: `Generate unlock rules for dating sites: ${domains.join(', ')}. Return a JSON object with CSS selectors, JS scripts, and API rules (MV3-compliant). Example: { "tinder.com": { "css": [".paywall { display: none !important; }"], "js": ["Object.defineProperty(window, 'isPremium', { get: () => true });"], "apiRules": [{ "id": 1, "priority": 1, "action": { "type": "modifyHeaders", "responseHeaders": [{ "header": "X-Premium-Status", "operation": "set", "value": "unlocked" }] }, "condition": { "urlFilter": "||tinder.com/api/premium/*", "resourceTypes": ["xmlhttprequest"] } }] } }`
            }
          ],
          max_tokens: 1000 // Increased for complex rules
        })
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded');
        if (response.status === 401) throw new Error('Invalid API key');
        throw new Error(`xAI API error: ${response.status}`);
      }

      const data = await response.json();
      const rules = data.choices[0]?.message?.content ? JSON.parse(data.choices[0].message.content) : {};
      return rules;
    } catch (e) {
      console.log('xAI API fetch failed:', e.message);
      return null;
    }
  }

  // Fetch community rules (optional)
  async function fetchCommunityRules() {
    if (!COMMUNITY_SERVER) return null;
    try {
      const response = await fetch(COMMUNITY_SERVER);
      if (!response.ok) throw new Error(`Community server error: ${response.status}`);
      const data = await response.json();
      return data.rules || {};
    } catch (e) {
      console.log('Community rules fetch failed:', e.message);
      return null;
    }
  }

  // Merge and apply new rules
  async function updateRules() {
    try {
      // Fetch rules (prioritize xAI API, fallback to community)
      let newRules = await fetchXaiRules();
      if (!newRules && COMMUNITY_SERVER) {
        newRules = await fetchCommunityRules();
      }

      if (!newRules) {
        console.log('No new rules fetched');
        return;
      }

      // Validate and merge with existing configs
      chrome.storage.sync.get(['sites'], (result) => {
        const currentConfig = result.sites || {};
        const updatedConfig = { ...currentConfig };

        for (const [domain, config] of Object.entries(newRules)) {
          if (config.css && Array.isArray(config.css) &&
              config.js && Array.isArray(config.js) &&
              config.apiRules && Array.isArray(config.apiRules) &&
              validateApiRules(config.apiRules)) {
            updatedConfig[domain] = {
              css: config.css,
              js: config.js,
              apiRules: config.apiRules.map((rule, index) => ({
                ...rule,
                id: 100 + index // Reserve IDs 1-99 for defaults
              }))
            };
          }
        }

        // Save updated configs
        chrome.storage.sync.set({ sites: updatedConfig }, () => {
          console.log('Updated site configurations with new rules');
          // Apply new API rules
          const allApiRules = Object.values(updatedConfig).flatMap(config => config.apiRules || []);
          if (allApiRules.length) {
            chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: Array.from({ length: 1000 }, (_, i) => i + 1), // Clear all rules
              addRules: allApiRules
            }, () => {
              console.log(`Applied ${allApiRules.length} new network rules`);
            });
          }

          // Notify user of update
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Rules Updated',
            message: 'New unlock rules fetched and applied!'
          });
        });
      });
    } catch (e) {
      console.log('Rule update failed:', e.message);
      // Notify user of failure
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Rule Update Failed',
        message: `Failed to fetch new rules: ${e.message}`
      });
    }
  }

  // Run update immediately
  updateRules();
})();