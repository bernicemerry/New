// Unlocker Rule Debugger Logic

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const domain = new URL(tab.url).hostname.replace(/^www\./, '');
  document.getElementById('currentDomain').textContent = domain;

  // Load existing config for site
  chrome.storage.sync.get(['sites'], ({ sites }) => {
    const rule = sites?.[domain] || {};
    document.getElementById('cssInput').value = (rule.css || []).join('\n');
    document.getElementById('jsInput').value = (rule.js || []).join('\n');
  });

  // Test CSS: Show matches live
  document.getElementById('testCss').onclick = async () => {
    const css = document.getElementById('cssInput').value.split('\n').filter(Boolean);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (css) => {
        const matches = [];
        css.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => matches.push(`${sel}: ${el.outerHTML.slice(0, 80)}`));
        });
        return matches;
      },
      args: [css]
    }, ([result]) => {
      document.getElementById('liveResult').textContent = (result?.result || []).join('\n');
      document.getElementById('status').textContent = `Found ${result?.result.length || 0} matches.`;
    });
  };

  // Test JS: Run and catch error/output
  document.getElementById('testJs').onclick = async () => {
    const code = document.getElementById('jsInput').value;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (code) => {
        try {
          return {ok:true, out:eval(code)};
        } catch(e) {
          return {ok:false, out:e.toString()};
        }
      },
      args: [code]
    }, ([result]) => {
      document.getElementById('liveResult').textContent = result?.result.ok ? `Output: ${result.result.out}` : `Error: ${result.result.out}`;
      document.getElementById('status').textContent = result?.result.ok ? 'Success' : 'JS Error';
    });
  };

  // Apply Rule: Save to storage and signal content script
  document.getElementById('applyRule').onclick = () => {
    const css = document.getElementById('cssInput').value.split('\n').filter(Boolean);
    const js = document.getElementById('jsInput').value.split('\n').filter(Boolean);
    chrome.storage.sync.get(['sites'], ({ sites }) => {
      sites = sites || {};
      sites[domain] = { css, js };
      chrome.storage.sync.set({ sites }, () => {
        chrome.tabs.sendMessage(tab.id, { type: 'applyRules', rules: sites[domain] });
        document.getElementById('status').textContent = 'Rules applied and saved.';
      });
    });
  };

  // Undo Rule: Restore from previous (not implemented, add versioning for advanced users)
  document.getElementById('undoRule').onclick = () => {
    document.getElementById('status').textContent = 'Undo not implemented yet.';
  };
});