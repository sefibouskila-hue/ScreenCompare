let splitState = {
  active: false,
  windowA: null,
  windowB: null,
  tabA: null,
  tabB: null,
};

let desktopViewTabs = new Set();
let overlayTabIds = new Set();
let panelWindowId = null;
const PANEL_WIDTH = 460;
const PANEL_HEIGHT = 900;

const HEADER_STRIP_RULE_ID_START = 1000;

// ===== Network Monitor State =====
let networkEntries = [];
let networkMonitorWindowId = null;
let networkMonitorTabId = null;
let networkMonitoring = true;
let networkSettings = { filterString: '', maxEntries: 1000 };

// ===== Network Override State =====
const networkOverrides = new Map();

// ===== Record & Replay State =====
const recordedResponses = new Map();
let recordReplayActive = false;
let recordSource = 'B';  // which frame to record from ('A' or 'B')
let recordTarget = 'A';  // which frame to mock ('A' or 'B')

(async () => {
  const stored = await chrome.storage.local.get(['networkSettings']);
  if (stored.networkSettings) {
    networkSettings = { ...networkSettings, ...stored.networkSettings };
  }
})();

// Open popup as a persistent panel window on icon click
chrome.action.onClicked.addListener(async () => {
  const displays = await chrome.system.display.getInfo();
  const primary = displays.find(d => d.isPrimary) || displays[0];
  const maxWidth = Math.max(420, (primary?.workArea?.width || PANEL_WIDTH) - 80);
  const maxHeight = Math.max(520, (primary?.workArea?.height || PANEL_HEIGHT) - 80);
  const width = Math.min(PANEL_WIDTH, maxWidth);
  const height = Math.min(PANEL_HEIGHT, maxHeight);

  if (panelWindowId !== null) {
    try {
      const win = await chrome.windows.get(panelWindowId);
      if (win) {
        // Keep the panel size in sync even when an old window is already open.
        await chrome.windows.update(panelWindowId, { focused: true, width, height });
        return;
      }
    } catch (e) {
      panelWindowId = null;
    }
  }

  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const left = currentTab ? 100 : 100;
  const top = 100;

  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width,
    height,
    left,
    top,
  });
  panelWindowId = win.id;
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === panelWindowId) panelWindowId = null;
});

async function enableHeaderStripping(tabId) {
  overlayTabIds.add(tabId);
  await updateHeaderRules();
}

async function disableHeaderStripping(tabId) {
  overlayTabIds.delete(tabId);
  await updateHeaderRules();
}

async function updateHeaderRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getSessionRules();
    const existingIds = existingRules.map(r => r.id);

    if (existingIds.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: existingIds });
    }

    if (overlayTabIds.size === 0) return;

    const tabIds = [...overlayTabIds];
    const rules = [];
    let ruleId = HEADER_STRIP_RULE_ID_START;

    for (const tid of tabIds) {
      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'x-frame-options', operation: 'remove' },
            { header: 'content-security-policy', operation: 'remove' },
            { header: 'content-security-policy-report-only', operation: 'remove' },
          ],
        },
        condition: {
          resourceTypes: ['sub_frame'],
          tabIds: [tid],
        },
      });
    }

    await chrome.declarativeNetRequest.updateSessionRules({ addRules: rules });
  } catch (e) {
    console.error('Failed to update header rules:', e);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    'split': () => handleSplit(message),
    'restore': () => handleRestore(),
    'toggle-desktop-view': () => handleDesktopView(message),
    'open-overlay': () => handleOverlay(message),
    'pop-out': () => handlePopOut(message),
    'pop-out-from-frame': () => handlePopOutFromFrame(message, sender),
    'get-state': () => handleGetState(),
    'register-overlay': () => handleRegisterOverlay(sender),
    'capture-current-tab': () => handleCaptureCurrentTab(sender),
    'capture-overlay-tab': () => handleCaptureOverlayTab(message, sender),
    'get-frame-dimensions': () => handleGetFrameDimensions(message, sender),
    'scroll-frame-to': () => handleScrollFrameTo(message, sender),
    'blur-frame': () => handleBlurFrame(message, sender),
    'hide-fixed-in-frame': () => handleHideFixedInFrame(message, sender),
    'show-fixed-in-frame': () => handleShowFixedInFrame(message, sender),
    'inject-inspector': () => handleInjectInspector(message, sender),
    'remove-inspector': () => handleRemoveInspector(message, sender),
    'inject-compare': () => handleInjectCompare(message, sender),
    'remove-compare': () => handleRemoveCompare(message, sender),
    'scan-typography': () => handleScanTypography(message, sender),
    'css-inspect-data': () => forwardToOverlayTab(message, sender),
    'css-compare-select': () => forwardToOverlayTab(message, sender),
    'setup-scroll-sync': () => handleSetupScrollSync(message, sender),
    'apply-scroll': () => handleApplyScroll(message, sender),
    'scroll-event': () => handleScrollEvent(message, sender),
    'inject-network': () => handleInjectNetwork(message, sender),
    'remove-network': () => handleRemoveNetwork(message, sender),
    'network-entry': () => handleNetworkEntry(message, sender),
    'open-network-monitor': () => handleOpenNetworkMonitor(),
    'get-network-entries': () => handleGetNetworkEntries(),
    'get-network-settings': () => handleGetNetworkSettings(),
    'update-network-settings': () => handleUpdateNetworkSettings(message),
    'clear-network-entries': () => handleClearNetworkEntries(),
    'import-network-entries': () => handleImportNetworkEntries(message, sender),
    'inject-mirror': () => handleInjectMirror(message, sender),
    'remove-mirror': () => handleRemoveMirror(message, sender),
    'activate-mirror': () => handleActivateMirror(message, sender),
    'mirror-event': () => handleMirrorEvent(message, sender),
    'mirror-select': () => forwardToOverlayTab(message, sender),
    'set-network-override': () => handleSetNetworkOverride(message, sender),
    'remove-network-override': () => handleRemoveNetworkOverride(message, sender),
    'clear-network-overrides': () => handleClearNetworkOverrides(message, sender),
    'get-network-overrides': () => handleGetNetworkOverrides(),
    'get-network-override': () => handleGetNetworkOverride(message),
    'run-bulk-api-test': () => handleRunBulkApiTest(message, sender),
    'toggle-record-replay': () => handleToggleRecordReplay(message, sender),
    'get-record-replay-state': () => handleGetRecordReplayState(),
    'clear-recorded-responses': () => handleClearRecordedResponses(sender),
    'swap-record-replay-sides': () => handleSwapRecordReplaySides(sender),
  };

  const handler = handlers[message.action];
  if (handler) {
    handler().then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

async function handleSplit(message) {
  const displays = await chrome.system.display.getInfo();
  const primary = displays[0];
  const { width, height } = primary.workArea;
  const halfWidth = Math.floor(width / 2);

  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentWindowId = currentTab.windowId;
  const urlB = message.urlB || currentTab.url;

  await chrome.windows.update(currentWindowId, {
    left: 0,
    top: 0,
    width: halfWidth,
    height: height,
    state: 'normal',
  });

  const newWindow = await chrome.windows.create({
    url: urlB,
    left: halfWidth,
    top: 0,
    width: halfWidth,
    height: height,
    state: 'normal',
  });

  splitState = {
    active: true,
    windowA: currentWindowId,
    windowB: newWindow.id,
    tabA: currentTab.id,
    tabB: newWindow.tabs[0].id,
  };

  const targetWidth = message.targetWidth || 1920;
  await applyZoomToTab(currentTab.id, halfWidth, targetWidth);
  await applyZoomToTab(newWindow.tabs[0].id, halfWidth, targetWidth);

  await chrome.storage.local.set({ splitState, targetWidth });
  return { success: true, splitState };
}

async function handleRestore() {
  if (splitState.active) {
    if (splitState.tabA) {
      await removeZoomFromTab(splitState.tabA);
    }
    if (splitState.tabB) {
      await removeZoomFromTab(splitState.tabB);
    }
    try {
      if (splitState.windowB) {
        await chrome.windows.remove(splitState.windowB);
      }
    } catch (e) { /* window may already be closed */ }
    try {
      if (splitState.windowA) {
        await chrome.windows.update(splitState.windowA, { state: 'maximized' });
      }
    } catch (e) { /* window may already be closed */ }
  }

  for (const tabId of desktopViewTabs) {
    await removeZoomFromTab(tabId);
  }
  desktopViewTabs.clear();

  splitState = { active: false, windowA: null, windowB: null, tabA: null, tabB: null };
  await chrome.storage.local.set({ splitState });
  return { success: true };
}

async function handleDesktopView(message) {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const targetWidth = message.targetWidth || 1920;
  const tabId = currentTab.id;

  if (desktopViewTabs.has(tabId) && !message.forceOn) {
    await removeZoomFromTab(tabId);
    desktopViewTabs.delete(tabId);
    return { success: true, active: false };
  }

  const window = await chrome.windows.get(currentTab.windowId);
  await applyZoomToTab(tabId, window.width, targetWidth);
  desktopViewTabs.add(tabId);
  await chrome.storage.local.set({ targetWidth });
  return { success: true, active: true };
}

async function handleOverlay(message) {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let urlA = message.urlA || currentTab.url;
  let urlB = message.urlB || currentTab.url;

  if (splitState.active && !message.urlA && !message.urlB) {
    try {
      const tabA = await chrome.tabs.get(splitState.tabA);
      const tabB = await chrome.tabs.get(splitState.tabB);
      urlA = tabA.url;
      urlB = tabB.url;
    } catch (e) { /* tabs may be closed */ }
  }

  const targetWidth = message.targetWidth || 1920;
  let overlayUrl = chrome.runtime.getURL('overlay.html')
    + `?urlA=${encodeURIComponent(urlA)}`
    + `&urlB=${encodeURIComponent(urlB)}`
    + `&targetWidth=${targetWidth}`;
  if (message.aliasA) overlayUrl += `&aliasA=${encodeURIComponent(message.aliasA)}`;
  if (message.aliasB) overlayUrl += `&aliasB=${encodeURIComponent(message.aliasB)}`;
  if (message.mode) overlayUrl += `&mode=${encodeURIComponent(message.mode)}`;

  const tab = await chrome.tabs.create({ url: overlayUrl });
  await enableHeaderStripping(tab.id);
  return { success: true, tabId: tab.id };
}

async function handleRegisterOverlay(sender) {
  if (sender?.tab?.id) {
    await enableHeaderStripping(sender.tab.id);
  }
  return { success: true };
}

// ===== Screenshot (captures from the overlay tab directly) =====

async function handleCaptureCurrentTab(sender) {
  const windowId = sender.tab.windowId;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format: 'png',
      quality: 100,
    });
    return { dataUrl };
  } catch (e) {
    console.error('Capture failed:', e);
    return { dataUrl: null, error: e.message };
  }
}

