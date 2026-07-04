// Helper to create an offscreen document
let creating;
async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one 
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['BLOBS'],
      justification: 'To convert base64 snapshot data to a Blob URL for silent downloading'
    });
    await creating;
    creating = null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_snapshot") {

    // First, get user settings
    chrome.storage.local.get(['downloadFolder', 'askBeforeSaving'], async (data) => {
      let filename = request.filename;

      // If user specified a download folder in the popup settings
      if (data.downloadFolder) {
        // Sanitize: replace backslashes, remove leading/trailing slashes
        const folder = data.downloadFolder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
        if (folder.length > 0) {
          filename = folder + "/" + filename;
        }
      }

      // Set up offscreen document
      await setupOffscreenDocument('offscreen.html');

      // Forward the data to the offscreen document to create a Blob URL
      chrome.runtime.sendMessage({
        action: "download_snapshot_offscreen",
        dataUrl: request.dataUrl
      }, (response) => {
        if (response && response.blobUrl) {
          chrome.downloads.download({
            url: response.blobUrl,
            filename: filename,
            saveAs: !!data.askBeforeSaving
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error("Download failed:", chrome.runtime.lastError);
            }
            URL.revokeObjectURL(response.blobUrl);
          });
        }
      });

      resetOffscreenTimer();
    });

    // Returning true is optional since we're not using sendResponse, but good practice if async
    return true;
  }
});

let offscreenTimeout;

function resetOffscreenTimer() {
  clearTimeout(offscreenTimeout);
  // Close the offscreen document if idle for 30 seconds
  offscreenTimeout = setTimeout(() => {
    chrome.offscreen.closeDocument().then(() => {
      creating = null;
    }).catch(() => { }); // Ignore errors if it's already closed
  }, 30000);
}
