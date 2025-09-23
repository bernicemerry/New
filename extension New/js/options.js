'use strict';

// Default detection patterns (for reset)
const DEFAULT_PATTERNS = [
  'dating', 'match', 'tinder', 'bumble', 'hinge', 'okcupid', 'eharmony',
  'pof', 'rundate', 'tawkify', 'happn', 'feeld', 'coffeemeetsbagel',
  'grindr', 'zoosk', 'elitesingles', 'ourtime', 'silversingles', 'christianmingle',
  'jdate', 'hily', 'clover', 'facebook.com/dating',
  'benaughty', 'wantmatures', 'flirtymature', 'hotandflirty'
];

// Load configurations and patterns on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load site configs
  chrome.storage.sync.get(['sites'], (result) => {
    document.getElementById('config').value = JSON.stringify(result.sites || {}, null, 2);
  });

  // Load detection patterns
  chrome.storage.sync.get(['urlPatterns'], (result) => {
    document.getElementById('patterns').value = (result.urlPatterns || DEFAULT_PATTERNS).join('\n');
  });
});

// Save configurations
document.getElementById('save').addEventListener('click', () => {
  const status = document.getElementById('status');
  const error = document.getElementById('error');
  status.textContent = '';
  error.textContent = '';

  try {
    const config = JSON.parse(document.getElementById('config').value);
    chrome.storage.sync.set({ sites: config }, () => {
      status.textContent = 'Configurations saved successfully!';
      setTimeout(() => status.textContent = '', 3000);
    });
  } catch (e) {
    error.textContent = `Error: Invalid JSON format. ${e.message}`;
  }
});

// Reset to default configurations
document.getElementById('reset').addEventListener('click', () => {
  const defaultConfig = {
    'tinder.com': { css: ['.paywall, .premium-modal { display: none !important; }'], js: ['Object.defineProperty(window, "isPremium", { get: () => true, configurable: false });'], apiRules: [{ id: 1, priority: 1, action: { type: 'modifyHeaders', responseHeaders: [{ header: 'X-Premium-Status', operation: 'set', value: 'unlocked' }] }, condition: { urlFilter: '||tinder.com/api/premium/*', resourceTypes: ['xmlhttprequest'] } }] },
    'bumble.com': { css: ['.b-premium-lock { display: none !important; }'], js: ['window.__BUMBLE__.user.isSubscribed = true;'], apiRules: [{ id: 2, priority: 1, action: { type: 'modifyHeaders', responseHeaders: [{ header: 'X-Subscription', operation: 'set', value: 'active' }] }, condition: { urlFilter: '||bumble.com/api/subscription/*', resourceTypes: ['xmlhttprequest'] } }] },
    'hinge.co': { css: ['.locked-content { display: none !important; }'], js: ['window.HingeApp.user.premium = true;'], apiRules: [] },
    'match.com': { css: ['.premium-overlay { display: none !important; }'], js: [], apiRules: [] },
    'eharmony.com': { css: ['.subscribe-banner { display: none !important; }'], js: [], apiRules: [] },
    'okcupid.com': { css: ['.paywall-container { display: none !important; }'], js: [], apiRules: [] },
    'pof.com': { css: ['.premium-ad { display: none !important; }'], js: [], apiRules: [] },
    'rundate.com': { css: [], js: [], apiRules: [] },
    'tawkify.com': { css: [], js: [], apiRules: [] },
    'benaughty.com': { css: ['.premium-lock, .subscription-prompt { display: none !important; }'], js: ['Object.defineProperty(window, "isPremiumMember", { get: () => true, configurable: false }); window.user.subscriptionActive = true;'], apiRules: [{ id: 6, priority: 1, action: { type: 'modifyHeaders', responseHeaders: [{ header: 'X-Membership-Status', operation: 'set', value: 'premium' }] }, condition: { urlFilter: '||benaughty.com/api/messaging/*', resourceTypes: ['xmlhttprequest'] } }] },
    'wantmatures.com': { css: ['.upgrade-banner, .chat-lock { display: none !important; }'], js: ['window.WantMatures.user.premium = true; Object.defineProperty(window, "canViewFullPhotos", { get: () => true });'], apiRules: [{ id: 7, priority: 1, action: { type: 'modifyHeaders', responseHeaders: [{ header: 'X-Premium-Access', operation: 'set', value: 'unlimited' }] }, condition: { urlFilter: '||wantmatures.com/api/chat/*', resourceTypes: ['xmlhttprequest'] } }] },
    'flirtymature.com': { css: ['.messaging-paywall, .premium-chat-prompt { display: none !important; }'], js: ['window.FlirtyMature.user.unlimitedChats = true; Object.defineProperty(window, "freeMessages", { get: () => Infinity });'], apiRules: [] },
    'hotandflirty.com': { css: ['.profile-paywall, .unlimited-msg-lock { display: none !important; }'], js: ['window.HotAndFlirty.profileAccess = "full"; Object.defineProperty(window, "isSubscribed", { get: () => true });'], apiRules: [{ id: 8, priority: 1, action: { type: 'modifyHeaders', responseHeaders: [{ header: 'X-Flirty-Status', operation: 'set', value: 'premium' }] }, condition: { urlFilter: '||hotandflirty.com/api/search/*', resourceTypes: ['xmlhttprequest'] } }] }
  };
  document.getElementById('config').value = JSON.stringify(defaultConfig, null, 2);
  chrome.storage.sync.set({ sites: defaultConfig }, () => {
    document.getElementById('status').textContent = 'Reset to default configurations!';
    setTimeout(() => document.getElementById('status').textContent = '', 3000);
  });
});