// ===== High-res capture via debugger on the overlay tab =====

async function handleCaptureOverlayTab(message, sender) {
  const { targetWidth = 1920, dpr = 2, contentHeight = 800 } = message;
  const tabId = sender.tab.id;
  let debuggerAttached = false;

  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    debuggerAttached = true;

    await chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
      width: targetWidth,
      height: contentHeight,
      deviceScaleFactor: dpr,
      mobile: false,
    });

    await new Promise(r => setTimeout(r, 800));

    const screenshot = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      captureBeyondViewport: true,
      fromSurface: true,
      clip: { x: 0, y: 0, width: targetWidth, height: contentHeight, scale: 1 },
    });

    return { dataUrl: 'data:image/png;base64,' + screenshot.data };
  } catch (e) {
    console.error('Capture overlay tab failed:', e);
    return { dataUrl: null, error: e.message };
  } finally {
    if (debuggerAttached) {
      try { await chrome.debugger.sendCommand({ tabId }, 'Emulation.clearDeviceMetricsOverride'); } catch {}
      try { await chrome.debugger.detach({ tabId }); } catch {}
    }
  }
}

async function handleGetFrameDimensions(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
  const frameIndex = message.frameLabel === 'A' ? 0 : 1;

  if (!subFrames[frameIndex]) {
    return { scrollHeight: 0, scrollWidth: 0, viewportHeight: 0, viewportWidth: 0 };
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [subFrames[frameIndex].frameId] },
      func: () => ({
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }),
    });
    return results[0].result;
  } catch (e) {
    return { scrollHeight: 0, scrollWidth: 0, viewportHeight: 0, viewportWidth: 0 };
  }
}

async function handleScrollFrameTo(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
  const frameIndex = message.frameLabel === 'A' ? 0 : 1;

  if (!subFrames[frameIndex]) return { success: false };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [subFrames[frameIndex].frameId] },
      func: (x, y) => { window.scrollTo({ left: x, top: y, behavior: 'instant' }); },
      args: [message.x, message.y],
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// ===== Blur focused element inside an iframe =====

async function handleBlurFrame(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
  const frameIndex = message.frameLabel === 'A' ? 0 : 1;

  if (!subFrames[frameIndex]) return { success: false };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [subFrames[frameIndex].frameId] },
      func: () => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// ===== Hide/show fixed & sticky elements for clean screenshots =====

