(function () {
  'use strict';

  // === Advanced Browser Fingerprint Evasion Module (2025) ===

  // Expanded user-agent pool (common 2025 browsers, including desktop and mobile)
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/114.0.0.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
    'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Vivaldi/6.9.3447.41',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/114.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (iPad; CPU OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-A546U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  ];

  // Spoof user-agent (random from pool each access)
  try {
    Object.defineProperty(navigator, 'userAgent', {
      get: () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      configurable: false
    });
  } catch (e) {
    // Silent error handling
  }

  // Spoof canvas fingerprint (add subtle noise)
  try {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attributes) {
      const context = originalGetContext.call(this, type, attributes);
      if (type === '2d') {
        const originalGetImageData = context.getImageData;
        context.getImageData = function (x, y, width, height) {
          const data = originalGetImageData.call(this, x, y, width, height);
          // Add subtle noise to pixel data
          for (let i = 0; i < data.data.length; i += 4) {
            data.data[i] = data.data[i] ^ (Math.random() > 0.5 ? 1 : 0);
            data.data[i + 1] = data.data[i + 1] ^ (Math.random() > 0.5 ? 1 : 0);
            data.data[i + 2] = data.data[i + 2] ^ (Math.random() > 0.5 ? 1 : 0);
          }
          return data;
        };
      }
      return context;
    };
  } catch (e) {
    // Silent error handling
  }

  // Spoof WebGL properties
  try {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37446) { // UNMASKED_VENDOR_WEBGL
        return 'WebKit';
      } else if (parameter === 37447) { // UNMASKED_RENDERER_WEBGL
        return 'WebKit WebGL';
      }
      return originalGetParameter.call(this, parameter);
    };
  } catch (e) {
    // Silent error handling
  }

  // Spoof screen properties
  try {
    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1080,
        colorDepth: 24,
        pixelDepth: 24
      },
      writable: false
    });
  } catch (e) {
    // Silent error handling
  }

  // Block WebRTC to prevent IP leaks
  try {
    Object.defineProperty(navigator, 'getUserMedia', { value: undefined, writable: false });
    Object.defineProperty(navigator, 'webkitGetUserMedia', { value: undefined, writable: false });
    Object.defineProperty(navigator, 'mozGetUserMedia', { value: undefined, writable: false });
  } catch (e) {
    // Silent error handling
  }

  // Hide webdriver (headless detection)
  try {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined, configurable: true });
  } catch (e) {
    // Silent error handling
  }

  // Hide languages array anomaly
  try {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true
    });
  } catch (e) {}

  // Hide headless Chrome runtime
  try {
    if (!window.chrome || !window.chrome.runtime) {
      window.chrome = { runtime: {} };
    }
  } catch (e) {}

  // Patch permissions API (for notifications)
  try {
    if (window.navigator.permissions && window.navigator.permissions.query) {
      const origQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = function(params) {
        if (params && params.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission });
        }
        return origQuery.apply(this, arguments);
      };
    }
  } catch (e) {}

  // Patch outerWidth/outerHeight for anti-debugging
  try {
    Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth + 100, configurable: true });
    Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight + 100, configurable: true });
  } catch (e) {}

})();