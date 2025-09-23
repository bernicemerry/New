// Backup and restore helpers for Universal Dating Premium Unlocker

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