async function handleHideFixedInFrame(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
  const frameIndex = message.frameLabel === 'A' ? 0 : 1;

  if (!subFrames[frameIndex]) return { success: false };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [subFrames[frameIndex].frameId] },
      func: () => {
        const hidden = [];
        const vh = window.innerHeight;
        document.querySelectorAll('*').forEach(el => {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.position === 'sticky') {
            const rect = el.getBoundingClientRect();
            // Only hide elements in the upper viewport (headers/navbars), not sticky footers at the bottom
            const isTopElement = rect.bottom <= vh * 0.35 || rect.top < 120;
            if (!isTopElement) return;
            hidden.push({
              el,
              origVis: el.style.visibility,
              origPointer: el.style.pointerEvents,
            });
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
          }
        });
        window.__dupscreen_hidden_fixed = hidden;
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function handleShowFixedInFrame(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
  const frameIndex = message.frameLabel === 'A' ? 0 : 1;

  if (!subFrames[frameIndex]) return { success: false };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [subFrames[frameIndex].frameId] },
      func: () => {
        if (window.__dupscreen_hidden_fixed) {
          for (const item of window.__dupscreen_hidden_fixed) {
            item.el.style.visibility = item.origVis;
            item.el.style.pointerEvents = item.origPointer;
          }
          delete window.__dupscreen_hidden_fixed;
        }
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== CSS Inspector (inject hover-inspect into iframe) =====

const CSS_PROPS = {
  'Box Model': ['width','height','margin','padding','border','box-sizing'],
  'Typography': ['font-family','font-size','font-weight','line-height','color','text-align','letter-spacing'],
  'Background': ['background-color','background-image'],
  'Layout': ['display','position','top','right','bottom','left','flex-direction','justify-content','align-items','gap','z-index'],
  'Visual': ['opacity','border-radius','box-shadow','overflow'],
};

function isUrlInjectable(url) {
  if (!url) return false;
  return !url.startsWith('chrome-error://') &&
         !url.startsWith('chrome://') &&
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('edge://');
}

function isFrameInjectable(frame) {
  if (!frame) return false;
  return isUrlInjectable(frame.url);
}

function getFrameForLabel(frames, label) {
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
  const frame = subFrames[label === 'A' ? 0 : 1];
  return isFrameInjectable(frame) ? frame : null;
}

async function handleInjectInspector(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const target = getFrameForLabel(frames, message.frameLabel);
  if (!target) return { success: false };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [target.frameId] },
      func: (label, propGroups) => {
        if (window.__dupscreen_inspector) return;
        let lastEl = null;
        let origOutline = '';

        function collectData(el) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? '#' + el.id : '';
          const cls = [...el.classList].map(c => '.' + c).join('');
          const selector = tag + id + cls;
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const groups = {};
          for (const [group, props] of Object.entries(propGroups)) {
            groups[group] = {};
            for (const p of props) {
              groups[group][p] = cs.getPropertyValue(p);
            }
          }
          return { selector, groups, rect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height } };
        }

        function onMove(e) {
          const el = e.target;
          if (el === lastEl) return;
          if (lastEl) lastEl.style.outline = origOutline;
          lastEl = el;
          origOutline = el.style.outline;
          el.style.outline = '2px solid #6c63ff';

          const data = collectData(el);
          chrome.runtime.sendMessage({
            action: 'css-inspect-data',
            label,
            pinned: false,
            ...data,
          });
        }

        function onOut() {
          if (lastEl) { lastEl.style.outline = origOutline; lastEl = null; }
          chrome.runtime.sendMessage({ action: 'css-inspect-data', label, selector: null, pinned: false });
        }

        function onClick(e) {
          if (!e.shiftKey) return;
          e.preventDefault();
          e.stopPropagation();
          const el = e.target;
          const data = collectData(el);
          chrome.runtime.sendMessage({
            action: 'css-inspect-data',
            label,
            pinned: true,
            ...data,
          });
        }

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseleave', onOut, true);
        document.addEventListener('click', onClick, true);
        window.__dupscreen_inspector = {
          onMove, onOut, onClick,
          getLast: () => lastEl,
          getOrigOutline: () => origOutline,
        };
      },
      args: [message.frameLabel, CSS_PROPS],
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function handleRemoveInspector(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const target = getFrameForLabel(frames, message.frameLabel);
  if (!target) return { success: false };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [target.frameId] },
      func: () => {
        if (!window.__dupscreen_inspector) return;
        const ins = window.__dupscreen_inspector;
        document.removeEventListener('mousemove', ins.onMove, true);
        document.removeEventListener('mouseleave', ins.onOut, true);
        document.removeEventListener('click', ins.onClick, true);
        const last = ins.getLast();
        if (last) last.style.outline = ins.getOrigOutline();
        delete window.__dupscreen_inspector;
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== CSS Compare (inject click-to-select into iframes) =====

async function handleInjectCompare(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });

  for (const label of ['A', 'B']) {
    const target = getFrameForLabel(frames, label);
    if (!target) continue;

    const color = label === 'A' ? '#6c63ff' : '#e040fb';

    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: (lbl, outlineColor, propGroups) => {
          if (window.__dupscreen_compare) return;
          let selectedEl = null;

          function onClick(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (selectedEl) {
              selectedEl.style.outline = selectedEl.__dupscreen_orig_outline || '';
            }

            const el = e.target;
            selectedEl = el;
            el.__dupscreen_orig_outline = el.style.outline;
            el.style.outline = `3px dashed ${outlineColor}`;

            const tag = el.tagName.toLowerCase();
            const id = el.id ? '#' + el.id : '';
            const cls = [...el.classList].map(c => '.' + c).join('');
            const selector = tag + id + cls;
            const cs = getComputedStyle(el);
            const allProps = {};
            for (const [group, props] of Object.entries(propGroups)) {
              allProps[group] = {};
              for (const p of props) {
                allProps[group][p] = cs.getPropertyValue(p);
              }
            }

            chrome.runtime.sendMessage({
              action: 'css-compare-select',
              label: lbl,
              selector,
              groups: allProps,
            });
          }

          document.addEventListener('click', onClick, true);
          window.__dupscreen_compare = { onClick, getSelected: () => selectedEl };
        },
        args: [label, color, CSS_PROPS],
      });
    } catch (e) { /* frame may not be accessible */ }
  }
  return { success: true };
}

async function handleRemoveCompare(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });

  for (const label of ['A', 'B']) {
    const target = getFrameForLabel(frames, label);
    if (!target) continue;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: () => {
          if (!window.__dupscreen_compare) return;
          const cmp = window.__dupscreen_compare;
          document.removeEventListener('click', cmp.onClick, true);
          const sel = cmp.getSelected();
          if (sel) {
            sel.style.outline = sel.__dupscreen_orig_outline || '';
          }
          delete window.__dupscreen_compare;
        },
      });
    } catch (e) { /* frame may not be accessible */ }
  }
  return { success: true };
}

// ===== Typography scanning =====

async function handleScanTypography(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const results = {};

  for (const label of ['A', 'B']) {
    const target = getFrameForLabel(frames, label);
    if (!target) { results[label] = []; continue; }

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: () => {
          function rectIntersectsViewport(rect) {
            return !(rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight);
          }

          function isElementVisible(el) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
            if (!el.offsetParent && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
              if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
            }
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return false;
            return rectIntersectsViewport(rect);
          }

          function isTextVisible(node, el) {
            if (!isElementVisible(el)) return false;

            const range = document.createRange();
            range.selectNodeContents(node);
            const rects = Array.from(range.getClientRects()).filter(r => {
              return r.width > 0 && r.height > 0 && rectIntersectsViewport(r);
            });
            if (rects.length === 0) return false;

            // Confirm at least one glyph area is actually on top and visible.
            for (const rect of rects) {
              const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + Math.min(rect.width / 2, 8)));
              const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + Math.min(rect.height / 2, 8)));
              const topEl = document.elementFromPoint(x, y);
              if (!topEl) continue;
              if (topEl === el || el.contains(topEl) || topEl.contains(el)) return true;
            }
            return false;
          }

          const items = [];
          const seen = new Set();
          const walker = document.createTreeWalker(
            document.body, NodeFilter.SHOW_TEXT,
            { acceptNode: (n) => n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
          );
          while (walker.nextNode()) {
            const node = walker.currentNode;
            const el = node.parentElement;
            if (!el || el.closest('script,style,noscript')) continue;
            const text = node.textContent.trim();
            if (!text) continue;
            if (!isTextVisible(node, el)) continue;

            const tag = el.tagName.toLowerCase();
            const id = el.id ? '#' + el.id : '';
            const cls = [...el.classList].slice(0, 3).map(c => '.' + c).join('');
            const selector = tag + id + cls;
            const key = text.toLowerCase().substring(0, 80);
            if (seen.has(key)) continue;
            seen.add(key);

            const cs = getComputedStyle(el);
            items.push({
              selector,
              text: text.substring(0, 180),
              fontFamily: cs.fontFamily,
              fontSize: cs.fontSize,
              fontWeight: cs.fontWeight,
              lineHeight: cs.lineHeight,
              color: cs.color,
              letterSpacing: cs.letterSpacing,
            });
          }
          return items;
        },
      });
      results[label] = result.result || [];
    } catch (e) {
      results[label] = [];
    }
  }

  return { success: true, data: results };
}

// ===== Forward messages from iframes to overlay tab =====

