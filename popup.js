document.addEventListener('DOMContentLoaded', () => {
  const folderInput = document.getElementById('download-folder');
  const askCheckbox = document.getElementById('ask-before-saving');
  const statusMsg = document.getElementById('save-status');
  const snapshotBtn = document.getElementById('take-snapshot-btn');
  let timeoutId;

  // Load existing setting
  chrome.storage.local.get(['downloadFolder', 'askBeforeSaving'], (result) => {
    if (result.downloadFolder) {
      folderInput.value = result.downloadFolder;
    }
    if (result.askBeforeSaving) {
      askCheckbox.checked = true;
    }
  });

  const showSaved = () => {
    statusMsg.style.opacity = '1';
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      statusMsg.style.opacity = '0';
    }, 1500);
  };

  // Save on input change
  folderInput.addEventListener('input', () => {
    const value = folderInput.value.trim();
    chrome.storage.local.set({ downloadFolder: value }, showSaved);
  });

  askCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ askBeforeSaving: askCheckbox.checked }, showSaved);
  });

  // Handle Take Snapshot button
  snapshotBtn.addEventListener('click', async () => {
    try {
      // Find active YouTube tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].url && (tabs[0].url.includes("youtube.com/watch") || tabs[0].url.includes("youtube.com/shorts"))) {
        
        // Visual feedback on button
        const originalText = snapshotBtn.innerHTML;
        snapshotBtn.innerHTML = 'Capturing...';
        snapshotBtn.style.opacity = '0.8';

        chrome.tabs.sendMessage(tabs[0].id, { action: "take_snapshot" }).catch(err => {
          // If script isn't loaded yet
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"]
          }).then(() => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, { action: "take_snapshot" });
              window.close(); // Close popup after action
            }, 100);
          }).catch(injectErr => {
            console.error("Could not inject:", injectErr);
            snapshotBtn.innerHTML = originalText;
            snapshotBtn.style.opacity = '1';
          });
        }).then(() => {
          if (!chrome.runtime.lastError) {
            // Close popup quickly to let user see snapshot flash
            setTimeout(() => window.close(), 100);
          }
        });
      } else {
        alert("Please open a YouTube video first.");
      }
    } catch (err) {
      console.error(err);
    }
  });
});
