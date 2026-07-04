<div align="center">
  <img src="icons/icon128.png" alt="YouTube Snapshot Logo" width="128" />
  <h1>YouTube Snapshot</h1>
  <p><strong>A lightning-fast Chrome Extension for taking lossless, native-resolution screenshots of YouTube videos and Shorts.</strong></p>
</div>

<br/>

## 📸 Overview
Ever wanted to grab a perfect frame from a YouTube video or Short, only to end up with the progress bar, UI elements, or poor compression ruining the image? 

**YouTube Snapshot** solves this by injecting a native capture button directly into the YouTube player. It pulls the raw frame data straight from the video stream in lossless PNG quality, guaranteeing that your screenshots are exactly as crisp as the original video.

## ✨ Features
*   **Lossless Quality:** Captures raw video frames at native resolution (up to 4K+), ignoring CSS scaling.
*   **Zero UI Clutter:** Grabs the frame data directly, meaning no playheads, pause buttons, or subtitles in the way.
*   **Shorts Support:** Fully supports YouTube Shorts via a seamlessly integrated camera icon in the side action bar.
*   **Keyboard Shortcuts:** Press `[S]` while watching any video to instantly capture the frame without moving your mouse.
*   **MV3 Native:** Built using the modern Manifest V3 architecture with optimized `Offscreen Document` processing to guarantee zero memory leaks and maximum performance.
*   **100% Private:** Operates entirely locally. No analytics, no servers, zero data collection. 

## 🚀 Installation 
*Note: YouTube Snapshot is coming soon to the Chrome Web Store! Until then, you can load it manually as an unpacked extension.*

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** and select the folder containing this repository.
5. Pin the extension to your toolbar!

## ⚙️ How It Works
*   **Button Injection:** The extension uses a lightweight interval loop to ensure the camera button is always seamlessly injected into YouTube's complex Single Page Application (SPA) DOM, adapting instantly when navigating between videos.
*   **Asynchronous Canvas:** Frames are written to an off-DOM HTML5 `<canvas>` and converted asynchronously via `canvas.toBlob()` to prevent the browser's main thread from freezing when compressing large 4K frames.
*   **Offscreen Document Pattern:** The extension securely pipes the raw Base64 data to an ephemeral background Offscreen Document to convert it into a trusted `Blob URL` for silent, native downloading via the `chrome.downloads` API, strictly adhering to Manifest V3 security protocols.

## 🔒 Privacy
This extension requires the `activeTab`, `scripting`, `downloads`, `offscreen`, and `storage` permissions purely for local execution. We do not collect, transmit, or store any personal data. Read the full [Privacy Policy](PRIVACY_POLICY.md).

---
<div align="center">
  <sub>Created with passion by <a href="https://zainyousef.app/">Zain Yousef</a>.</sub>
</div>