async function forwardToOverlayTab(message, sender) {
  const tabId = sender.tab.id;
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (e) { /* overlay may not be listening yet */ }
  return { success: true };
}

// ===== Pop out (opens from within the iframe to preserve session) =====

async function handlePopOutFromFrame(message, sender) {
  const overlayTabId = sender.tab.id;
  const label = message.frameLabel;

  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);

  const frameIndex = label === 'A' ? 0 : 1;
  if (!subFrames[frameIndex]) {
    return { success: false, error: 'Frame not found' };
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [subFrames[frameIndex].frameId] },
      func: () => {
        window.open(window.location.href, '_blank');
      },
    });
    return { success: true };
  } catch (e) {
    // Fallback: open via chrome.tabs.create (may lose session)
    const tab = await chrome.tabs.create({ url: subFrames[frameIndex].url });
    return { success: true, tabId: tab.id, fallback: true };
  }
}

// ===== Scroll Sync =====

let scrollSyncTabs = {};

async function handleSetupScrollSync(message, sender) {
  const overlayTabId = sender.tab.id;

  if (!message.enabled) {
    delete scrollSyncTabs[overlayTabId];
    await removeScrollListenersFromFrames(overlayTabId);
    return { success: true };
  }

  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);

  if (subFrames.length < 2) {
    return { success: false, error: 'Could not find both iframes' };
  }

  scrollSyncTabs[overlayTabId] = {
    frameA: subFrames[0].frameId,
    frameB: subFrames[1].frameId,
  };

  for (let i = 0; i < subFrames.length; i++) {
    const label = i === 0 ? 'A' : 'B';
    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [subFrames[i].frameId] },
        func: (lbl) => {
          if (window.__dupscreen_scroll_listener) {
            window.removeEventListener('scroll', window.__dupscreen_scroll_listener);
          }
          window.__dupscreen_scroll_label = lbl;
          window.__dupscreen_scroll_listener = () => {
            const maxX = Math.max(1, document.documentElement.scrollWidth - window.innerWidth);
            const maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            chrome.runtime.sendMessage({
              action: 'scroll-event',
              sourceLabel: lbl,
              scrollXPercent: window.scrollX / maxX,
              scrollYPercent: window.scrollY / maxY,
            });
          };
          window.addEventListener('scroll', window.__dupscreen_scroll_listener, { passive: true });
        },
        args: [label],
      });
    } catch (e) {
      console.warn('Failed to inject scroll listener into frame', label, e.message);
    }
  }

  return { success: true };
}

async function handleScrollEvent(message, sender) {
  const overlayTabId = sender.tab.id;
  const sync = scrollSyncTabs[overlayTabId];
  if (!sync) return { success: false };

  const targetFrameId = message.sourceLabel === 'A' ? sync.frameB : sync.frameA;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [targetFrameId] },
      func: (xPct, yPct) => {
        const maxX = Math.max(1, document.documentElement.scrollWidth - window.innerWidth);
        const maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        window.removeEventListener('scroll', window.__dupscreen_scroll_listener);
        window.scrollTo(xPct * maxX, yPct * maxY);
        setTimeout(() => {
          window.addEventListener('scroll', window.__dupscreen_scroll_listener, { passive: true });
        }, 100);
      },
      args: [message.scrollXPercent, message.scrollYPercent],
    });
  } catch (e) { /* frame may not be ready */ }

  return { success: true };
}

async function handleApplyScroll(message, sender) {
  return handleScrollEvent({
    ...message,
    sourceLabel: message.targetLabel === 'A' ? 'B' : 'A',
    scrollXPercent: message.scrollXPercent,
    scrollYPercent: message.scrollYPercent,
  }, sender);
}

async function removeScrollListenersFromFrames(overlayTabId) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
    const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
    for (const frame of subFrames) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: overlayTabId, frameIds: [frame.frameId] },
          func: () => {
            if (window.__dupscreen_scroll_listener) {
              window.removeEventListener('scroll', window.__dupscreen_scroll_listener);
              delete window.__dupscreen_scroll_listener;
              delete window.__dupscreen_scroll_label;
            }
          },
        });
      } catch (e) { /* frame may be gone */ }
    }
  } catch (e) { /* tab may be closed */ }
}

// ===== Network Monitor =====

async function handleInjectNetwork(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const filter = message.filterString !== undefined
    ? message.filterString
    : (networkSettings.filterString || '');

  for (const frameLabel of ['A', 'B']) {
    const target = getFrameForLabel(frames, frameLabel);
    if (!target) continue;

    try {
      // 1) Inject postMessage relay into ISOLATED world so it can forward to background
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: () => {
          if (window.__dupscreen_network_relay) return;
          window.__dupscreen_network_relay = true;
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
        },
      });

      // 2) Set config + overrides/recorded in MAIN world before injecting the interceptor
      const plainOv = {};
      for (const [k, v] of networkOverrides) {
        plainOv[k] = { body: v.body, status: v.status, contentType: v.contentType };
      }
      const plainRec = {};
      if (recordReplayActive && recordedResponses.size > 0 && frameLabel === recordTarget) {
        for (const [k, v] of recordedResponses) {
          plainRec[k] = v;
        }
      }
      const isRecTarget = recordReplayActive && frameLabel === recordTarget;
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        world: 'MAIN',
        func: (overrides, recorded, f, lbl, rrActive) => {
          window.__dupscreen_network_overrides = overrides;
          window.__dupscreen_recorded_responses = recorded;
          window.__dupscreen_network_filter = f;
          window.__dupscreen_network_label = lbl;
          window.__dupscreen_record_replay_active = rrActive;
        },
        args: [plainOv, plainRec, filter, frameLabel, isRecTarget],
      });

      // 3) Inject the interceptor into MAIN world
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        world: 'MAIN',
        files: ['network-interceptor.js'],
      });
    } catch (e) {
      console.warn('Failed to inject network interceptor into frame', frameLabel, e.message);
    }
  }

  networkMonitoring = true;
  return { success: true };
}

async function handleRemoveNetwork(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });

  for (const frameLabel of ['A', 'B']) {
    const target = getFrameForLabel(frames, frameLabel);
    if (!target) continue;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        world: 'MAIN',
        func: () => { window.__dupscreen_network_active = false; },
      });
    } catch {}
  }

  networkMonitoring = false;
  return { success: true };
}

async function handleNetworkEntry(message, sender) {
  const entry = message.entry;
  if (!entry) return { success: false };

  networkEntries.push(entry);
  while (networkEntries.length > networkSettings.maxEntries) {
    networkEntries.shift();
  }

  if (recordReplayActive && entry.label === recordSource && entry.responseBody != null) {
    const key = overrideGetKey(entry.method, entry.url, entry.widgetName);
    if (!recordedResponses.has(key)) recordedResponses.set(key, []);
    const fp = computeFingerprint(entry.method, entry.url, entry.requestBody);
    const newEntry = {
      body: typeof entry.responseBody === 'string' ? entry.responseBody : JSON.stringify(entry.responseBody),
      status: entry.responseStatus || 200,
      contentType: 'application/json',
      requestFingerprint: fp,
    };
    const arr = recordedResponses.get(key);
    const existingIdx = arr.findIndex(r => r.requestFingerprint === fp);
    if (existingIdx >= 0) {
      arr[existingIdx] = newEntry;
      console.warn('[DupScreen] Updated recorded response', key, 'fp:', fp, 'at index:', existingIdx);
    } else {
      arr.push(newEntry);
      console.warn('[DupScreen] Added recorded response', key, 'fp:', fp, 'total:', arr.length);
    }
    const overlayTabId = sender?.tab?.id;
    if (overlayTabId) {
      syncRecordedToMockTarget(overlayTabId).catch((e) => console.warn('[DupScreen] Sync failed:', e));
    }
  }

  const overlayTabId = sender?.tab?.id;
  if (overlayTabId) {
    try {
      await chrome.tabs.sendMessage(overlayTabId, {
        action: 'network-entry-update',
        entry,
        recordedCount: recordReplayActive ? getRecordedResponseCount() : undefined,
      });
    } catch {}
  }
  if (networkMonitorTabId) {
    try {
      await chrome.tabs.sendMessage(networkMonitorTabId, {
        action: 'network-entry-update',
        entry,
      });
    } catch {}
  }
  return { success: true };
}

