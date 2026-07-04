chrome.action.onClicked.addListener((tab) => {
  // Only run if the user is actually watching a YouTube video or Short
  if (tab.url && (tab.url.includes("youtube.com/watch") || tab.url.includes("youtube.com/shorts"))) {
    // Send a message to the content script to take the snapshot
    chrome.tabs.sendMessage(tab.id, { action: "take_snapshot" }).catch(err => {
      // If the content script isn't loaded (e.g., tab was open before extension installed)
      // inject it dynamically and then send the message again.
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }).then(() => {
        // Wait a tiny bit for the content script to initialize its listener
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: "take_snapshot" });
        }, 100);
      }).catch(injectErr => console.error("Could not inject content script: ", injectErr));
    });
  }
});
