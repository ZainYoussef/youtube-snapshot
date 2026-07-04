function takeSnapshot() {
  // On Shorts, there are multiple video tags. The active one is inside an element with the '.is-active' class.
  const video = document.querySelector('.is-active video') || document.querySelector('video');

  if (!video) {
    alert('No video element found. Make sure a video is playing.');
    return;
  }

  // Get the native resolution of the video stream currently loaded
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (width === 0 || height === 0) {
    alert('The video stream has not fully loaded yet.');
    return;
  }

  // Create an off-screen canvas with the exact native video resolution
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  
  // Draw the current video frame onto the canvas
  context.drawImage(video, 0, 0, width, height);

  // --- Snapshot Flash Effect (Do this instantly before any processing) ---
  const flash = document.createElement('div');
  flash.style.position = 'absolute';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.backgroundColor = 'black'; // More subtle color
  flash.style.zIndex = '9999'; // Ensure it's on top of the video
  flash.style.opacity = '0.4'; // Less intense opacity
  flash.style.transition = 'opacity 0.2s ease-out'; // Much quicker fade
  flash.style.pointerEvents = 'none'; // Don't block clicks
  
  // Attach to the main player container (or video parent for shorts)
  const player = document.querySelector('.is-active .html5-video-player') || document.querySelector('.html5-video-player') || video.parentElement;
  if (player) {
      player.appendChild(flash);
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              flash.style.opacity = '0';
          });
      });
      setTimeout(() => {
          if (flash.parentElement) flash.parentElement.removeChild(flash);
      }, 200); // Wait for the 0.2s transition to finish
  }

  // Grab the video title for a clean file name (Shorts use a different title element)
  const titleElement = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('.is-active h2.yt-core-attributed-string');
  let title = 'youtube_snapshot';
  if (titleElement) {
      // Keep all letters (including Arabic/Unicode) and numbers, replacing others with underscores
      title = titleElement.innerText
          .replace(/[^\p{L}\p{N}]/gu, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      
      if (!title) title = 'youtube_snapshot'; 
  }
  
  // Get the current timestamp (in seconds)
  const time = Math.floor(video.currentTime);
  
  // Convert to PNG asynchronously to PREVENT VIDEO LAG
  canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = function() {
          const filename = `${title}_${width}x${height}_${time}s.png`;
          chrome.runtime.sendMessage({
              action: "download_snapshot",
              dataUrl: reader.result,
              filename: filename
          });
      };
      reader.readAsDataURL(blob);
  }, 'image/png');
}