async function handleOpenNetworkMonitor() {
  if (networkMonitorWindowId !== null) {
    try {
      const win = await chrome.windows.get(networkMonitorWindowId);
      if (win) {
        await chrome.windows.update(networkMonitorWindowId, { focused: true });
        return { success: true };
      }
    } catch {
      networkMonitorWindowId = null;
      networkMonitorTabId = null;
    }
  }

  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('network.html'),
    type: 'popup',
    width: 900,
    height: 700,
  });
  networkMonitorWindowId = win.id;
  networkMonitorTabId = win.tabs[0].id;
  return { success: true };
}

async function handleGetNetworkEntries() {
  return { entries: networkEntries };
}

async function handleGetNetworkSettings() {
  return { settings: networkSettings };
}

async function handleUpdateNetworkSettings(message) {
  if (message.filterString !== undefined) {
    networkSettings.filterString = message.filterString;
  }
  if (message.maxEntries !== undefined) {
    networkSettings.maxEntries = Math.max(1, Math.min(5000, parseInt(message.maxEntries) || 1000));
  }
  while (networkEntries.length > networkSettings.maxEntries) {
    networkEntries.shift();
  }
  await chrome.storage.local.set({ networkSettings });
  return { success: true, settings: networkSettings };
}

async function handleClearNetworkEntries() {
  networkEntries = [];
  return { success: true };
}

async function handleImportNetworkEntries(message, sender) {
  const entries = message.entries;
  if (!Array.isArray(entries)) return { success: false, error: 'Invalid entries' };

  networkEntries = entries;
  while (networkEntries.length > networkSettings.maxEntries) {
    networkEntries.shift();
  }

  if (recordReplayActive) {
    recordedResponses.clear();
    for (const entry of networkEntries) {
      if (entry.label === recordSource && entry.responseBody != null) {
        const key = overrideGetKey(entry.method, entry.url, entry.widgetName);
        if (!recordedResponses.has(key)) recordedResponses.set(key, []);
        const fp = computeFingerprint(entry.method, entry.url, entry.requestBody);
        const newEntry = {
          body: typeof entry.responseBody === 'string' ? entry.responseBody : JSON.stringify(entry.responseBody),
          status: entry.responseStatus || 200,
          contentType: 'application/json',
          requestFingerprint: fp,
        };
        const arr = recordedResponses.get(key);
        const existingIdx = arr.findIndex(r => r.requestFingerprint === fp);
        if (existingIdx >= 0) {
          arr[existingIdx] = newEntry;
        } else {
          arr.push(newEntry);
        }
      }
    }
    const tabId = sender?.tab?.id;
    if (tabId && recordedResponses.size > 0) {
      await syncRecordedToMockTarget(tabId);
      await reloadFrame(tabId, recordTarget);
    }
  }

  return { success: true, count: networkEntries.length, recordedCount: getRecordedResponseCount() };
}

async function handlePopOut(message) {
  const tab = await chrome.tabs.create({ url: message.url });
  return { success: true, tabId: tab.id };
}

async function handleGetState() {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const stored = await chrome.storage.local.get(['targetWidth']);
  return {
    splitActive: splitState.active,
    desktopViewActive: desktopViewTabs.has(currentTab?.id),
    targetWidth: stored.targetWidth || 1920,
  };
}

async function applyZoomToTab(tabId, windowWidth, targetWidth) {
  const zoomLevel = windowWidth / targetWidth;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (zoom) => {
        document.documentElement.style.zoom = zoom;
        window.__dupscreen_zoom = zoom;
        window.__dupscreen_target = 1 / zoom * window.innerWidth;
      },
      args: [zoomLevel],
    });
  } catch (e) { /* can't inject into chrome:// pages */ }
}

async function removeZoomFromTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        document.documentElement.style.zoom = '';
        delete window.__dupscreen_zoom;
        delete window.__dupscreen_target;
      },
    });
  } catch (e) { /* tab may be closed or restricted */ }
}

// ===== Mirror Interaction =====

async function handleInjectMirror(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });

  for (const label of ['A', 'B']) {
    const target = getFrameForLabel(frames, label);
    if (!target) continue;

    const color = label === 'A' ? '#4dd0e1' : '#80deea';

    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: (lbl, outlineColor) => {
          if (window.__dupscreen_mirror_select) return;
          let selectedEl = null;

          function buildSelectorPath(el) {
            const parts = [];
            let cur = el;
            while (cur && cur !== document.documentElement && cur !== document.body) {
              const parent = cur.parentElement;
              if (!parent) break;
              const children = Array.from(parent.children);
              const sameTag = children.filter(c => c.tagName === cur.tagName);
              let part = cur.tagName.toLowerCase();
              if (cur.id) {
                part += '#' + cur.id;
              } else if (sameTag.length > 1) {
                part += ':nth-child(' + (children.indexOf(cur) + 1) + ')';
              }
              parts.unshift(part);
              cur = parent;
            }
            return parts.join(' > ');
          }

          function buildDisplay(el) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? '#' + el.id : '';
            const cls = [...el.classList].slice(0, 2).map(c => '.' + c).join('');
            const type = el.type ? '[' + el.type + ']' : '';
            return tag + id + cls + type;
          }

          function onClick(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (selectedEl) {
              selectedEl.style.outline = selectedEl.__dupscreen_mirror_orig || '';
            }

            const el = e.target;
            selectedEl = el;
            el.__dupscreen_mirror_orig = el.style.outline;
            el.style.outline = `3px solid ${outlineColor}`;

            chrome.runtime.sendMessage({
              action: 'mirror-select',
              label: lbl,
              selectorPath: buildSelectorPath(el),
              display: buildDisplay(el),
            });
          }

          document.addEventListener('click', onClick, true);
          window.__dupscreen_mirror_select = { onClick, getSelected: () => selectedEl };
        },
        args: [label, color],
      });
    } catch (e) { /* frame may not be accessible */ }
  }
  return { success: true };
}

async function handleRemoveMirror(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });

  for (const label of ['A', 'B']) {
    const target = getFrameForLabel(frames, label);
    if (!target) continue;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: () => {
          if (window.__dupscreen_mirror_select) {
            document.removeEventListener('click', window.__dupscreen_mirror_select.onClick, true);
            const sel = window.__dupscreen_mirror_select.getSelected();
            if (sel) sel.style.outline = sel.__dupscreen_mirror_orig || '';
            delete window.__dupscreen_mirror_select;
          }
          if (window.__dupscreen_mirror_active) {
            const m = window.__dupscreen_mirror_active;
            if (m.cleanup) m.cleanup();
            delete window.__dupscreen_mirror_active;
          }
        },
      });
    } catch (e) { /* frame may not be accessible */ }
  }
  return { success: true };
}

