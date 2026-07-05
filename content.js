// A global flag to track if the extension has been updated/unloaded
let isExtensionValid = true;

function checkExtensionContext() {
  if (!chrome.runtime?.id) {
    isExtensionValid = false;
    // Clean up global listeners to completely stop execution
    clearInterval(injectionInterval);
    document.removeEventListener('keydown', handleKeyboardShortcut);
    const existingBtn = document.getElementById('yt-snapshot-watch-btn');
    if (existingBtn) existingBtn.remove();
    return false;
  }
  return true;
}

function takeSnapshot() {
  if (!checkExtensionContext()) return;

  const isShorts = window.location.pathname.startsWith('/shorts');
  let video;

  if (isShorts) {
    video = document.querySelector('.is-active video') || document.querySelector('[is-active] video');
  } else {
    video = document.querySelector('.html5-main-video');
  }

  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    const videos = Array.from(document.querySelectorAll('video'));
    const validVideos = videos.filter(v => v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2);
    
    if (validVideos.length > 0) {
      const visibleVideo = validVideos.find(v => {
        const rect = v.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
      });
      video = visibleVideo || validVideos[0];
    }
  }

  if (!video) video = document.querySelector('video');

  if (!video) {
    alert('No video element found. Make sure a video is playing.');
    return;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;

  if (width === 0 || height === 0) {
    alert('The video stream has not fully loaded yet.');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, width, height);

  // --- Safe Flash Effect ---
  const flash = document.createElement('div');
  flash.style.position = 'absolute';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.backgroundColor = 'black';
  flash.style.zIndex = '2147483647';
  flash.style.opacity = '0.4';
  flash.style.transition = 'opacity 0.15s ease-out';
  flash.style.pointerEvents = 'none';
  
  const player = document.querySelector('.is-active .html5-video-player') || document.querySelector('.html5-video-player') || video.parentElement;
  if (player) {
      player.appendChild(flash);
      // Trigger rendering layout before changing opacity to guarantee the transition runs smoothly
      flash.offsetHeight; 
      flash.style.opacity = '0';
      setTimeout(() => {
          if (flash.parentElement) flash.parentElement.removeChild(flash);
      }, 200);
  }

  // --- Title Handling ---
  const titleElement = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('.is-active h2.yt-core-attributed-string');
  let title = 'youtube_snapshot';
  if (titleElement) {
      title = titleElement.innerText
          .replace(/[^\p{L}\p{N}]/gu, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      
      if (!title) title = 'youtube_snapshot'; 
  }
  
  const time = Math.floor(video.currentTime);
  
  canvas.toBlob((blob) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onloadend = function() {
          if (!checkExtensionContext()) {
              alert("YouTube Snapshot was updated. Please refresh the page to continue taking snapshots.");
              return;
          }
          try {
              chrome.runtime.sendMessage({
                  action: "download_snapshot",
                  dataUrl: reader.result,
                  filename: `${title}_${width}x${height}_${time}s.png`
              });
          } catch (e) {
              console.error("Snapshot communication error:", e);
          }
      };
      reader.readAsDataURL(blob);
  }, 'image/png');
}

// --- Button Injection Logic ---
function injectButton() {
  if (!isExtensionValid) return;

  const isShorts = window.location.pathname.startsWith('/shorts');
  
  if (isShorts) {
    const actionContainers = document.querySelectorAll('reel-action-bar-view-model');
    
    actionContainers.forEach(container => {
      if (container.querySelector('.yt-snapshot-shorts-btn')) return;
      
      const btn = document.createElement('button');
      btn.className = 'yt-snapshot-shorts-btn ytSpecButtonShapeNextHost ytSpecButtonShapeNextTonal ytSpecButtonShapeNextMono ytSpecButtonShapeNextSizeL ytSpecButtonShapeNextIconButton ytSpecButtonShapeNextEnableBackdropFilterExperiment';
      btn.setAttribute('aria-label', 'Take Snapshot');
      btn.title = 'Take Snapshot'; 
      btn.style.marginBottom = '16px';
      
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
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        takeSnapshot();
      });
      container.insertBefore(btn, container.firstChild);
    });

  } else {
    if (document.getElementById('yt-snapshot-watch-btn')) return;

    const rightControls = document.querySelector('.ytp-right-controls-right') || document.querySelector('.ytp-right-controls');
    if (!rightControls) return;

    const btn = document.createElement('button');
    btn.id = 'yt-snapshot-watch-btn';
    btn.className = 'ytp-button';
    btn.setAttribute('aria-label', 'Take Snapshot');
    
    btn.addEventListener('mouseenter', () => {
      let tooltip = document.getElementById('yt-snapshot-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'yt-snapshot-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.background = 'rgba(28, 28, 28, 0.5)';
        tooltip.style.color = '#eee';
        tooltip.style.padding = '5px 8px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.fontSize = '12px'; 
        tooltip.style.fontWeight = '500';
        tooltip.style.fontFamily = '"YouTube Noto", Roboto, Arial, sans-serif';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '2147483647';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.transition = 'opacity 0.1s ease-in';
        document.body.appendChild(tooltip);
      }
      
      tooltip.innerHTML = 'Take Snapshot <span style="display:inline-block; margin-left:8px; padding:1px 5px; border:1px solid rgba(255, 255, 255, 0.4); border-radius:4px; font-weight:700; font-size:11px; color:#eee;">S</span>';
      tooltip.style.opacity = '1';
      
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = (rect.left + (rect.width / 2)) + 'px';
      tooltip.style.top = (rect.top - 46) + 'px';
      tooltip.style.transform = 'translateX(-50%)';
    });

    btn.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('yt-snapshot-tooltip');
      if (tooltip) tooltip.style.opacity = '0';
    });
    
    btn.innerHTML = `
      <svg height="24" viewBox="0 0 24 24" width="24" fill="white">
        <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"></path>
      </svg>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      takeSnapshot();
    });
    rightControls.insertBefore(btn, rightControls.firstChild);
  }
}

// --- Listeners & Loops Management ---
const injectionInterval = setInterval(() => {
  if (window.location.pathname === '/watch' || window.location.pathname.startsWith('/shorts')) {
    injectButton();
  }
}, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "take_snapshot") {
    takeSnapshot();
  }
});

function handleKeyboardShortcut(e) {
  if (!isExtensionValid) return;
  
  if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
    const activeEl = document.activeElement;
    const isInput = activeEl.tagName === 'INPUT' || 
                    activeEl.tagName === 'TEXTAREA' || 
                    activeEl.isContentEditable;
                        
    if (!isInput && (window.location.pathname === '/watch' || window.location.pathname.startsWith('/shorts'))) {
      takeSnapshot();
    }
  }
}

document.addEventListener('keydown', handleKeyboardShortcut);