// Button Injection Logic
function injectButton() {
  // Prevent duplicate injections
  if (document.getElementById('yt-snapshot-btn')) return;

  const isShorts = window.location.pathname.startsWith('/shorts');
  
  if (isShorts) {
    // Shorts Injection
    const actionContainer = document.querySelector('.is-active .ytReelPlayerOverlayViewModelActionsContainer reel-action-bar-view-model') || document.querySelector('.ytReelPlayerOverlayViewModelActionsContainer reel-action-bar-view-model');
    if (!actionContainer) return;
    
    const btn = document.createElement('button');
    btn.id = 'yt-snapshot-btn';
    btn.setAttribute('aria-label', 'Take Snapshot');
    btn.title = 'Take Snapshot'; // Simple title for shorts since we're matching standard shorts tooltips
    
    // Shorts button styling classes
    btn.className = 'ytSpecButtonShapeNextHost ytSpecButtonShapeNextTonal ytSpecButtonShapeNextMono ytSpecButtonShapeNextSizeL ytSpecButtonShapeNextIconButton ytSpecButtonShapeNextEnableBackdropFilterExperiment';
    btn.style.marginBottom = '16px'; // Add space between this and the Like button below it
    
    btn.innerHTML = `
      <div aria-hidden="true" class="ytSpecButtonShapeNextIcon">
        <span class="ytIconWrapperHost" style="width: 24px; height: 24px;">
          <span class="yt-icon-shape ytSpecIconShapeHost">
            <div style="width: 100%; height: 100%; display: block; fill: currentcolor;">
              <svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
                <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"></path>
              </svg>
            </div>
          </span>
        </span>
      </div>
    `;
    
    btn.addEventListener('click', takeSnapshot);
    // Insert at the top of the action bar
    actionContainer.insertBefore(btn, actionContainer.firstChild);

  } else {
    // Normal Watch Page Injection
    const rightControls = document.querySelector('.ytp-right-controls-right') || document.querySelector('.ytp-right-controls');
    if (!rightControls) return;

    // Create the button
    const btn = document.createElement('button');
    btn.id = 'yt-snapshot-btn';
    btn.className = 'ytp-button';
    btn.setAttribute('aria-label', 'Take Snapshot');
    
    // Create our own tooltip that perfectly mimics YouTube's style
    btn.addEventListener('mouseenter', () => {
      let tooltip = document.getElementById('yt-snapshot-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'yt-snapshot-tooltip';
        tooltip.style.position = 'fixed'; // Safe for getBoundingClientRect
        tooltip.style.background = 'rgba(28, 28, 28, 0.45)'; // Match the player controls background (even lower opacity)
        tooltip.style.color = '#eee';
        tooltip.style.padding = '5px 8px';
        tooltip.style.borderRadius = '5px'; // Softer, more rounded corners
        tooltip.style.fontSize = '12px'; 
        tooltip.style.fontWeight = '500';
        tooltip.style.fontFamily = '"YouTube Noto", Roboto, Arial, sans-serif';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '99999';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.transition = 'opacity 0.1s ease-in';
        document.body.appendChild(tooltip);
      }
      
      // Add the text and a stylized 'S' keyboard shortcut indicator in an outlined square
      tooltip.innerHTML = 'Take Snapshot <span style="display:inline-block; margin-left:8px; padding:1px 5px; border:1px solid rgba(255, 255, 255, 0.4); border-radius:4px; font-weight:700; font-size:11px; color:#eee;">S</span>';
      tooltip.style.opacity = '1';
      
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = (rect.left + (rect.width / 2)) + 'px';
      tooltip.style.top = (rect.top - 46) + 'px'; // Sweet spot for tooltip height
      tooltip.style.transform = 'translateX(-50%)';
    });

    btn.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('yt-snapshot-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    });
    
    // Camera SVG icon, matching modern YouTube 24x24 icon styling
    btn.innerHTML = `
      <svg height="24" viewBox="0 0 24 24" width="24" fill="white">
        <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"></path>
      </svg>
    `;

    // Listen for clicks to trigger the snapshot
    btn.addEventListener('click', takeSnapshot);

    // Insert at the beginning of the right controls (before Theater mode)
    rightControls.insertBefore(btn, rightControls.firstChild);
  }
}

// Because YouTube acts as a Single Page Application (SPA) and loads elements asynchronously,
// a simple interval is often the most robust way to ensure our button stays injected.
setInterval(() => {
  if (window.location.pathname === '/watch' || window.location.pathname.startsWith('/shorts')) {
    injectButton();
  }
}, 1000);

// Listen for messages from the background script (for the extension icon click)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "take_snapshot") {
    takeSnapshot();
  }
});

// Listen for the 's' keyboard shortcut to take a snapshot
document.addEventListener('keydown', (e) => {
  // Trigger on 's' or 'S', ignoring modifier keys, and explicitly ignore held down keys (e.repeat)
  if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
    // Make sure the user isn't typing in a search bar or comment box
    const activeEl = document.activeElement;
    const isInput = activeEl.tagName === 'INPUT' || 
                    activeEl.tagName === 'TEXTAREA' || 
                    activeEl.isContentEditable;
                    
    if (!isInput && (window.location.pathname === '/watch' || window.location.pathname.startsWith('/shorts'))) {
      takeSnapshot();
    }
  }
});
