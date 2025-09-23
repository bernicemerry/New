(function () {
  'use strict';

  console.log('Detector script loaded on:', location.href, 'Frame:', window !== window.top ? 'iframe' : 'main'); // Initial load log

  // Heuristic patterns for detecting dating sites
  const DATING_PATTERNS = {
    urlKeywords: [
      'dating', 'match', 'tinder', 'bumble', 'hinge', 'okcupid', 'eharmony',
      'pof', 'rundate', 'tawkify', 'happn', 'feeld', 'coffeemeetsbagel',
      'grindr', 'zoosk', 'elitesingles', 'ourtime', 'silversingles', 'christianmingle',
      'jdate', 'hily', 'clover', 'facebook.com/dating',
      'benaughty', 'wantmatures', 'flirtymature', 'hotandflirty', 'pay/membership'
    ],
    domKeywords: [
      'swipe right', 'premium subscription', 'unlock matches', 'paywall',
      'subscribe now', 'get premium', 'boost profile', 'see who likes you',
      'match with', 'send a like', 'dating profile',
      'naughty dating', 'upgrade membership', 'premium membership', 'naughty chat',
      'flirt now', 'hook up', 'message lock', 'photo unlock', 'join premium',
      'unlimited messaging', 'membership benefits', 'premium access'
    ],
    metaKeywords: [
      'dating', 'matchmaking', 'romance', 'singles', 'meet people',
      'find love', 'online dating', 'naughty', 'flirt', 'adult dating', 'hook up'
    ]
  };

  // Throttle function to limit DOM scans
  function throttle(fn, wait) {
    let lastCall = 0;
    let timeout;
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

  // Prevent repeated activation/logging for the same session/page
  let alreadyActivated = false;

  // Check if the current page is a dating site
  async function isDatingSite() {
    try {
      // Check URL
      const urlMatch = DATING_PATTERNS.urlKeywords.some(keyword =>
        location.href.toLowerCase().includes(keyword)
      );
      if (urlMatch) return true;

      // Check iframe origin for BeNaughty
      const params = new URLSearchParams(location.search);
      const origin = params.get('origin');
      if (origin && origin.includes('benaughty.com')) {
        return true;
      }

      // Check parent window URL if in iframe
      if (window !== window.top) {
        try {
          const parentUrl = window.top.location.href;
          if (parentUrl.includes('benaughty.com')) {
            return true;
          }
        } catch (e) {
          // Cross-origin: ignore
        }
      }

      // Check window.PP_RESP for paywall pages
      if (window.PP_RESP && window.PP_RESP.action === 'membership') {
        return true;
      }

      // Check meta tags
      const metaTags = document.getElementsByTagName('meta');
      for (let meta of metaTags) {
        const content = (meta.getAttribute('content') || '').toLowerCase();
        const name = (meta.getAttribute('name') || meta.getAttribute('property') || '').toLowerCase();
        if (
          DATING_PATTERNS.metaKeywords.some(keyword => content.includes(keyword)) ||
          DATING_PATTERNS.metaKeywords.some(keyword => name.includes(keyword))
        ) {
          return true;
        }
      }

      // Check DOM content (throttled)
      const bodyText = document.body.innerText.toLowerCase().slice(0, 10000);
      const domMatch = DATING_PATTERNS.domKeywords.some(keyword => bodyText.includes(keyword));
      if (domMatch) return true;

      return false;
    } catch (error) {
      // Only log detection error if an actual error occurs
      console.log('Detection error:', error.message);
      return false;
    }
  }

  // Main detection logic
  async function detectAndActivate() {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!chrome?.runtime) {
        if (!alreadyActivated) {
          console.log('Error: chrome.runtime is undefined. Running in ISOLATED world.');
          alreadyActivated = true;
        }
        return;
      }
      const isSite = await isDatingSite();
      if (isSite && window.top === window && !alreadyActivated) {
        alreadyActivated = true;
        console.log('Dating site detected in main frame, sending activation message');
        chrome.runtime.sendMessage({
          type: 'activateUnlocker',
          url: location.href
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Message error:', chrome.runtime.lastError.message);
            return;
          }
          if (response?.status === 'activated') {
            console.log('Activation successful for', new URL(location.href).hostname);
            chrome.storage.local.set({
              [`detected_${new URL(location.href).hostname}`]: Date.now(),
              [`unlocked_${new URL(location.href).hostname}`]: Date.now()
            });
          }
        });
      } else if (isSite && window.top !== window && !alreadyActivated) {
        alreadyActivated = true;
        console.log('Dating site detected in iframe, skipping activation');
      }
      // No log for "No activation needed" to reduce noise.
    } catch (error) {
      // Only log if an actual error occurs
      console.log('DetectAndActivate error:', error.message);
    }
  }

  // Run detection with retry
  function runDetectionWithRetry(attempts = 3, delay = 2000) {
    detectAndActivate().catch(() => {
      if (attempts > 1) {
        setTimeout(() => runDetectionWithRetry(attempts - 1, delay), delay);
      }
    });
  }

  runDetectionWithRetry();
  const observer = new MutationObserver(throttle(runDetectionWithRetry, 2000));
  observer.observe(document, { childList: true, subtree: true });
})();