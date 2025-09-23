'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const statusElement = document.getElementById('status');
  const toggleStealthButton = document.getElementById('toggleStealth');
  const openOptionsButton = document.getElementById('openOptions');

  // Check current tab and extension status
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      const domain = new URL(tabs[0].url).hostname.replace(/^www\./, '');
      chrome.storage.local.get([`unlocked_${domain}`, 'stealthMode'], (result) => {
        const isUnlocked = result[`unlocked_${domain}`];
        const stealthMode = result.stealthMode !== false; // Default to true
        statusElement.textContent = isUnlocked
          ? `Active on ${domain} (Stealth: ${stealthMode ? 'On' : 'Off'})`
          : `Inactive on ${domain} (Stealth: ${stealthMode ? 'On' : 'Off'})`;
        statusElement.classList.toggle('active', isUnlocked);
        toggleStealthButton.textContent = stealthMode ? 'Disable Stealth Mode' : 'Enable Stealth Mode';
      });
    } else {
      statusElement.textContent = 'No active tab detected';
    }
  });

  // Toggle stealth mode
  toggleStealthButton.addEventListener('click', () => {
    chrome.storage.local.get(['stealthMode'], (result) => {
      const newState = !result.stealthMode;
      chrome.storage.local.set({ stealthMode: newState }, () => {
        chrome.runtime.sendMessage({ type: 'getStealthStatus' }, (response) => {
          if (chrome.runtime.lastError) return;
          const statusText = response.enabled ? 'Stealth mode enabled' : 'Stealth mode disabled';
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Stealth Mode',
            message: statusText
          });
          // Update status in popup
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
              const domain = new URL(tabs[0].url).hostname.replace(/^www\./, '');
              chrome.storage.local.get([`unlocked_${domain}`], (result) => {
                const isUnlocked = result[`unlocked_${domain}`];
                statusElement.textContent = isUnlocked
                  ? `Active on ${domain} (Stealth: ${newState ? 'On' : 'Off'})`
                  : `Inactive on ${domain} (Stealth: ${newState ? 'On' : 'Off'})`;
                statusElement.classList.toggle('active', isUnlocked);
                toggleStealthButton.textContent = newState ? 'Disable Stealth Mode' : 'Enable Stealth Mode';
              });
            }
          });
        });
      });
    });
  });

  // Open options page
  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});