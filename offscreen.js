chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_snapshot_offscreen") {
    createBlobUrl(request.dataUrl).then(blobUrl => {
      sendResponse({ blobUrl: blobUrl });
    });
    return true; // Keep the message channel open for async response
  }
});

async function createBlobUrl(dataUrl) {
  try {
    // Convert base64 data url to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a Blob URL
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error creating blob:", err);
    return null;
  }
}
