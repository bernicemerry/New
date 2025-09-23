(function () {
  'use strict';

  // === Advanced Unlocker Script with Analytics, Anti-Debug, Remote Config, Shadow DOM, and Stealth ===

  // === Configuration ===
  const DEBUG = true; // Set to false in production for silent operation
  const REMOTE_CONFIG_URL = ""; // Place your remote config endpoint here if desired

  // === Logging ===
  function log(...args) { if (DEBUG) console.log('[Unlocker]', ...args); }

  // === DOM Ready Utility ===
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  }

  // === Throttle Utility ===
  function throttle(fn, wait) {
    let lastCall = 0, timeout;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        return fn(...args);
      }
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, wait - (now - lastCall));
    };
  }

  function getDomain() {
    return new URL(location.href).hostname.replace(/^www\./, '');
  }

  // === CSP-Resilient JS Injection ===
  function injectJS(jsCode) {
    try {
      const el = document.createElement('script');
      el.textContent = jsCode;
      document.head.appendChild(el);
      el.remove();
      log('Injected JS via <script> tag');
      return true;
    } catch {}
    try {
      // eslint-disable-next-line no-new-func
      (new Function(jsCode))();
      log('Injected JS via Function constructor');
      return true;
    } catch {}
    try {
      eval(jsCode);
      log('Injected JS via eval');
      return true;
    } catch (e) {
      log('Failed JS injection:', e);
      return false;
    }
  }

  // === CSP-Resilient CSS Injection ===
  function injectCSS(cssLines, id = '') {
    try {
      const style = document.createElement('style');
      if (id) style.id = id;
      style.textContent = cssLines.join('\n');
      document.head.appendChild(style);
      log('Injected CSS', id ? `(id=${id})` : '');
      return true;
    } catch (e) {
      log('Failed CSS injection:', e);
      return false;
    }
  }

  // === Stealth: Spoof Premium Indicators & Navigator ===
  function spoofPremiumIndicators() {
    const premiumProps = [
      ['isPremium', true],
      ['isSubscribed', true],
      ['hasSubscription', true],
      ['userPremium', true],
      ['membershipActive', true]
    ];
    premiumProps.forEach(([prop, val]) => {
      try {
        Object.defineProperty(window, prop, {
          get: () => val,
          configurable: true
        });
      } catch {
        window[prop] = val;
      }
    });
    // Spoof navigator object for anti-fingerprinting
    try {
      if (!window.navigator.unlockerSpoofed) {
        window.navigator = new Proxy(window.navigator, {
          get(target, prop) {
            if (prop === 'userAgentData') {
              return { platform: 'Windows', brands: [{brand:'Chromium', version:'114'}], mobile: false };
            }
            return target[prop];
          }
        });
        window.navigator.unlockerSpoofed = true;
        log('Navigator proxied');
      }
    } catch {}
    log('Premium properties spoofed');
  }

  // === Paywall/Modal Selectors (Extensible) ===
  const PAYWALL_CLASSES = [
    '.paywall', '.premium-modal', '.locked-content', '.subscribe-banner',
    '.premium-lock', '.subscription-prompt', '.subscription-modal',
    '.premium-blur', '.chat-lock', '.photo-blur', '.upgrade-banner', '.membership-overlay'
  ];

  // === Paywall Hide Logic (Shadow DOM aware) ===
  function hidePaywalls(root = document) {
    PAYWALL_CLASSES.forEach(cls => {
      root.querySelectorAll?.(cls).forEach(el => {
        el.style.display = 'none';
        log('Paywall node hidden:', el.className || el.id || el.tagName);
      });
    });
  }

  function traverseAndHideShadowPaywalls(node) {
    if (!node) return;
    hidePaywalls(node);
    if (node.shadowRoot) hidePaywalls(node.shadowRoot);
    node.childNodes?.forEach(child => traverseAndHideShadowPaywalls(child));
  }

  // === Mutation Observer with Cleanup ===
  let paywallObserver = null;
  function startPaywallObserver() {
    if (paywallObserver) paywallObserver.disconnect();
    paywallObserver = new MutationObserver(
      throttle((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              traverseAndHideShadowPaywalls(node);
            }
          }
        }
      }, 1000)
    );
    paywallObserver.observe(document.body, { childList: true, subtree: true });
    log('Paywall observer started');
  }

  // === SPA Navigation Detection ===
  let lastUnlockUrl = null;
  function needsUnlock() { return location.href !== lastUnlockUrl; }

  // === Remote Config Fetch (Optional) ===
  function fetchRemoteConfig(domain, cb) {
    if (!REMOTE_CONFIG_URL) return cb(null);
    fetch(REMOTE_CONFIG_URL)
      .then(r => r.json())
      .then(config => cb(config?.[domain] || null))
      .catch(e => {
        log('Remote config fetch failed:', e);
        cb(null);
      });
  }

  // === Analytics/Event Hooks ===
  function trackEvent(type, detail) {
    // Log locally or send to background/remote server
    log('Analytics:', type, detail);
    // Optionally, send to background or remote endpoint
    // chrome.runtime.sendMessage({ type: 'analytics', event: { type, detail } });
  }

  // === Anti-Debugging (Basic) ===
  function setupAntiDebug() {
    setInterval(() => {
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        log('Debugger likely detected, taking action');
        // Optionally: window.location.reload(); or obfuscate
      }
    }, 1000);
  }

  // === Main Unlock Logic, Per-Domain, Per-Session ===
  function applyUnlockRules(force = false) {
    if (!force && !needsUnlock()) return;
    lastUnlockUrl = location.href;
    if (paywallObserver) { paywallObserver.disconnect(); paywallObserver = null; }

    const domain = getDomain();

    fetchRemoteConfig(domain, (remoteConfig) => {
      function proceedWithConfig(siteConfig) {
        // JS overrides
        if (Array.isArray(siteConfig?.js) && siteConfig.js.length) {
          for (const script of siteConfig.js) injectJS(script);
          log('JS overrides applied');
        }
        // CSS overrides
        if (Array.isArray(siteConfig?.css) && siteConfig.css.length) injectCSS(siteConfig.css, "unlocker-css");

        // Stealth fingerprint module
        try {
          const stealthScript = document.createElement('script');
          stealthScript.src = chrome.runtime.getURL('js/stealth/fingerprint.js');
          stealthScript.onload = () => stealthScript.remove();
          document.head.appendChild(stealthScript);
          log('Stealth fingerprint module injected');
        } catch (e) { log('Stealth injection error:', e); }

        // Paywall observer + initial hide
        startPaywallObserver();
        hidePaywalls();

        // Spoof premium
        spoofPremiumIndicators();

        // Analytics/event hook
        trackEvent('unlock_success', { domain, url: location.href });

        // Store unlock success
        chrome.storage.local.set({ [`unlocked_${domain}`]: Date.now() });
        log('Unlock success stored for', domain);
      }

      if (remoteConfig) {
        log('Using remote config for', domain);
        proceedWithConfig(remoteConfig);
      } else {
        chrome.runtime.sendMessage({ type: 'getStealthStatus' }, (response) => {
          if (chrome.runtime.lastError || !response?.enabled) {
            log('Stealth mode disabled or error');
            return;
          }
          chrome.storage.sync.get(['sites'], (result) => {
            const siteConfig = result.sites?.[domain] || {};
            proceedWithConfig(siteConfig);
          });
        });
      }
    });
  }

  // === DOM Ready: Run Unlock Logic ===
  onReady(() => {
    log('DOM ready, running unlocker');
    applyUnlockRules();
    setupAntiDebug();
  });

  // === SPA Navigation Watcher ===
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      applyUnlockRules(true);
      trackEvent('spa_navigate', { url: location.href });
    }
  }, 800);
  window.addEventListener('popstate', () => applyUnlockRules(true));
  window.addEventListener('pushstate', () => applyUnlockRules(true));

})();