async function handleActivateMirror(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });

  const configs = [
    { label: 'A', selector: message.selectorA },
    { label: 'B', selector: message.selectorB },
  ];

  for (const cfg of configs) {
    const target = getFrameForLabel(frames, cfg.label);
    if (!target) continue;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: overlayTabId, frameIds: [target.frameId] },
        func: (lbl, selector) => {
          // Remove the selection click handler
          if (window.__dupscreen_mirror_select) {
            document.removeEventListener('click', window.__dupscreen_mirror_select.onClick, true);
            delete window.__dupscreen_mirror_select;
          }
          // Clean up any previous mirror session
          if (window.__dupscreen_mirror_active) {
            if (window.__dupscreen_mirror_active.cleanup) window.__dupscreen_mirror_active.cleanup();
            delete window.__dupscreen_mirror_active;
          }

          const el = document.querySelector(selector);
          if (!el) return;

          let suppressing = false;
          const listeners = [];

          function addTrackedListener(target, event, handler, useCapture) {
            target.addEventListener(event, handler, !!useCapture);
            listeners.push({ target, event, handler, useCapture: !!useCapture });
          }

          // Re-query the element each time so we survive DOM re-renders
          function getEl() {
            return document.querySelector(selector);
          }

          // Check if the event target is the mirrored element or inside it
          function isRelevant(e) {
            const cur = getEl();
            return cur && (cur === e.target || cur.contains(e.target));
          }

          function onInput(e) {
            if (suppressing || !isRelevant(e)) return;
            const cur = getEl();
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'input',
              value: cur ? cur.value : '',
              checked: cur ? cur.checked : false,
              selectedIndex: cur ? cur.selectedIndex : -1,
            });
          }

          function onChange(e) {
            if (suppressing || !isRelevant(e)) return;
            const cur = getEl();
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'change',
              value: cur ? cur.value : '',
              checked: cur ? cur.checked : false,
              selectedIndex: cur ? cur.selectedIndex : -1,
            });
          }

          function onKeyDown(e) {
            if (suppressing || !isRelevant(e)) return;
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'keydown',
              key: e.key,
              code: e.code,
              altKey: e.altKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              metaKey: e.metaKey,
            });
          }

          function onKeyUp(e) {
            if (suppressing || !isRelevant(e)) return;
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'keyup',
              key: e.key,
              code: e.code,
              altKey: e.altKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              metaKey: e.metaKey,
            });
          }

          function onClick(e) {
            if (suppressing || !isRelevant(e)) return;
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'click',
            });
          }

          function onFocus(e) {
            if (suppressing || !isRelevant(e)) return;
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'focus',
            });
          }

          function onBlur(e) {
            if (suppressing || !isRelevant(e)) return;
            chrome.runtime.sendMessage({
              action: 'mirror-event',
              sourceLabel: lbl,
              eventType: 'blur',
            });
          }

          // Use document-level listeners in CAPTURE phase so they fire
          // before any stopPropagation() in child/widget handlers and
          // survive DOM re-renders (the element is re-queried each time).
          addTrackedListener(document, 'input', onInput, true);
          addTrackedListener(document, 'change', onChange, true);
          addTrackedListener(document, 'keydown', onKeyDown, true);
          addTrackedListener(document, 'keyup', onKeyUp, true);
          addTrackedListener(document, 'click', onClick, true);
          addTrackedListener(document, 'focus', onFocus, true);
          addTrackedListener(document, 'blur', onBlur, true);

          window.__dupscreen_mirror_active = {
            selector,
            getEl,
            suppress() { suppressing = true; },
            unsuppress() { suppressing = false; },
            cleanup() {
              for (const l of listeners) {
                l.target.removeEventListener(l.event, l.handler, l.useCapture);
              }
              listeners.length = 0;
              const cur = getEl();
              if (cur && cur.__dupscreen_mirror_orig !== undefined) {
                cur.style.outline = cur.__dupscreen_mirror_orig;
              }
            },
          };
        },
        args: [cfg.label, cfg.selector],
      });
    } catch (e) {
      console.warn('Failed to activate mirror in frame', cfg.label, e.message);
    }
  }
  return { success: true };
}

async function handleMirrorEvent(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const targetLabel = message.sourceLabel === 'A' ? 'B' : 'A';
  const target = getFrameForLabel(frames, targetLabel);
  if (!target) return { success: false };

  const evt = {
    eventType: message.eventType,
    value: message.value,
    checked: message.checked,
    selectedIndex: message.selectedIndex,
    key: message.key,
    code: message.code,
    altKey: message.altKey,
    ctrlKey: message.ctrlKey,
    shiftKey: message.shiftKey,
    metaKey: message.metaKey,
  };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [target.frameId] },
      func: (evt) => {
        const mirror = window.__dupscreen_mirror_active;
        if (!mirror || !mirror.getEl) return;
        const el = mirror.getEl();
        if (!el) return;

        mirror.suppress();
        try {
          switch (evt.eventType) {
            case 'input': {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(el), 'value'
              )?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(el, evt.value);
              } else {
                el.value = evt.value;
              }
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = evt.checked;
              }
              el.dispatchEvent(new Event('input', { bubbles: true }));
              break;
            }
            case 'change': {
              if (el.tagName === 'SELECT' && evt.selectedIndex !== undefined) {
                el.selectedIndex = evt.selectedIndex;
              }
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = evt.checked;
              }
              el.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
            case 'keydown': {
              el.dispatchEvent(new KeyboardEvent('keydown', {
                key: evt.key, code: evt.code, bubbles: true,
                altKey: evt.altKey, ctrlKey: evt.ctrlKey,
                shiftKey: evt.shiftKey, metaKey: evt.metaKey,
              }));
              // Synthetic KeyboardEvents are untrusted so the browser won't
              // perform native actions (form submit, button click). Handle
              // Enter explicitly to replicate what the browser does natively.
              if (evt.key === 'Enter') {
                const form = el.closest('form');
                if (form) {
                  const submitter = form.querySelector(
                    'button[type="submit"], input[type="submit"], button:not([type])'
                  );
                  if (submitter) {
                    submitter.click();
                  } else if (typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                  } else {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  }
                } else {
                  // No form -- look for a sibling/nearby button that might act
                  // as a search/submit trigger (common in SPA search bars)
                  const parent = el.parentElement;
                  if (parent) {
                    const btn = parent.querySelector('button, [role="button"]');
                    if (btn) btn.click();
                  }
                }
              }
              break;
            }
            case 'keyup': {
              el.dispatchEvent(new KeyboardEvent('keyup', {
                key: evt.key, code: evt.code, bubbles: true,
                altKey: evt.altKey, ctrlKey: evt.ctrlKey,
                shiftKey: evt.shiftKey, metaKey: evt.metaKey,
              }));
              break;
            }
            case 'click': {
              el.click();
              break;
            }
            case 'focus': {
              el.focus();
              break;
            }
            case 'blur': {
              el.blur();
              break;
            }
          }
        } finally {
          mirror.unsuppress();
        }
      },
      args: [evt],
    });
  } catch (e) { /* frame may not be accessible */ }

  return { success: true };
}

// ===== Network Response Override =====

function computeFingerprint(method, url, body) {
  const parts = [];
  try {
    const u = new URL(url, 'http://localhost');
    const qp = [];
    u.searchParams.forEach((v, k) => {
      if (k !== '_s' && v) qp.push(k + '=' + v);
    });
    if (qp.length) parts.push(qp.sort().join('&'));
  } catch {}
  if (body != null && body !== '') {
    let obj;
    if (typeof body === 'string') {
      try { obj = JSON.parse(body); } catch { parts.push(body); }
    } else { obj = body; }
    if (obj !== undefined) {
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const pairs = [];
        for (const k of Object.keys(obj).sort()) {
          const v = obj[k];
          if (v == null || v === '') continue;
          pairs.push(k + '=' + (typeof v === 'object' ? JSON.stringify(v) : v));
        }
        if (pairs.length) parts.push(pairs.join('&'));
      } else {
        parts.push(JSON.stringify(obj));
      }
    }
  }
  return parts.join('|');
}

