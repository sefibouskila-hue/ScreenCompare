(() => {
  let resizeTimer = null;

  // Forward intercepted network entries from page MAIN world to background
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== '__dupscreen_network__') return;
    try {
      chrome.runtime.sendMessage({
        action: 'network-entry',
        entry: event.data.entry,
      });
    } catch {}
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'apply-zoom') {
      applyZoom(message.zoomLevel);
      sendResponse({ success: true });
    } else if (message.action === 'remove-zoom') {
      removeZoom();
      sendResponse({ success: true });
    }
  });

  function applyZoom(zoomLevel) {
    document.documentElement.style.zoom = zoomLevel;
    window.__dupscreen_zoom = zoomLevel;
  }

  function removeZoom() {
    document.documentElement.style.zoom = '';
    delete window.__dupscreen_zoom;
  }

  window.addEventListener('resize', () => {
    if (!window.__dupscreen_zoom) return;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(async () => {
      try {
        const stored = await chrome.storage.local.get(['targetWidth']);
        const targetWidth = stored.targetWidth || 1920;
        const newZoom = window.innerWidth / targetWidth;
        applyZoom(newZoom);
      } catch (e) { /* extension context may be invalidated */ }
    }, 150);
  });
})();