// Save detection patterns
document.getElementById('savePatterns').addEventListener('click', () => {
  const status = document.getElementById('status');
  const error = document.getElementById('error');
  status.textContent = '';
  error.textContent = '';

  const patterns = document.getElementById('patterns').value.split('\n').map(p => p.trim()).filter(p => p);
  chrome.storage.sync.set({ urlPatterns: patterns }, () => {
    status.textContent = 'Detection patterns saved successfully!';
    setTimeout(() => status.textContent = '', 3000);
  });
});

// Export configurations
document.getElementById('export').addEventListener('click', () => {
  chrome.storage.sync.get(['sites', 'urlPatterns'], (result) => {
    const data = JSON.stringify({ sites: result.sites, urlPatterns: result.urlPatterns }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: 'unlocker-config.json',
      saveAs: true
    });
  });
});

// Import configurations
document.getElementById('import').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          chrome.storage.sync.set({ sites: data.sites, urlPatterns: data.urlPatterns }, () => {
            document.getElementById('config').value = JSON.stringify(data.sites, null, 2);
            document.getElementById('patterns').value = (data.urlPatterns || []).join('\n');
            document.getElementById('status').textContent = 'Configurations imported successfully!';
            setTimeout(() => document.getElementById('status').textContent = '', 3000);
          });
        } catch (e) {
          document.getElementById('error').textContent = `Error: Invalid JSON file. ${e.message}`;
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
});

// === Backup and Restore (Step 5) ===

// Download all extension data as a JSON file
function downloadBackup() {
  chrome.storage.sync.get(null, syncData => {
    chrome.storage.local.get(null, localData => {
      const backup = {
        sync: syncData,
        local: localData,
        date: new Date().toISOString(),
        version: chrome.runtime.getManifest().version
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unlocker-backup-${backup.date.slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 500);
    });
  });
}

// Restore all extension data from a backup file
function restoreBackup(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.sync) throw new Error("Invalid backup format");
      chrome.storage.sync.set(backup.sync, () => {
        chrome.storage.local.set(backup.local || {}, () => {
          callback(true);
        });
      });
    } catch (err) {
      callback(false, err.message);
    }
  };
  reader.readAsText(file);
}

// Backup Button
document.getElementById('downloadBackup').onclick = downloadBackup;

// Restore Button
document.getElementById('restoreBackup').onclick = () => {
  document.getElementById('backupFile').click();
};

// Handle File Input
document.getElementById('backupFile').onchange = function () {
  const file = this.files[0];
  if (!file) return;
  restoreBackup(file, (ok, err) => {
    if (ok) {
      document.getElementById('status').textContent = "Restore successful! Reload extension/tabs.";
      document.getElementById('error').textContent = "";
    } else {
      document.getElementById('status').textContent = "";
      document.getElementById('error').textContent = "Restore failed: " + (err || "Unknown error");
    }
  });
};