// Mock key is intentionally widget-agnostic: the same endpoint can be
// invoked by different widgets on A vs B, and we want a single recorded
// response to mock all of them. The widgetName parameter is kept for
// backwards-compatible callsites but is ignored.
function overrideGetKey(method, url, _widgetName) {
  let path;
  try {
    path = new URL(url, 'http://localhost').pathname;
  } catch {
    path = url.split('?')[0];
  }
  path = String(path || '/').replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return (method || 'GET').toUpperCase() + ' ' + path;
}

async function syncOverridesToFrames(tabId) {
  const plain = {};
  for (const [k, v] of networkOverrides) {
    plain[k] = { body: v.body, status: v.status, contentType: v.contentType };
  }
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    for (const label of ['A', 'B']) {
      const target = getFrameForLabel(frames, label);
      if (!target) continue;
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [target.frameId] },
        world: 'MAIN',
        func: (overrides) => { window.__dupscreen_network_overrides = overrides; },
        args: [plain],
      }).catch(() => {});
      // Re-inject interceptor to restore patches if HMR broke them
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [target.frameId] },
        world: 'MAIN',
        files: ['network-interceptor.js'],
      }).catch(() => {});
    }
  } catch {}
}

async function handleSetNetworkOverride(message, sender) {
  const key = overrideGetKey(message.method, message.url, message.widgetName);
  networkOverrides.set(key, {
    body: message.responseBody || '',
    status: message.responseStatus || 200,
    contentType: message.contentType || 'application/json',
  });
  await syncOverridesToFrames(sender.tab.id);
  return { success: true, key };
}

async function handleRemoveNetworkOverride(message, sender) {
  networkOverrides.delete(message.key);
  if (sender?.tab?.id) await syncOverridesToFrames(sender.tab.id);
  return { success: true };
}

async function handleClearNetworkOverrides(message, sender) {
  networkOverrides.clear();
  if (sender?.tab?.id) await syncOverridesToFrames(sender.tab.id);
  return { success: true };
}

async function handleGetNetworkOverrides() {
  return { keys: [...networkOverrides.keys()] };
}

async function handleGetNetworkOverride(message) {
  const override = networkOverrides.get(message.key);
  if (!override) return { found: false };
  return { found: true, body: override.body, status: override.status, contentType: override.contentType };
}

// ===== Record & Replay Handlers =====

function getRecordedResponseCount() {
  let count = 0;
  for (const arr of recordedResponses.values()) count += arr.length;
  return count;
}


async function syncRecordedToMockTarget(tabId) {
  const plain = {};
  let totalEntries = 0;
  for (const [k, v] of recordedResponses) {
    plain[k] = v;
    totalEntries += Array.isArray(v) ? v.length : 1;
  }
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const target = getFrameForLabel(frames, recordTarget);
    if (!target) {
      console.warn('[DupScreen] syncRecordedToMockTarget: target frame not found for', recordTarget);
      return;
    }
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [target.frameId] },
      world: 'MAIN',
      func: (recorded, entryCount) => {
        window.__dupscreen_recorded_responses = recorded;
        window.__dupscreen_record_replay_active = true;
        console.warn('[DupScreen] Recorded responses synced to frame:', entryCount, 'entries,', Object.keys(recorded).length, 'keys');
      },
      args: [plain, totalEntries],
    }).catch((e) => console.warn('[DupScreen] Failed to inject recorded data:', e));
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [target.frameId] },
      world: 'MAIN',
      files: ['network-interceptor.js'],
    }).catch((e) => console.warn('[DupScreen] Failed to re-inject interceptor:', e));
  } catch (e) {
    console.warn('[DupScreen] syncRecordedToMockTarget error:', e);
  }
}

async function clearRecordedFromFrame(tabId, label) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const target = getFrameForLabel(frames, label);
    if (target) {
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [target.frameId] },
        world: 'MAIN',
        func: () => {
          window.__dupscreen_recorded_responses = {};
          window.__dupscreen_record_replay_active = false;
        },
      }).catch(() => {});
    }
  } catch {}
}

async function reloadFrame(tabId, label) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const target = getFrameForLabel(frames, label);
    if (target) {
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [target.frameId] },
        world: 'MAIN',
        func: () => { location.reload(); },
      }).catch(() => {});
    }
  } catch {}
}

async function handleToggleRecordReplay(message, sender) {
  recordReplayActive = !recordReplayActive;
  const tabId = sender?.tab?.id;

  if (!recordReplayActive) {
    recordedResponses.clear();
    if (tabId) {
      await clearRecordedFromFrame(tabId, recordTarget);
    }
  } else {
    for (const entry of networkEntries) {
      if (entry.label === recordSource && entry.responseBody != null) {
        const key = overrideGetKey(entry.method, entry.url, entry.widgetName);
        if (!recordedResponses.has(key)) recordedResponses.set(key, []);
        const fp = computeFingerprint(entry.method, entry.url, entry.requestBody);
        const newEntry = {
          body: typeof entry.responseBody === 'string' ? entry.responseBody : JSON.stringify(entry.responseBody),
          status: entry.responseStatus || 200,
          contentType: 'application/json',
          requestFingerprint: fp,
        };
        const arr = recordedResponses.get(key);
        const existingIdx = arr.findIndex(r => r.requestFingerprint === fp);
        if (existingIdx >= 0) {
          arr[existingIdx] = newEntry;
        } else {
          arr.push(newEntry);
        }
      }
    }
    if (tabId && recordedResponses.size > 0) {
      await syncRecordedToMockTarget(tabId);
      await reloadFrame(tabId, recordTarget);
    }
  }

  return { success: true, active: recordReplayActive, count: getRecordedResponseCount(), source: recordSource, target: recordTarget };
}

async function handleGetRecordReplayState() {
  return { active: recordReplayActive, count: getRecordedResponseCount(), source: recordSource, target: recordTarget };
}

async function handleClearRecordedResponses(sender) {
  recordedResponses.clear();
  if (sender?.tab?.id) {
    await clearRecordedFromFrame(sender.tab.id, recordTarget);
  }
  return { success: true, count: 0 };
}

async function handleSwapRecordReplaySides(sender) {
  const oldTarget = recordTarget;
  recordSource = recordSource === 'A' ? 'B' : 'A';
  recordTarget = recordTarget === 'A' ? 'B' : 'A';
  recordedResponses.clear();
  const tabId = sender?.tab?.id;
  if (tabId) {
    await clearRecordedFromFrame(tabId, oldTarget);
    if (recordReplayActive) {
      for (const entry of networkEntries) {
        if (entry.label === recordSource && entry.responseBody != null) {
          const key = overrideGetKey(entry.method, entry.url, entry.widgetName);
          if (!recordedResponses.has(key)) recordedResponses.set(key, []);
          const fp = computeFingerprint(entry.method, entry.url, entry.requestBody);
          const newEntry = {
            body: typeof entry.responseBody === 'string' ? entry.responseBody : JSON.stringify(entry.responseBody),
            status: entry.responseStatus || 200,
            contentType: 'application/json',
            requestFingerprint: fp,
          };
          const arr = recordedResponses.get(key);
          const existingIdx = arr.findIndex(r => r.requestFingerprint === fp);
          if (existingIdx >= 0) {
            arr[existingIdx] = newEntry;
          } else {
            arr.push(newEntry);
          }
        }
      }
      if (recordedResponses.size > 0) {
        await syncRecordedToMockTarget(tabId);
        await reloadFrame(tabId, recordTarget);
      }
    }
  }
  return { success: true, source: recordSource, target: recordTarget, count: getRecordedResponseCount() };
}

async function handleRunBulkApiTest(message, sender) {
  const overlayTabId = sender.tab.id;
  const frames = await chrome.webNavigation.getAllFrames({ tabId: overlayTabId });
  const target = getFrameForLabel(frames, message.frameLabel);

  if (!target) {
    return { error: 'Target frame not found', status: 0, responseBody: '', duration: 0 };
  }

  const sanitizedHeaders = {};
  if (message.headers && typeof message.headers === 'object') {
    const skipHeaders = new Set(['host', 'origin', 'referer', 'content-length', 'connection', 'accept-encoding', 'cookie', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform']);
    for (const [k, v] of Object.entries(message.headers)) {
      if (!skipHeaders.has(k.toLowerCase())) {
        sanitizedHeaders[k] = v;
      }
    }
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: overlayTabId, frameIds: [target.frameId] },
      world: 'MAIN',
      func: async (method, url, body, headers) => {
        const fetchOpts = {
          method,
          credentials: 'include',
          headers: { ...headers },
        };
        if (body !== null && body !== undefined && method !== 'GET' && method !== 'HEAD') {
          fetchOpts.body = body;
        }
        const t0 = performance.now();
        try {
          const origFetch = window.__dupscreen_orig_fetch || window.fetch;
          const response = await origFetch.call(window, url, fetchOpts);
          const duration = Math.round(performance.now() - t0);
          let responseBody = '';
          try { responseBody = await response.text(); } catch {}
          return { status: response.status, responseBody, duration, error: '' };
        } catch (err) {
          const duration = Math.round(performance.now() - t0);
          return { status: 0, responseBody: '', duration, error: err.message || 'Network error' };
        }
      },
      args: [message.method, message.url, message.body, sanitizedHeaders],
    });
    return result.result || { error: 'No result', status: 0, responseBody: '', duration: 0 };
  } catch (e) {
    return { error: e.message || 'Script injection failed', status: 0, responseBody: '', duration: 0 };
  }
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  desktopViewTabs.delete(tabId);
  delete scrollSyncTabs[tabId];
  if (splitState.tabA === tabId || splitState.tabB === tabId) {
    splitState.active = false;
  }
  if (overlayTabIds.has(tabId)) {
    await disableHeaderStripping(tabId);
  }
  if (tabId === networkMonitorTabId) {
    networkMonitorTabId = null;
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === networkMonitorWindowId) {
    networkMonitorWindowId = null;
    networkMonitorTabId = null;
  }
});

// Pre-set overrides and recorded responses BEFORE page scripts run.
// All data is set in a single executeScript call to minimize the race window
// between data setup and interceptor injection — prevents early requests
// (like getPortInDetails) from slipping through unpatched fetch/XHR.
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) return;
  if (!overlayTabIds.has(details.tabId)) return;
  if (!isUrlInjectable(details.url)) return;

  const tabId = details.tabId;
  const frameId = details.frameId;

  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
    const frameIndex = subFrames.findIndex(f => f.frameId === frameId);
    if (frameIndex === -1) return;
    const frameLabel = frameIndex === 0 ? 'A' : 'B';

    const plainOv = {};
    if (networkOverrides.size > 0) {
      for (const [k, v] of networkOverrides) {
        plainOv[k] = { body: v.body, status: v.status, contentType: v.contentType };
      }
    }

    const plainRec = {};
    if (recordReplayActive && recordedResponses.size > 0 && frameLabel === recordTarget) {
      for (const [k, v] of recordedResponses) {
        plainRec[k] = v;
      }
    }

    const filter = networkSettings.filterString || '';
    const isRecTarget = recordReplayActive && frameLabel === recordTarget;

    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      world: 'MAIN',
      func: (overrides, recorded, f, lbl, rrActive) => {
        window.__dupscreen_network_overrides = overrides;
        window.__dupscreen_recorded_responses = recorded;
        window.__dupscreen_network_filter = f;
        window.__dupscreen_network_label = lbl;
        window.__dupscreen_record_replay_active = rrActive;
      },
      args: [plainOv, plainRec, filter, frameLabel, isRecTarget],
    }).catch(() => {});

    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      world: 'MAIN',
      files: ['network-interceptor.js'],
    }).catch(() => {});
  } catch {}
});

async function notifyFrameUrlChanged(details) {
  if (details.frameId === 0) return;
  if (!overlayTabIds.has(details.tabId)) return;
  if (!isUrlInjectable(details.url)) return;

  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId: details.tabId });
    const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
    const frameIndex = subFrames.findIndex(f => f.frameId === details.frameId);
    if (frameIndex === -1) return;
    const frameLabel = frameIndex === 0 ? 'A' : 'B';

    chrome.tabs.sendMessage(details.tabId, {
      action: 'frame-url-changed',
      label: frameLabel,
      url: details.url,
    }).catch(() => {});
  } catch {}
}

chrome.webNavigation.onCommitted.addListener(notifyFrameUrlChanged);
chrome.webNavigation.onHistoryStateUpdated.addListener(notifyFrameUrlChanged);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(notifyFrameUrlChanged);

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) return;
  if (!overlayTabIds.has(details.tabId)) return;
  if (!isUrlInjectable(details.url)) return;

  const tabId = details.tabId;
  const frameId = details.frameId;

  if (networkMonitoring) {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    const subFrames = frames.filter(f => f.parentFrameId === 0 && f.frameId !== 0);
    const frameIndex = subFrames.findIndex(f => f.frameId === frameId);
    if (frameIndex !== -1) {
      const frameLabel = frameIndex === 0 ? 'A' : 'B';
      const filter = networkSettings.filterString || '';
      try {
        await chrome.scripting.executeScript({
          target: { tabId, frameIds: [frameId] },
          func: () => {
            if (window.__dupscreen_network_relay) return;
            window.__dupscreen_network_relay = true;
            window.addEventListener('message', (event) => {
              if (event.source !== window) return;
              if (event.data?.type !== '__dupscreen_network__') return;
              try {
                chrome.runtime.sendMessage({ action: 'network-entry', entry: event.data.entry });
              } catch {}
            });
          },
        });

        const plainOv = {};
        if (networkOverrides.size > 0) {
          for (const [k, v] of networkOverrides) {
            plainOv[k] = { body: v.body, status: v.status, contentType: v.contentType };
          }
        }
        const plainRec = {};
        if (recordReplayActive && recordedResponses.size > 0 && frameLabel === recordTarget) {
          for (const [k, v] of recordedResponses) {
            plainRec[k] = v;
          }
        }
        const isRecTarget = recordReplayActive && frameLabel === recordTarget;

        await chrome.scripting.executeScript({
          target: { tabId, frameIds: [frameId] },
          world: 'MAIN',
          func: (overrides, recorded, f, lbl, rrActive) => {
            window.__dupscreen_network_overrides = overrides;
            window.__dupscreen_recorded_responses = recorded;
            window.__dupscreen_network_filter = f;
            window.__dupscreen_network_label = lbl;
            window.__dupscreen_record_replay_active = rrActive;
          },
          args: [plainOv, plainRec, filter, frameLabel, isRecTarget],
        });

        await chrome.scripting.executeScript({
          target: { tabId, frameIds: [frameId] },
          world: 'MAIN',
          files: ['network-interceptor.js'],
        });
      } catch {}
    }
  }
});
