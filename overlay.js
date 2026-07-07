(() => {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  const params = new URLSearchParams(location.search);
  const initialUrlA = params.get('urlA') || '';
  const initialUrlB = params.get('urlB') || '';
  const initialAliasA = params.get('aliasA') || '';
  const initialAliasB = params.get('aliasB') || '';
  const initialTarget = parseInt(params.get('targetWidth')) || 1920;
  const requestedMode = (params.get('mode') || 'opacity').toLowerCase();
  const initialMode = requestedMode === 'sidebyside' || requestedMode === 'swipe'
    ? requestedMode
    : 'opacity';

  const frameA = document.getElementById('frameA');
  const frameB = document.getElementById('frameB');
  const urlAInput = document.getElementById('urlA');
  const urlBInput = document.getElementById('urlB');
  const aliasAInput = document.getElementById('aliasA');
  const aliasBInput = document.getElementById('aliasB');
  const btnRefreshA = document.getElementById('btnRefreshA');
  const btnRefreshB = document.getElementById('btnRefreshB');
  const btnSwap = document.getElementById('btnSwap');
  const btnLoad = document.getElementById('btnLoad');
  const viewport = document.getElementById('viewport');

  const modeOpacity = document.getElementById('modeOpacity');
  const modeSwipe = document.getElementById('modeSwipe');
  const modeSideBySide = document.getElementById('modeSideBySide');
  const opacitySlider = document.getElementById('opacitySlider');
  const opacityValue = document.getElementById('opacityValue');
  const opacityGroup = document.getElementById('opacityGroup');
  const divider = document.getElementById('divider');
  const pointerToggle = document.getElementById('pointerToggle');

  const btnSyncScroll = document.getElementById('btnSyncScroll');
  const btnScreenshot = document.getElementById('btnScreenshot');
  const btnPopA = document.getElementById('btnPopA');
  const btnPopB = document.getElementById('btnPopB');
  const popErrorA = document.getElementById('popErrorA');
  const popErrorB = document.getElementById('popErrorB');
  const errorA = document.getElementById('errorA');
  const errorB = document.getElementById('errorB');
  const wrapA = document.getElementById('wrapA');
  const wrapB = document.getElementById('wrapB');
  const zoomSelect = document.getElementById('zoomSelect');
  const customWidth = document.getElementById('customWidth');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomPct = document.getElementById('zoomPct');
  const ptrA = document.getElementById('ptrA');
  const ptrB = document.getElementById('ptrB');
  const screenshotCanvas = document.getElementById('screenshotCanvas');

  const btnInspect = document.getElementById('btnInspect');
  const btnCompare = document.getElementById('btnCompare');
  const btnNetwork = document.getElementById('btnNetwork');
  const netPanel = document.getElementById('netPanel');
  const netPanelBody = document.getElementById('netPanelBody');
  const netPanelClose = document.getElementById('netPanelClose');
  const netPanelToolbar = document.getElementById('netPanelToolbar');
  const netPanelResize = document.getElementById('netPanelResize');
  const netEmpty = document.getElementById('netEmpty');
  const netFilter = document.getElementById('netFilter');
  const netMax = document.getElementById('netMax');
  const netClear = document.getElementById('netClear');
  const netExport = document.getElementById('netExport');
  const netImport = document.getElementById('netImport');
  const netClearOverrides = document.getElementById('netClearOverrides');
  const overrideModalBackdrop = document.getElementById('overrideModalBackdrop');
  const overrideModalTitle = document.getElementById('overrideModalTitle');
  const overrideModalInfo = document.getElementById('overrideModalInfo');
  const overrideModalStatus = document.getElementById('overrideModalStatus');
  const overrideModalEditor = document.getElementById('overrideModalEditor');
  const overrideModalFormat = document.getElementById('overrideModalFormat');
  const overrideModalSave = document.getElementById('overrideModalSave');
  const overrideModalCancel = document.getElementById('overrideModalCancel');
  const overrideModalClose = document.getElementById('overrideModalClose');
  const netMin = document.getElementById('netMin');

  const btnBulkTest = document.getElementById('btnBulkTest');
  const bulkTestPanel = document.getElementById('bulkTestPanel');
  const bulkTestToolbar = document.getElementById('bulkTestToolbar');
  const bulkTestBody = document.getElementById('bulkTestBody');
  const bulkTestResize = document.getElementById('bulkTestResize');
  const bulkTestMin = document.getElementById('bulkTestMin');
  const bulkTestClose = document.getElementById('bulkTestClose');
  const bulkTabA = document.getElementById('bulkTabA');
  const bulkTabB = document.getElementById('bulkTabB');
  const bulkPtnMdn = document.getElementById('bulkPtnMdn');
  const bulkSubscribers = document.getElementById('bulkSubscribers');
  const bulkBans = document.getElementById('bulkBans');
  const bulkKeywords = document.getElementById('bulkKeywords');
  const bulkPayloadPreview = document.getElementById('bulkPayloadPreview');
  const bulkPayloadTitle = document.getElementById('bulkPayloadTitle');
  const bulkPayloadBody = document.getElementById('bulkPayloadBody');
  const bulkPayloadClose = document.getElementById('bulkPayloadClose');
  const bulkPayloadFormat = document.getElementById('bulkPayloadFormat');
  const bulkPayloadRun = document.getElementById('bulkPayloadRun');
  const bulkClearBtn = document.getElementById('bulkClearBtn');
  const bulkResultsClose = document.getElementById('bulkResultsClose');
  const bulkSelectAll = document.getElementById('bulkSelectAll');
  const bulkRunBtn = document.getElementById('bulkRunBtn');
  const bulkStopBtn = document.getElementById('bulkStopBtn');
  const bulkCaseCount = document.getElementById('bulkCaseCount');
  const bulkHint = document.getElementById('bulkHint');
  const bulkApiList = document.getElementById('bulkApiList');
  const bulkProgress = document.getElementById('bulkProgress');
  const bulkProgressFill = document.getElementById('bulkProgressFill');
  const bulkProgressText = document.getElementById('bulkProgressText');
  const bulkResults = document.getElementById('bulkResults');
  const bulkSummary = document.getElementById('bulkSummary');
  const bulkResultsBody = document.getElementById('bulkResultsBody');

  const cssInspectPanel = document.getElementById('cssInspectPanel');
  const cssInspectHeader = document.getElementById('cssInspectHeader');
  const cssInspectBody = document.getElementById('cssInspectBody');
  const cssComparePanel = document.getElementById('cssComparePanel');
  const cssCompareToolbar = document.getElementById('cssCompareToolbar');
  const cssCompareClose = document.getElementById('cssCompareClose');
  const cssCompareDiffOnly = document.getElementById('cssCompareDiffOnly');
  const cssCompareSelectorA = document.getElementById('cssCompareSelectorA');
  const cssCompareSelectorB = document.getElementById('cssCompareSelectorB');
  const cssCompareBody = document.getElementById('cssCompareBody');
  const cssCompareClear = document.getElementById('cssCompareClear');
  const cssCompareMin = document.getElementById('cssCompareMin');

  const btnDraw = document.getElementById('btnDraw');
  const drawCanvas = document.getElementById('drawCanvas');
  const drawSubControls = document.getElementById('drawSubControls');
  const drawColorPicker = document.getElementById('drawColor');
  const drawSizeSelect = document.getElementById('drawSize');
  const btnDrawClear = document.getElementById('btnDrawClear');
  const btnDrawHide = document.getElementById('btnDrawHide');

  const btnTypography = document.getElementById('btnTypography');
  const typoPanel = document.getElementById('typoPanel');
  const typoPanelToolbar = document.getElementById('typoPanelToolbar');
  const typoPanelBody = document.getElementById('typoPanelBody');
  const typoPanelClose = document.getElementById('typoPanelClose');
  const typoDiffOnly = document.getElementById('typoDiffOnly');
  const typoScan = document.getElementById('typoScan');
  const typoCopy = document.getElementById('typoCopy');
  const typoClear = document.getElementById('typoClear');
  const typoMin = document.getElementById('typoMin');
  const typoEmpty = document.getElementById('typoEmpty');

  const btnMirror = document.getElementById('btnMirror');
  const mirrorPanel = document.getElementById('mirrorPanel');
  const mirrorPanelToolbar = document.getElementById('mirrorPanelToolbar');
  const mirrorClose = document.getElementById('mirrorClose');
  const mirrorMin = document.getElementById('mirrorMin');
  const mirrorSelectorA = document.getElementById('mirrorSelectorA');
  const mirrorSelectorB = document.getElementById('mirrorSelectorB');
  const mirrorStatus = document.getElementById('mirrorStatus');
  const mirrorClear = document.getElementById('mirrorClear');

  const btnRecordMock = document.getElementById('btnRecordMock');
  const recordMockBadge = document.getElementById('recordMockBadge');
  const recordMockLabel = document.getElementById('recordMockLabel');
  const btnRecordMockSwap = document.getElementById('btnRecordMockSwap');

  let currentMode = 'opacity';
  let currentPointerTarget = 'A';
  let dividerPos = 50;
  let isDragging = false;
  let currentUrlA = '';
  let currentUrlB = '';
  let syncScrollActive = false;
  let scrollSyncPaused = false;
  let visualZoom = 1.0;
  let inspectActive = false;
  let inspectPinned = false;
  let inspectDragging = false;
  let inspectDragOffset = { x: 0, y: 0 };
  let compareActive = false;
  let compareDataA = null;
  let compareDataB = null;
  let networkActive = false;
  let networkEntries = [];
  let nextNetworkSeq = 1;
  let networkOverrideKeys = new Set();
  let typographyActive = false;
  let typoDataA = [];
  let typoDataB = [];
  let lastInspectMessage = null;
  let bulkTestActive = false;
  let bulkTestFrame = 'A';
  let bulkTestAbortController = null;
  let bulkPreviewEntry = null;
  let mirrorActive = false;
  let mirrorSelectorPathA = null;
  let mirrorSelectorPathB = null;
  let mirrorActivated = false;
  let drawActive = false;
  let drawHidden = false;
  let isDrawing = false;
  let drawPaths = [];
  let currentDrawPath = null;
  let capturingScreenshot = false;
  let recordMockActive = false;
  let recordMockCount = 0;
  let recordMockSource = 'B';
  let recordMockTarget = 'A';

  init();

  async function init() {
    urlAInput.value = initialUrlA;
    urlBInput.value = initialUrlB;
    aliasAInput.value = initialAliasA;
    aliasBInput.value = initialAliasB;
    updateFrameLabels();
    zoomSelect.value = initialTarget;

    await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'register-overlay' }, () => {
        setTimeout(resolve, 100);
      });
    });

    if (initialUrlA) loadFrame(frameA, initialUrlA, 'A');
    if (initialUrlB) loadFrame(frameB, initialUrlB, 'B');
    currentUrlA = initialUrlA;
    currentUrlB = initialUrlB;

    bindEvents();
    switchMode(initialMode);
  }

  function getAliasLabel(label) {
    if (label === 'A') return aliasAInput.value.trim() || 'A';
    if (label === 'B') return aliasBInput.value.trim() || 'B';
    return label;
  }

  function compareSelectorPrompt(label) {
    return `Click element in ${getAliasLabel(label)}`;
  }

  function updateFrameLabels() {
    if (compareActive) {
      if (!compareDataA) cssCompareSelectorA.textContent = compareSelectorPrompt('A');
      if (!compareDataB) cssCompareSelectorB.textContent = compareSelectorPrompt('B');
      if (compareDataA && compareDataB) renderCompareTable();
    }

    if (inspectActive && lastInspectMessage && cssInspectPanel.classList.contains('visible')) {
      renderInspectPanel(lastInspectMessage);
    }

    if (typographyActive && (typoDataA.length > 0 || typoDataB.length > 0)) {
      renderTypographyTable();
    }

    if (networkActive) {
      renderNetworkPanel();
    }

    bulkTabA.textContent = aliasAInput.value.trim() || 'A';
    bulkTabB.textContent = aliasBInput.value.trim() || 'B';
  }

  function bindEvents() {
    aliasAInput.addEventListener('input', updateFrameLabels);
    aliasBInput.addEventListener('input', updateFrameLabels);

    btnLoad.addEventListener('click', () => {
      const a = urlAInput.value.trim();
      const b = urlBInput.value.trim();
      if (a && a !== currentUrlA) { loadFrame(frameA, a, 'A'); currentUrlA = a; }
      if (b && b !== currentUrlB) { loadFrame(frameB, b, 'B'); currentUrlB = b; }
    });

    btnRefreshA.addEventListener('click', () => refreshFrame('A'));
    btnRefreshB.addEventListener('click', () => refreshFrame('B'));

    urlAInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnLoad.click(); });
    urlBInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnLoad.click(); });

    btnSwap.addEventListener('click', () => {
      [urlAInput.value, urlBInput.value] = [urlBInput.value, urlAInput.value];
      [aliasAInput.value, aliasBInput.value] = [aliasBInput.value, aliasAInput.value];
      updateFrameLabels();
      const tmpUrl = currentUrlA;
      currentUrlA = currentUrlB;
      currentUrlB = tmpUrl;
      loadFrame(frameA, currentUrlA, 'A');
      loadFrame(frameB, currentUrlB, 'B');
    });

    modeOpacity.addEventListener('click', () => switchMode('opacity'));
    modeSwipe.addEventListener('click', () => switchMode('swipe'));
    modeSideBySide.addEventListener('click', () => switchMode('sidebyside'));

    opacitySlider.addEventListener('input', () => {
      const val = parseInt(opacitySlider.value);
      opacityValue.textContent = val + '%';
      if (currentMode === 'opacity') {
        applyOpacity(val);
      } else if (currentMode === 'swipe') {
        dividerPos = val;
        updateSwipeClip();
      }
    });

    setupDividerDrag();

    btnDraw.addEventListener('click', toggleDraw);
    btnDrawClear.addEventListener('click', clearDrawCanvas);
    btnDrawHide.addEventListener('click', toggleDrawHide);
    initDrawCanvas();

    btnSyncScroll.addEventListener('click', toggleSyncScroll);
    btnScreenshot.addEventListener('click', takeScreenshot);

    btnPopA.addEventListener('click', () => popOut('A'));
    btnPopB.addEventListener('click', () => popOut('B'));
    popErrorA.addEventListener('click', () => popOut('A'));
    popErrorB.addEventListener('click', () => popOut('B'));

    zoomSelect.addEventListener('change', () => {
      customWidth.value = zoomSelect.value === '0' ? '' : zoomSelect.value;
      updateZoom();
      if (syncScrollActive) setupScrollSync();
    });
    customWidth.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = parseInt(customWidth.value);
        if (val >= 320 && val <= 3840) {
          zoomSelect.value = '0';
          updateZoom();
        }
      }
    });
    zoomInBtn.addEventListener('click', () => changeVisualZoom(0.1));
    zoomOutBtn.addEventListener('click', () => changeVisualZoom(-0.1));
    zoomPct.addEventListener('click', () => { visualZoom = 1.0; applyVisualZoom(); });
    window.addEventListener('resize', () => { updateZoom(); updateFrameLabelPositions(); resizeDrawCanvas(); });

    ptrA.addEventListener('click', () => setPointerTarget('A'));
    ptrB.addEventListener('click', () => setPointerTarget('B'));

    btnInspect.addEventListener('click', toggleInspect);
    btnCompare.addEventListener('click', toggleCompare);
    cssCompareClose.addEventListener('click', () => {
      if (compareActive) toggleCompare();
    });
    cssCompareDiffOnly.addEventListener('change', renderCompareTable);
    cssCompareClear.addEventListener('click', clearCompareSelections);
    cssCompareMin.addEventListener('click', () => togglePanelMinimize(cssComparePanel, cssCompareMin));
    setupPanelDrag(cssComparePanel, cssCompareToolbar);

    btnTypography.addEventListener('click', toggleTypography);
    typoPanelClose.addEventListener('click', () => {
      if (typographyActive) toggleTypography();
    });
    typoDiffOnly.addEventListener('change', renderTypographyTable);
    typoScan.addEventListener('click', scanTypography);
    typoCopy.addEventListener('click', copyTypographyData);
    typoClear.addEventListener('click', clearTypography);
    typoMin.addEventListener('click', () => togglePanelMinimize(typoPanel, typoMin));
    setupPanelDrag(typoPanel, typoPanelToolbar);

    btnNetwork.addEventListener('click', toggleNetwork);
    netPanelClose.addEventListener('click', () => {
      if (networkActive) toggleNetwork();
    });
    netClear.addEventListener('click', () => {
      networkEntries = [];
      nextNetworkSeq = 1;
      sendMsg({ action: 'clear-network-entries' });
      renderNetworkPanel();
    });
    netFilter.addEventListener('change', () => {
      const filterStr = netFilter.value || 'rest';
      sendMsg({
        action: 'update-network-settings',
        filterString: filterStr,
        maxEntries: parseInt(netMax.value) || 1000,
      });
      sendMsg({ action: 'inject-network', filterString: filterStr });
    });
    netMax.addEventListener('change', () => {
      const nextMax = Math.max(1, Math.min(5000, parseInt(netMax.value) || 1000));
      netMax.value = String(nextMax);
      while (networkEntries.length > nextMax) networkEntries.shift();
      renderNetworkPanel();
      sendMsg({
        action: 'update-network-settings',
        filterString: netFilter.value || 'rest',
        maxEntries: nextMax,
      });
    });
    netExport.addEventListener('click', () => {
      const data = JSON.stringify(networkEntries, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dupscreen-network-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    netImport.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const imported = JSON.parse(reader.result);
            if (!Array.isArray(imported)) { alert('Invalid format: expected a JSON array of entries.'); return; }
            networkEntries = imported;
            normalizeNetworkEntries(networkEntries);
            const max = parseInt(netMax.value) || 1000;
            while (networkEntries.length > max) networkEntries.shift();
            renderNetworkPanel();
            const result = await sendMsg({ action: 'import-network-entries', entries: networkEntries });
            if (result?.recordedCount > 0) {
              recordMockCount = result.recordedCount;
              updateRecordMockBadge();
            }
          } catch (e) {
            alert('Failed to parse JSON file: ' + e.message);
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });
    netClearOverrides.addEventListener('click', async () => {
      await sendMsg({ action: 'clear-network-overrides' });
      networkOverrideKeys.clear();
      renderNetworkPanel();
    });

    btnRecordMock.addEventListener('click', async () => {
      const result = await sendMsg({ action: 'toggle-record-replay' });
      recordMockActive = result?.active ?? false;
      recordMockCount = result?.count ?? 0;
      if (result?.source) recordMockSource = result.source;
      if (result?.target) recordMockTarget = result.target;
      btnRecordMock.classList.toggle('active', recordMockActive);
      btnRecordMock.classList.toggle('recording', recordMockActive);
      updateRecordMockBadge();
      updateRecordMockLabel();
      if (!recordMockActive && !networkActive) {
        sendMsg({ action: 'inject-network', filterString: netFilter.value || 'rest' });
      }
      if (recordMockActive && !networkActive) {
        toggleNetwork();
      }
    });

    btnRecordMockSwap.addEventListener('click', async () => {
      const result = await sendMsg({ action: 'swap-record-replay-sides' });
      if (result?.source) recordMockSource = result.source;
      if (result?.target) recordMockTarget = result.target;
      recordMockCount = 0;
      updateRecordMockLabel();
      updateRecordMockBadge();
    });

    overrideModalClose.addEventListener('click', closeOverrideModal);
    overrideModalCancel.addEventListener('click', closeOverrideModal);
    overrideModalSave.addEventListener('click', saveOverrideFromModal);
    overrideModalBackdrop.addEventListener('click', (e) => {
      if (e.target === overrideModalBackdrop) closeOverrideModal();
    });
    overrideModalFormat.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(overrideModalEditor.value);
        overrideModalEditor.value = JSON.stringify(parsed, null, 2);
      } catch {
        /* not valid JSON, leave as-is */
      }
    });
    overrideModalEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = overrideModalEditor.selectionStart;
        const end = overrideModalEditor.selectionEnd;
        overrideModalEditor.value = overrideModalEditor.value.substring(0, start) + '  ' + overrideModalEditor.value.substring(end);
        overrideModalEditor.selectionStart = overrideModalEditor.selectionEnd = start + 2;
      }
    });
    netMin.addEventListener('click', () => togglePanelMinimize(netPanel, netMin));
    setupPanelDrag(netPanel, netPanelToolbar, 'input, button, select, label');
    setupPanelResize(netPanel, netPanelResize);

    btnBulkTest.addEventListener('click', toggleBulkTest);
    bulkTestClose.addEventListener('click', () => { if (bulkTestActive) toggleBulkTest(); });
    bulkTestMin.addEventListener('click', () => togglePanelMinimize(bulkTestPanel, bulkTestMin));
    setupPanelDrag(bulkTestPanel, bulkTestToolbar, 'input, button, select, textarea, label');
    setupPanelResize(bulkTestPanel, bulkTestResize);
    bulkTabA.addEventListener('click', () => switchBulkTab('A'));
    bulkTabB.addEventListener('click', () => switchBulkTab('B'));
    bulkSelectAll.addEventListener('click', toggleBulkSelectAll);
    bulkApiList.addEventListener('change', updateBulkCaseCount);
    bulkApiList.addEventListener('click', handleBulkApiRowClick);
    bulkPtnMdn.addEventListener('input', updateBulkCaseCount);
    bulkSubscribers.addEventListener('input', updateBulkCaseCount);
    bulkBans.addEventListener('input', updateBulkCaseCount);
    bulkPayloadClose.addEventListener('click', () => { bulkPayloadPreview.style.display = 'none'; });
    bulkPayloadFormat.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(bulkPayloadBody.value);
        bulkPayloadBody.value = JSON.stringify(parsed, null, 2);
      } catch { /* not valid JSON */ }
    });
    bulkPayloadRun.addEventListener('click', runSingleFromPreview);
    bulkClearBtn.addEventListener('click', clearBulkPanel);
    bulkResultsClose.addEventListener('click', () => {
      bulkResults.style.display = 'none';
      bulkResultsBody.innerHTML = '';
      bulkSummary.innerHTML = '';
      bulkProgress.style.display = 'none';
    });
    bulkRunBtn.addEventListener('click', runBulkTests);
    bulkStopBtn.addEventListener('click', stopBulkTests);

    btnMirror.addEventListener('click', toggleMirror);
    mirrorClose.addEventListener('click', () => {
      if (mirrorActive) toggleMirror();
    });
    mirrorClear.addEventListener('click', clearMirrorSelections);
    mirrorMin.addEventListener('click', () => togglePanelMinimize(mirrorPanel, mirrorMin));
    setupPanelDrag(mirrorPanel, mirrorPanelToolbar);

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'scroll-sync-report') {
        handleScrollReport(message);
      } else if (message.action === 'css-inspect-data') {
        handleInspectData(message);
      } else if (message.action === 'css-compare-select') {
        handleCompareSelect(message);
      } else if (message.action === 'network-entry-update') {
        handleNetworkEntryUpdate(message.entry);
        if (message.recordedCount !== undefined) {
          recordMockCount = message.recordedCount;
          updateRecordMockBadge();
        }
      } else if (message.action === 'mirror-select') {
        handleMirrorSelect(message);
      } else if (message.action === 'frame-url-changed') {
        if (message.label === 'A') {
          currentUrlA = message.url;
          urlAInput.value = message.url;
        } else if (message.label === 'B') {
          currentUrlB = message.url;
          urlBInput.value = message.url;
        }
      }
    });
  }

  function loadFrame(frame, url, label) {
    const errorEl = label === 'A' ? errorA : errorB;
    errorEl.classList.remove('visible');
    if (!url) return;

    frame.src = url;
    frame.onerror = () => errorEl.classList.add('visible');

    frame.onload = () => {
      if (syncScrollActive) {
        setTimeout(() => setupScrollSync(), 300);
      }
      const filterStr = netFilter.value || 'rest';
      sendMsg({ action: 'inject-network', filterString: filterStr });
    };
  }

  function refreshFrame(label) {
    const isA = label === 'A';
    const frame = isA ? frameA : frameB;
    const input = isA ? urlAInput : urlBInput;
    const url = input.value.trim() || (isA ? currentUrlA : currentUrlB);
    if (!url) return;

    if (isA) {
      currentUrlA = url;
      urlAInput.value = url;
    } else {
      currentUrlB = url;
      urlBInput.value = url;
    }

    // Force a full reload even when URL has not changed.
    frame.src = 'about:blank';
    setTimeout(() => loadFrame(frame, url, label), 0);
  }

  // ===== Mode switching =====

  function switchMode(mode) {
    currentMode = mode;
    modeOpacity.classList.toggle('active', mode === 'opacity');
    modeSwipe.classList.toggle('active', mode === 'swipe');
    modeSideBySide.classList.toggle('active', mode === 'sidebyside');

    viewport.classList.remove('side-by-side');
    wrapA.style.clipPath = '';
    wrapB.style.clipPath = '';
    divider.classList.remove('visible');

    if (mode === 'opacity') {
      applyOpacityMode();
    } else if (mode === 'swipe') {
      applySwipeMode();
    } else if (mode === 'sidebyside') {
      applySideBySideMode();
    }
  }

  function applyOpacityMode() {
    opacityGroup.style.display = 'flex';
    pointerToggle.style.display = 'flex';
    wrapB.style.clipPath = '';

    resetFramePositions();
    applyInteractZIndex();
    const val = parseInt(opacitySlider.value);
    applyOpacity(val);
    updateZoom();
  }

  function applyOpacity(percent) {
    // The interactive frame is always on top. Adjust opacity so the
    // slider always blends the same way: left=A visible, right=B visible.
    if (currentPointerTarget === 'A') {
      // A is on top: make A transparent as slider moves toward B
      frameA.style.opacity = 1 - percent / 100;
      frameB.style.opacity = 1;
    } else {
      // B is on top: make B opaque as slider moves toward B
      frameB.style.opacity = percent / 100;
      frameA.style.opacity = 1;
    }
  }

  function applyInteractZIndex() {
    if (currentPointerTarget === 'A') {
      wrapA.style.zIndex = '3';
      wrapB.style.zIndex = '1';
    } else {
      wrapA.style.zIndex = '1';
      wrapB.style.zIndex = '3';
    }
  }

  function applySwipeMode() {
    opacityGroup.style.display = 'flex';
    pointerToggle.style.display = 'flex';
    opacitySlider.value = dividerPos;
    opacityValue.textContent = dividerPos + '%';
    divider.classList.add('visible');

    resetFramePositions();
    // In swipe mode, B must be on top for clip-path to work correctly
    wrapA.style.zIndex = '1';
    wrapB.style.zIndex = '2';
    frameA.style.opacity = 1;
    frameB.style.opacity = 1;
    updateSwipeClip();
    updateZoom();
  }

  function applySideBySideMode() {
    opacityGroup.style.display = 'none';
    pointerToggle.style.display = 'none';
    viewport.classList.remove('side-by-side');

    [wrapA, wrapB].forEach(w => {
      w.style.position = 'absolute';
      w.style.top = '0';
    });
    [wrapA, wrapB].forEach(w => {
      w.style.clipPath = '';
    });
    [frameA, frameB].forEach(f => {
      f.style.opacity = '1';
      f.style.pointerEvents = 'auto';
    });

    updateZoomSideBySide();
    updateFrameLabelPositions();
  }

  function updateFrameLabelPositions() {
  }

  function resetFramePositions() {
    viewport.classList.remove('side-by-side');
    [wrapA, wrapB].forEach(w => {
      w.style.position = 'absolute';
      w.style.top = '0';
      w.style.left = '0';
      w.style.width = '100%';
      w.style.height = '100%';
      w.style.clipPath = '';
    });
    wrapA.style.zIndex = '1';
    wrapB.style.zIndex = '2';
    updateFrameLabelPositions();
  }

  function updateSwipeClip() {
    wrapB.style.clipPath = `inset(0 0 0 ${dividerPos}%)`;
    divider.style.left = dividerPos + '%';
  }

  function setupDividerDrag() {
    divider.addEventListener('mousedown', (e) => {
      isDragging = true;
      frameA.style.pointerEvents = 'none';
      frameB.style.pointerEvents = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = viewport.getBoundingClientRect();
      let percent = ((e.clientX - rect.left) / rect.width) * 100;
      percent = Math.max(1, Math.min(99, percent));
      dividerPos = percent;
      opacitySlider.value = percent;
      opacityValue.textContent = Math.round(percent) + '%';
      updateSwipeClip();
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      const active = currentPointerTarget === 'A' ? frameA : frameB;
      const inactive = currentPointerTarget === 'A' ? frameB : frameA;
      active.style.pointerEvents = 'auto';
      inactive.style.pointerEvents = 'none';
    });
  }

  // ===== Zoom =====

  function getTargetWidth() {
    const selectVal = parseInt(zoomSelect.value);
    if (selectVal && selectVal > 0) return selectVal;
    const custom = parseInt(customWidth.value);
    if (custom >= 320 && custom <= 3840) return custom;
    return 0;
  }

  function changeVisualZoom(delta) {
    visualZoom = Math.round(Math.max(0.25, Math.min(3.0, visualZoom + delta)) * 100) / 100;
    applyVisualZoom();
  }

  function applyVisualZoom() {
    zoomPct.textContent = Math.round(visualZoom * 100) + '%';
    updateZoom();
  }

  function updateZoom() {
    if (currentMode === 'sidebyside') {
      updateZoomSideBySide();
      return;
    }

    const targetWidth = getTargetWidth();
    if (!targetWidth) {
      [frameA, frameB].forEach(frame => {
        frame.style.width = '100%';
        frame.style.height = '100%';
        frame.style.transform = '';
        frame.style.zoom = visualZoom !== 1 ? visualZoom : '';
      });
      const needsScroll = visualZoom > 1.01;
      [wrapA, wrapB].forEach(w => {
        w.style.overflow = needsScroll ? 'auto' : 'hidden';
      });
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const actualWidth = viewportRect.width;
    const actualHeight = viewportRect.height;
    const baseScale = actualWidth / targetWidth;
    const scale = baseScale * visualZoom;
    const scaledHeight = actualHeight / baseScale;

    [frameA, frameB].forEach(frame => {
      frame.style.width = targetWidth + 'px';
      frame.style.height = scaledHeight + 'px';
      frame.style.transform = '';
      frame.style.zoom = scale;
    });
    [wrapA, wrapB].forEach(w => {
      w.style.overflow = 'auto';
    });
  }

  function updateZoomSideBySide() {
    const viewportRect = viewport.getBoundingClientRect();
    const halfWidth = viewportRect.width / 2;
    const actualHeight = viewportRect.height;
    const targetWidth = getTargetWidth();

    wrapA.style.left = '0';
    wrapA.style.width = halfWidth + 'px';
    wrapA.style.height = actualHeight + 'px';
    wrapB.style.left = halfWidth + 'px';
    wrapB.style.width = halfWidth + 'px';
    wrapB.style.height = actualHeight + 'px';

    if (!targetWidth) {
      [frameA, frameB].forEach(frame => {
        frame.style.width = '100%';
        frame.style.height = actualHeight + 'px';
        frame.style.transform = '';
        frame.style.zoom = visualZoom !== 1 ? visualZoom : '';
      });
      const needsScroll = visualZoom > 1.01;
      [wrapA, wrapB].forEach(w => {
        w.style.overflow = needsScroll ? 'auto' : 'hidden';
      });
      return;
    }

    const baseScale = halfWidth / targetWidth;
    const scale = baseScale * visualZoom;
    const scaledHeight = actualHeight / baseScale;

    [frameA, frameB].forEach(frame => {
      frame.style.width = targetWidth + 'px';
      frame.style.height = scaledHeight + 'px';
      frame.style.transform = '';
      frame.style.zoom = scale;
    });
    [wrapA, wrapB].forEach(w => {
      w.style.overflow = 'auto';
    });
  }

  // ===== Pointer target =====

  function setPointerTarget(target) {
    currentPointerTarget = target;
    ptrA.classList.toggle('active', target === 'A');
    ptrB.classList.toggle('active', target === 'B');

    const active = target === 'A' ? frameA : frameB;
    const inactive = target === 'A' ? frameB : frameA;
    const inactiveLabel = target === 'A' ? 'B' : 'A';

    // Put the interactive frame ON TOP so it directly receives all events
    active.style.pointerEvents = 'auto';
    inactive.style.pointerEvents = 'none';
    applyInteractZIndex();

    // Re-apply opacity so the visual blend stays consistent
    if (currentMode === 'opacity') {
      const val = parseInt(opacitySlider.value);
      applyOpacity(val);
    }

    // Blur any focused element inside the inactive iframe
    inactive.blur();
    sendMsg({ action: 'blur-frame', frameLabel: inactiveLabel });
    active.focus();

  }

  // ===== Pop out (from inside the iframe to preserve session) =====

  function popOut(label) {
    chrome.runtime.sendMessage({
      action: 'pop-out-from-frame',
      frameLabel: label,
    });
  }

  // ===== Sync Scroll =====

  function toggleSyncScroll() {
    syncScrollActive = !syncScrollActive;
    btnSyncScroll.classList.toggle('active', syncScrollActive);

    if (syncScrollActive) {
      setupScrollSync();
    } else {
      teardownScrollSync();
    }
  }

  function setupScrollSync() {
    chrome.runtime.sendMessage({
      action: 'setup-scroll-sync',
      enabled: true,
    });
  }

  function teardownScrollSync() {
    chrome.runtime.sendMessage({
      action: 'setup-scroll-sync',
      enabled: false,
    });
  }

  function handleScrollReport(message) {
    if (!syncScrollActive || scrollSyncPaused) return;
    scrollSyncPaused = true;

    const targetFrame = message.sourceLabel === 'A' ? 'B' : 'A';
    chrome.runtime.sendMessage({
      action: 'apply-scroll',
      targetLabel: targetFrame,
      scrollXPercent: message.scrollXPercent,
      scrollYPercent: message.scrollYPercent,
    });

    setTimeout(() => { scrollSyncPaused = false; }, 50);
  }

  // ===== Full-page high-res screenshot via debugger on overlay tab =====

  const toolbar = document.querySelector('.toolbar');
  const controls = document.querySelector('.controls');

  function saveDrawLayout(targetWidth) {
    const vpRect = viewport.getBoundingClientRect();
    let zoom;
    if (currentMode === 'sidebyside') {
      const halfW = vpRect.width / 2;
      zoom = targetWidth > 0 ? (halfW / targetWidth) * visualZoom : visualZoom;
    } else {
      zoom = targetWidth > 0 ? (vpRect.width / targetWidth) * visualZoom : visualZoom;
    }
    const r = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, width: b.width, height: b.height }; };
    return {
      vpRect: r(viewport),
      wrapARect: r(wrapA),
      wrapBRect: r(wrapB),
      scrollATop: wrapA.scrollTop, scrollALeft: wrapA.scrollLeft,
      scrollBTop: wrapB.scrollTop, scrollBLeft: wrapB.scrollLeft,
      zoom: zoom || 1,
      canvasDpr: drawCanvas.width / vpRect.width,
    };
  }

  async function takeScreenshot() {
    if (!currentUrlA && !currentUrlB) return;

    btnScreenshot.disabled = true;
    capturingScreenshot = true;
    const savedMode = currentMode;
    const savedOpacity = opacitySlider.value;

    const targetWidth = getTargetWidth() || 1920;
    const dpr = 2;
    const drawLayout = saveDrawLayout(targetWidth);

    drawCanvas.style.display = 'none';

    try {
      let imageA = null;
      let imageB = null;

      if (currentUrlA) {
        imageA = await captureFrame('A', targetWidth, dpr);
      }
      if (currentUrlB) {
        imageB = await captureFrame('B', targetWidth, dpr);
      }

      restoreAfterCapture(savedMode, savedOpacity);

      if (imageA && imageB) {
        compositeAndDownload(imageA, imageB, drawLayout, dpr);
      } else if (imageA) {
        downloadSingle(imageA, 'A');
      } else if (imageB) {
        downloadSingle(imageB, 'B');
      }
    } catch (e) {
      console.error('Screenshot failed:', e);
      restoreAfterCapture(savedMode, savedOpacity);
    } finally {
      drawCanvas.style.display = '';
      capturingScreenshot = false;
      btnScreenshot.disabled = false;
    }
  }

  async function captureFrame(label, targetWidth, dpr) {
    enterCaptureMode();

    await sendMsg({ action: 'scroll-frame-to', frameLabel: label, x: 0, y: 0 });
    await sleep(300);

    // Set width to targetWidth first (with a tiny height so scrollHeight
    // reflects the actual content height after reflow at the new width)
    prepareFrameForCapture(label, targetWidth, 1);
    await sleep(500);

    // Measure the real content height now that the width matches the target
    const dims = await sendMsg({ action: 'get-frame-dimensions', frameLabel: label });
    const contentHeight = Math.max(dims?.scrollHeight || 800, dims?.viewportHeight || 800);

    // Apply the correct height and give a brief moment to settle
    const showFrame = label === 'A' ? frameA : frameB;
    showFrame.style.setProperty('height', contentHeight + 'px', 'important');
    await sleep(300);

    const result = await sendMsg({
      action: 'capture-overlay-tab',
      targetWidth,
      dpr,
      contentHeight,
    });

    return result?.dataUrl || null;
  }

  function enterCaptureMode() {
    toolbar.setAttribute('style', 'display:none !important;');
    controls.setAttribute('style', 'display:none !important;');
  }

  function prepareFrameForCapture(label, targetWidth, contentHeight) {
    divider.classList.remove('visible');

    const showWrap = label === 'A' ? wrapA : wrapB;
    const hideWrap = label === 'A' ? wrapB : wrapA;
    const showFrame = label === 'A' ? frameA : frameB;

    hideWrap.setAttribute('style', 'display:none !important;');

    // Neutralize parents so position:fixed on the iframe works relative
    // to the true viewport (transform on a parent would break this)
    viewport.setAttribute('style',
      'position:static !important; transform:none !important; filter:none !important;' +
      'width:0 !important; height:0 !important; overflow:visible !important;' +
      'will-change:auto !important; contain:none !important;'
    );
    showWrap.setAttribute('style',
      'position:static !important; transform:none !important; filter:none !important;' +
      'width:0 !important; height:0 !important; overflow:visible !important;' +
      'will-change:auto !important; contain:none !important;'
    );

    // Pin the iframe at viewport origin; when the debugger resizes the
    // viewport to targetWidth x contentHeight the iframe fills it exactly
    showFrame.setAttribute('style',
      `position:fixed !important; top:0 !important; left:0 !important;` +
      `width:${targetWidth}px !important; height:${contentHeight}px !important;` +
      `zoom:1 !important; opacity:1 !important;` +
      `transform:none !important; border:none !important; display:block !important;` +
      `z-index:999999 !important; margin:0 !important; padding:0 !important;`
    );
  }

  function restoreAfterCapture(savedMode, savedOpacity) {
    toolbar.removeAttribute('style');
    controls.removeAttribute('style');
    viewport.removeAttribute('style');
    [wrapA, wrapB].forEach(w => w.removeAttribute('style'));
    [frameA, frameB].forEach(f => f.removeAttribute('style'));
    opacitySlider.value = savedOpacity;
    switchMode(savedMode);
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function sendMsg(msg) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(msg, resolve);
    });
  }

  function compositeAndDownload(dataUrlA, dataUrlB, drawLayout, captureDpr) {
    const imgA = new Image();
    const imgB = new Image();
    let loadedCount = 0;

    function onBothLoaded() {
      const drawW = Math.max(imgA.width, imgB.width);
      const maxH = Math.max(imgA.height, imgB.height);

      const labelH = 32;
      const dividerWidth = 4;
      const w = drawW * 2 + dividerWidth;
      const h = maxH + labelH;

      screenshotCanvas.width = w;
      screenshotCanvas.height = h;
      const ctx = screenshotCanvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, labelH);
      ctx.font = 'bold 18px sans-serif';
      const labelA = aliasAInput.value.trim() || 'A';
      const labelB = aliasBInput.value.trim() || 'B';
      ctx.fillStyle = '#a09aff';
      ctx.fillText(labelA, 12, 22);
      ctx.fillStyle = '#ea80ff';
      ctx.fillText(labelB, drawW + dividerWidth + 12, 22);

      ctx.drawImage(imgA, 0, labelH);
      ctx.fillStyle = '#6c63ff';
      ctx.fillRect(drawW, 0, dividerWidth, h);
      ctx.drawImage(imgB, drawW + dividerWidth, labelH);

      // Overlay drawings mapped from viewport coords to full-page coords
      if (drawPaths.length > 0 && drawCanvas.width > 0 && drawCanvas.height > 0 && drawLayout) {
        const { vpRect, wrapARect, wrapBRect,
                scrollATop, scrollALeft, scrollBTop, scrollBLeft,
                zoom, canvasDpr } = drawLayout;

        // Frame A region
        const srcAx = (wrapARect.left - vpRect.left) * canvasDpr;
        const srcAy = (wrapARect.top - vpRect.top) * canvasDpr;
        const srcAw = wrapARect.width * canvasDpr;
        const srcAh = wrapARect.height * canvasDpr;
        if (srcAw > 0 && srcAh > 0) {
          const dstAx = scrollALeft / zoom * captureDpr;
          const dstAy = labelH + scrollATop / zoom * captureDpr;
          const dstAw = wrapARect.width / zoom * captureDpr;
          const dstAh = wrapARect.height / zoom * captureDpr;
          ctx.drawImage(drawCanvas, srcAx, srcAy, srcAw, srcAh, dstAx, dstAy, dstAw, dstAh);
        }

        // Frame B region (offset by drawW + divider in composite)
        const srcBx = (wrapBRect.left - vpRect.left) * canvasDpr;
        const srcBy = (wrapBRect.top - vpRect.top) * canvasDpr;
        const srcBw = wrapBRect.width * canvasDpr;
        const srcBh = wrapBRect.height * canvasDpr;
        if (srcBw > 0 && srcBh > 0) {
          const dstBx = drawW + dividerWidth + scrollBLeft / zoom * captureDpr;
          const dstBy = labelH + scrollBTop / zoom * captureDpr;
          const dstBw = wrapBRect.width / zoom * captureDpr;
          const dstBh = wrapBRect.height / zoom * captureDpr;
          ctx.drawImage(drawCanvas, srcBx, srcBy, srcBw, srcBh, dstBx, dstBy, dstBw, dstBh);
        }
      }

      const link = document.createElement('a');
      link.download = `dupscreen-compare-${Date.now()}.png`;
      link.href = screenshotCanvas.toDataURL('image/png');
      link.click();
    }

    imgA.onload = () => { if (++loadedCount === 2) onBothLoaded(); };
    imgB.onload = () => { if (++loadedCount === 2) onBothLoaded(); };
    imgA.src = dataUrlA;
    imgB.src = dataUrlB;
  }

  function downloadSingle(dataUrl, label) {
    const link = document.createElement('a');
    link.download = `dupscreen-fullpage-${label}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  // ===== Drawing Overlay =====

  function initDrawCanvas() {
    resizeDrawCanvas();

    drawCanvas.addEventListener('mousedown', (e) => {
      if (!drawActive || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDrawing = true;
      const rect = drawCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (drawCanvas.width / rect.width);
      const y = (e.clientY - rect.top) * (drawCanvas.height / rect.height);
      currentDrawPath = {
        color: drawColorPicker.value,
        size: parseInt(drawSizeSelect.value),
        points: [{ x, y }],
      };
      const ctx = drawCanvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(x, y, currentDrawPath.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = currentDrawPath.color;
      ctx.fill();
    });

    drawCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawing || !currentDrawPath) return;
      e.preventDefault();
      const rect = drawCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (drawCanvas.width / rect.width);
      const y = (e.clientY - rect.top) * (drawCanvas.height / rect.height);
      currentDrawPath.points.push({ x, y });
      const pts = currentDrawPath.points;
      const ctx = drawCanvas.getContext('2d');
      ctx.strokeStyle = currentDrawPath.color;
      ctx.lineWidth = currentDrawPath.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    document.addEventListener('mouseup', () => {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentDrawPath && currentDrawPath.points.length > 0) {
        drawPaths.push(currentDrawPath);
      }
      currentDrawPath = null;
    });

    drawCanvas.addEventListener('mouseleave', () => {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentDrawPath && currentDrawPath.points.length > 0) {
        drawPaths.push(currentDrawPath);
      }
      currentDrawPath = null;
    });
  }

  function resizeDrawCanvas() {
    if (capturingScreenshot) return;
    const vp = viewport.getBoundingClientRect();
    const oldW = drawCanvas.width;
    const oldH = drawCanvas.height;
    if (oldW === 0 && oldH === 0) {
      drawCanvas.width = vp.width * window.devicePixelRatio;
      drawCanvas.height = vp.height * window.devicePixelRatio;
      return;
    }
    if (drawPaths.length === 0) {
      drawCanvas.width = vp.width * window.devicePixelRatio;
      drawCanvas.height = vp.height * window.devicePixelRatio;
      return;
    }
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = oldW;
    tempCanvas.height = oldH;
    tempCanvas.getContext('2d').drawImage(drawCanvas, 0, 0);
    drawCanvas.width = vp.width * window.devicePixelRatio;
    drawCanvas.height = vp.height * window.devicePixelRatio;
    const ctx = drawCanvas.getContext('2d');
    ctx.drawImage(tempCanvas, 0, 0, oldW, oldH, 0, 0, drawCanvas.width, drawCanvas.height);
  }

  function redrawAllPaths() {
    const ctx = drawCanvas.getContext('2d');
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    for (const path of drawPaths) {
      if (path.points.length === 1) {
        ctx.beginPath();
        ctx.arc(path.points[0].x, path.points[0].y, path.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = path.color;
        ctx.fill();
        continue;
      }
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    }
  }

  function toggleDraw() {
    drawActive = !drawActive;
    btnDraw.classList.toggle('active', drawActive);
    drawCanvas.classList.toggle('active', drawActive);
    drawSubControls.classList.toggle('visible', drawActive);

    if (drawActive) {
      resizeDrawCanvas();
      if (inspectActive) toggleInspect();
      if (compareActive) toggleCompare();
      if (mirrorActive) toggleMirror();
    }
  }

  function clearDrawCanvas() {
    drawPaths = [];
    const ctx = drawCanvas.getContext('2d');
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  }

  function toggleDrawHide() {
    drawHidden = !drawHidden;
    drawCanvas.classList.toggle('hidden', drawHidden);
    btnDrawHide.classList.toggle('draw-hide-active', drawHidden);
    btnDrawHide.textContent = drawHidden ? 'Show' : 'Hide';
  }

  // ===== CSS Inspector =====

  function toggleInspect() {
    inspectActive = !inspectActive;
    btnInspect.classList.toggle('active', inspectActive);

    if (compareActive && inspectActive) {
      toggleCompare();
    }
    if (drawActive && inspectActive) {
      toggleDraw();
    }
    if (mirrorActive && inspectActive) {
      toggleMirror();
    }

    if (inspectActive) {
      inspectPinned = false;
      cssInspectPanel.classList.remove('pinned');
      sendMsg({ action: 'inject-inspector', frameLabel: 'A' });
      sendMsg({ action: 'inject-inspector', frameLabel: 'B' });
    } else {
      inspectPinned = false;
      sendMsg({ action: 'remove-inspector', frameLabel: 'A' });
      sendMsg({ action: 'remove-inspector', frameLabel: 'B' });
      cssInspectPanel.classList.remove('visible', 'pinned');
    }
  }

  function handleInspectData(message) {
    if (!inspectActive) return;

    if (message.pinned) {
      inspectPinned = true;
      cssInspectPanel.classList.add('pinned');
      lastInspectMessage = message;
      renderInspectPanel(message);
      positionInspectPanel(message.rect);
      return;
    }

    if (inspectPinned) return;

    if (!message.selector) {
      lastInspectMessage = null;
      cssInspectPanel.classList.remove('visible');
      return;
    }

    cssInspectPanel.classList.remove('pinned');
    lastInspectMessage = message;
    renderInspectPanel(message);
    positionInspectPanel(message.rect);
  }

  function renderInspectPanel(message) {
    cssInspectPanel.classList.add('visible');
    const hint = inspectPinned
      ? '<span class="css-inspect-hint">pinned - drag to move</span>'
      : '<span class="css-inspect-hint">Shift+click to pin</span>';
    const inspectLabel = getAliasLabel(message.label);
    cssInspectHeader.innerHTML = `[${escHtml(inspectLabel)}] ${escHtml(message.selector)}${hint}`;

    let html = '';
    for (const [group, props] of Object.entries(message.groups)) {
      html += `<div class="css-inspect-group"><div class="css-inspect-group-title">${group}</div>`;
      for (const [prop, val] of Object.entries(props)) {
        html += `<div class="css-inspect-row"><span class="css-inspect-prop">${prop}</span><span class="css-inspect-val">${escHtml(rgbToHex(val))}</span></div>`;
      }
      html += '</div>';
    }
    cssInspectBody.innerHTML = html;
  }

  function positionInspectPanel(rect) {
    if (inspectDragging) return;
    const vpRect = viewport.getBoundingClientRect();
    const panelW = 300;
    let left, top;
    if (rect) {
      left = rect.right + 8;
      top = rect.top + vpRect.top;
      if (left + panelW > window.innerWidth) left = rect.left - panelW - 8;
      if (left < 0) left = 4;
      if (top < vpRect.top) top = vpRect.top;
      if (top + 100 > window.innerHeight) top = window.innerHeight - 200;
    } else {
      left = 20;
      top = vpRect.top + 20;
    }
    cssInspectPanel.style.left = left + 'px';
    cssInspectPanel.style.top = top + 'px';
  }

  // Drag the inspect panel by its header
  cssInspectHeader.addEventListener('mousedown', (e) => {
    if (!inspectPinned) return;
    inspectDragging = true;
    const panelRect = cssInspectPanel.getBoundingClientRect();
    inspectDragOffset.x = e.clientX - panelRect.left;
    inspectDragOffset.y = e.clientY - panelRect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!inspectDragging) return;
    cssInspectPanel.style.left = (e.clientX - inspectDragOffset.x) + 'px';
    cssInspectPanel.style.top = (e.clientY - inspectDragOffset.y) + 'px';
  });

  document.addEventListener('mouseup', () => {
    inspectDragging = false;
  });

  // Click anywhere outside the pinned panel to unpin
  document.addEventListener('click', (e) => {
    if (!inspectPinned) return;
    if (cssInspectPanel.contains(e.target)) return;
    inspectPinned = false;
    cssInspectPanel.classList.remove('pinned');
  });

  // ===== CSS Compare =====

  function toggleCompare() {
    compareActive = !compareActive;
    btnCompare.classList.toggle('active', compareActive);

    if (inspectActive && compareActive) {
      toggleInspect();
    }
    if (drawActive && compareActive) {
      toggleDraw();
    }
    if (mirrorActive && compareActive) {
      toggleMirror();
    }

    if (compareActive) {
      compareDataA = null;
      compareDataB = null;
      cssCompareSelectorA.textContent = compareSelectorPrompt('A');
      cssCompareSelectorB.textContent = compareSelectorPrompt('B');
      cssCompareBody.innerHTML = '<p style="padding:20px;color:#666;text-align:center">Click an element in each frame to compare their CSS properties.</p>';
      cssComparePanel.style.cssText = '';
      cssComparePanel.classList.remove('minimized');
      cssCompareMin.innerHTML = '&#x2015;';
      cssCompareMin.title = 'Minimize';
      cssComparePanel.classList.add('visible');
      sendMsg({ action: 'inject-compare' });
    } else {
      cssComparePanel.classList.remove('visible', 'minimized');
      sendMsg({ action: 'remove-compare' });
    }
  }

  function handleCompareSelect(message) {
    if (!compareActive) return;
    if (message.label === 'A') {
      compareDataA = message;
      cssCompareSelectorA.textContent = message.selector;
    } else {
      compareDataB = message;
      cssCompareSelectorB.textContent = message.selector;
    }
    if (compareDataA && compareDataB) {
      renderCompareTable();
    }
  }

  function renderCompareTable() {
    if (!compareDataA || !compareDataB) return;
    const diffOnly = cssCompareDiffOnly.checked;
    const allGroups = new Set([...Object.keys(compareDataA.groups), ...Object.keys(compareDataB.groups)]);
    const compareLabelA = escHtml(getAliasLabel('A'));
    const compareLabelB = escHtml(getAliasLabel('B'));

    let html = `<table><thead><tr><th>Property</th><th>${compareLabelA}</th><th>${compareLabelB}</th></tr></thead><tbody>`;
    for (const group of allGroups) {
      const propsA = compareDataA.groups[group] || {};
      const propsB = compareDataB.groups[group] || {};
      const allProps = [...new Set([...Object.keys(propsA), ...Object.keys(propsB)])];

      let groupRows = '';
      let hasVisibleRow = false;
      for (const prop of allProps) {
        const valA = propsA[prop] || '';
        const valB = propsB[prop] || '';
        const isDiff = valA !== valB;
        if (diffOnly && !isDiff) continue;
        hasVisibleRow = true;
        groupRows += `<tr class="${isDiff ? 'diff' : 'same'}"><td>${prop}</td><td>${escHtml(rgbToHex(valA))}</td><td>${escHtml(rgbToHex(valB))}</td></tr>`;
      }
      if (hasVisibleRow) {
        html += `<tr class="group-header"><td colspan="3">${group}</td></tr>` + groupRows;
      }
    }
    html += '</tbody></table>';
    cssCompareBody.innerHTML = html;
  }

  function clearCompareSelections() {
    compareDataA = null;
    compareDataB = null;
    cssCompareSelectorA.textContent = compareSelectorPrompt('A');
    cssCompareSelectorB.textContent = compareSelectorPrompt('B');
    cssCompareBody.innerHTML = '<p style="padding:20px;color:#666;text-align:center">Click an element in each frame to compare their CSS properties.</p>';
    sendMsg({ action: 'remove-compare' });
    sendMsg({ action: 'inject-compare' });
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function rgbToHex(str) {
    return str.replace(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\s*\)/gi, (_, r, g, b) => {
      return '#' + [r, g, b].map(c => Number(c).toString(16).padStart(2, '0')).join('');
    });
  }

  // ===== Mirror Interaction =====

  function mirrorSelectorPrompt(label) {
    return `Click element in ${getAliasLabel(label)}`;
  }

  function toggleMirror() {
    mirrorActive = !mirrorActive;
    btnMirror.classList.toggle('active', mirrorActive);

    if (inspectActive && mirrorActive) toggleInspect();
    if (compareActive && mirrorActive) toggleCompare();
    if (drawActive && mirrorActive) toggleDraw();

    if (mirrorActive) {
      mirrorSelectorPathA = null;
      mirrorSelectorPathB = null;
      mirrorActivated = false;
      mirrorSelectorA.textContent = mirrorSelectorPrompt('A');
      mirrorSelectorB.textContent = mirrorSelectorPrompt('B');
      mirrorStatus.textContent = 'Select matching elements in each frame to mirror interactions.';
      mirrorStatus.classList.remove('active');
      mirrorPanel.style.cssText = '';
      mirrorPanel.classList.remove('minimized');
      mirrorMin.innerHTML = '&#x2015;';
      mirrorMin.title = 'Minimize';
      mirrorPanel.classList.add('visible');
      sendMsg({ action: 'inject-mirror' });
    } else {
      mirrorPanel.classList.remove('visible', 'minimized');
      mirrorActivated = false;
      sendMsg({ action: 'remove-mirror' });
    }
  }

  function handleMirrorSelect(message) {
    if (!mirrorActive) return;
    if (message.label === 'A') {
      mirrorSelectorPathA = message.selectorPath;
      mirrorSelectorA.textContent = message.display;
    } else {
      mirrorSelectorPathB = message.selectorPath;
      mirrorSelectorB.textContent = message.display;
    }
    if (mirrorSelectorPathA && mirrorSelectorPathB) {
      activateMirror();
    }
  }

  async function activateMirror() {
    mirrorActivated = true;
    mirrorStatus.textContent = 'Mirroring active — interactions on either side are replayed on the other.';
    mirrorStatus.classList.add('active');
    await sendMsg({
      action: 'activate-mirror',
      selectorA: mirrorSelectorPathA,
      selectorB: mirrorSelectorPathB,
    });
  }

  function clearMirrorSelections() {
    mirrorSelectorPathA = null;
    mirrorSelectorPathB = null;
    mirrorActivated = false;
    mirrorSelectorA.textContent = mirrorSelectorPrompt('A');
    mirrorSelectorB.textContent = mirrorSelectorPrompt('B');
    mirrorStatus.textContent = 'Select matching elements in each frame to mirror interactions.';
    mirrorStatus.classList.remove('active');
    sendMsg({ action: 'remove-mirror' });
    sendMsg({ action: 'inject-mirror' });
  }

  // ===== Typography Compare =====

  function toggleTypography() {
    typographyActive = !typographyActive;
    btnTypography.classList.toggle('active', typographyActive);

    if (typographyActive) {
      typoPanel.style.cssText = '';
      typoPanel.classList.remove('minimized');
      typoMin.innerHTML = '&#x2015;';
      typoMin.title = 'Minimize';
      typoPanel.classList.add('visible');
    } else {
      typoPanel.classList.remove('visible', 'minimized');
    }
  }

  function clearTypography() {
    typoDataA = [];
    typoDataB = [];
    typoPanelBody.innerHTML = '<p class="typo-empty">Click "Scan" to collect typography from both pages.</p>';
  }

  async function scanTypography() {
    typoScan.disabled = true;
    typoScan.textContent = 'Scanning…';
    typoPanelBody.innerHTML = '<p class="typo-empty">Scanning text in both pages…</p>';

    try {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'scan-typography' }, resolve);
      });
      if (resp && resp.data) {
        typoDataA = resp.data.A || [];
        typoDataB = resp.data.B || [];
        renderTypographyTable();
      } else {
        typoPanelBody.innerHTML = '<p class="typo-empty">Failed to scan. Make sure both pages are loaded.</p>';
      }
    } catch (e) {
      typoPanelBody.innerHTML = '<p class="typo-empty">Error scanning pages.</p>';
    }

    typoScan.disabled = false;
    typoScan.textContent = 'Scan Pages';
  }

  function normalizeTypoText(t) {
    return t.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function fuzzyMatch(a, b) {
    const na = normalizeTypoText(a);
    const nb = normalizeTypoText(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) {
      return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
    }
    let common = 0;
    const wordsA = a.toLowerCase().split(/\s+/);
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    for (const w of wordsA) {
      if (w.length > 1 && wordsB.has(w)) common++;
    }
    const total = Math.max(wordsA.length, wordsB.size);
    return total > 0 ? common / total : 0;
  }

  function matchTypoItems(listA, listB) {
    const paired = [];
    const usedA = new Set();
    const usedB = new Set();

    const byTextA = new Map();
    for (let i = 0; i < listA.length; i++) {
      const key = listA[i].text.toLowerCase().trim();
      if (!byTextA.has(key)) byTextA.set(key, i);
    }
    const byTextB = new Map();
    for (let i = 0; i < listB.length; i++) {
      const key = listB[i].text.toLowerCase().trim();
      if (!byTextB.has(key)) byTextB.set(key, i);
    }

    for (const [key, idxA] of byTextA) {
      if (byTextB.has(key)) {
        const idxB = byTextB.get(key);
        paired.push({ a: listA[idxA], b: listB[idxB], textMatch: 'exact' });
        usedA.add(idxA);
        usedB.add(idxB);
      }
    }

    const unmatchedA = listA.map((item, i) => ({ item, i })).filter(x => !usedA.has(x.i));
    const unmatchedB = listB.map((item, i) => ({ item, i })).filter(x => !usedB.has(x.i));

    for (const entA of unmatchedA) {
      let bestScore = 0.4;
      let bestIdx = -1;
      for (let j = 0; j < unmatchedB.length; j++) {
        if (usedB.has(unmatchedB[j].i)) continue;
        const score = fuzzyMatch(entA.item.text, unmatchedB[j].item.text);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = j;
        }
      }
      if (bestIdx >= 0) {
        paired.push({ a: entA.item, b: unmatchedB[bestIdx].item, textMatch: 'fuzzy' });
        usedA.add(entA.i);
        usedB.add(unmatchedB[bestIdx].i);
      }
    }

    for (const entA of unmatchedA) {
      if (!usedA.has(entA.i)) paired.push({ a: entA.item, b: null, textMatch: 'none' });
    }
    for (const entB of unmatchedB) {
      if (!usedB.has(entB.i)) paired.push({ a: null, b: entB.item, textMatch: 'none' });
    }

    return paired;
  }

  function renderTypographyTable() {
    const diffOnly = typoDiffOnly.checked;
    const paired = matchTypoItems(typoDataA, typoDataB);

    if (paired.length === 0) {
      typoPanelBody.innerHTML = '<p class="typo-empty">No text found on either page.</p>';
      return;
    }

    const props = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing'];
    const propLabels = { fontFamily: 'Font Family', fontSize: 'Size', fontWeight: 'Weight', lineHeight: 'Line H.', color: 'Color', letterSpacing: 'Spacing' };
    const labelA = aliasAInput.value.trim() || 'A';
    const labelB = aliasBInput.value.trim() || 'B';

    const rows = [];
    for (const pair of paired) {
      const { a, b } = pair;
      const textA = a ? a.text : '';
      const textB = b ? b.text : '';
      const textDiff = (!a || !b) || normalizeTypoText(textA) !== normalizeTypoText(textB);
      const diffs = {};
      let hasDiff = false;
      for (const p of props) {
        const va = a ? a[p] : null;
        const vb = b ? b[p] : null;
        const isDiff = (!a || !b) || va !== vb;
        diffs[p] = isDiff;
        if (isDiff) hasDiff = true;
      }
      if (textDiff) hasDiff = true;
      if (diffOnly && !hasDiff) continue;
      rows.push({ a, b, textA, textB, textDiff, diffs, hasDiff, textMatch: pair.textMatch });
    }

    if (rows.length === 0) {
      typoPanelBody.innerHTML = '<p class="typo-empty">All typography matches between the two pages.</p>';
      return;
    }

    let html = '<table class="typo-table"><thead><tr>';
    html += `<th>${labelA} Element</th><th>${labelB} Element</th><th>${labelA} Text</th><th>${labelB} Text</th>`;
    for (const p of props) {
      html += `<th>${labelA} ${propLabels[p]}</th><th>${labelB} ${propLabels[p]}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const row of rows) {
      const { a, b, textA, textB, textDiff, diffs, textMatch } = row;
      const selA = a ? a.selector : '';
      const selB = b ? b.selector : '';

      const fuzzyIndicator = textMatch === 'fuzzy' ? ' title="Fuzzy matched"' : '';
      const textClassA = textA ? (textDiff ? 'typo-diff' : '') : 'typo-missing';
      const textClassB = textB ? (textDiff ? 'typo-diff' : '') : 'typo-missing';
      html += `<tr${fuzzyIndicator}>`;
      html += `<td class="typo-selector" title="${escHtml(selA)}">${selA ? escHtml(selA) : '<span class="typo-missing">—</span>'}</td>`;
      html += `<td class="typo-selector" title="${escHtml(selB)}">${selB ? escHtml(selB) : '<span class="typo-missing">—</span>'}</td>`;
      html += `<td class="typo-text-preview" title="${escHtml(textA)}">${textA ? `<span class="${textClassA}">${escHtml(textA)}</span>` : '<span class="typo-missing">—</span>'}</td>`;
      html += `<td class="typo-text-preview" title="${escHtml(textB)}">${textB ? `<span class="${textClassB}">${escHtml(textB)}</span>` : '<span class="typo-missing">—</span>'}</td>`;

      for (const p of props) {
        const va = a ? a[p] : null;
        const vb = b ? b[p] : null;
        const cls = diffs[p] ? ' typo-diff' : '';
        const missingCls = ' typo-missing';

        html += `<td class="typo-val"><span class="${va === null ? missingCls : cls}">${va !== null ? escHtml(rgbToHex(va)) : '—'}</span></td>`;
        html += `<td class="typo-val"><span class="${vb === null ? missingCls : cls}">${vb !== null ? escHtml(rgbToHex(vb)) : '—'}</span></td>`;
      }

      html += '</tr>';
    }

    html += '</tbody></table>';
    typoPanelBody.innerHTML = html;
  }

  function copyTypographyData() {
    const paired = matchTypoItems(typoDataA, typoDataB);
    const props = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing'];
    const labelA = aliasAInput.value.trim() || 'A';
    const labelB = aliasBInput.value.trim() || 'B';

    let text = `Typography Compare (${labelA} vs ${labelB})\n${'='.repeat(60)}\n\n`;

    for (const { a, b, textMatch } of paired) {
      const textA = a ? a.text : '—';
      const textB = b ? b.text : '—';
      const textDiff = normalizeTypoText(textA) !== normalizeTypoText(textB);
      let hasDiff = false;
      const matchNote = textMatch === 'fuzzy' ? ' [fuzzy match]' : '';

      let entry = `${labelA}: "${textA}" | ${labelB}: "${textB}"${matchNote}\n`;
      entry += `  ${labelA} element: ${a ? a.selector : '—'}\n`;
      entry += `  ${labelB} element: ${b ? b.selector : '—'}\n`;
      entry += `  text: ${labelA}="${textA}" | ${labelB}="${textB}"${textDiff ? ' ◄' : ''}\n`;
      if (textDiff) hasDiff = true;
      for (const p of props) {
        const va = a ? rgbToHex(a[p]) : '—';
        const vb = b ? rgbToHex(b[p]) : '—';
        const marker = va !== vb ? ' ◄' : '';
        entry += `  ${p}: ${labelA}="${va}" | ${labelB}="${vb}"${marker}\n`;
        if (va !== vb) hasDiff = true;
      }
      if (hasDiff) entry += '  ★ DIFFERENT\n';
      text += entry + '\n';
    }

    copyText(text).then(() => {
      const orig = typoCopy.textContent;
      typoCopy.textContent = 'Copied!';
      setTimeout(() => typoCopy.textContent = orig, 1500);
    });
  }

  // ===== Network Capture =====

  function togglePanelMinimize(panel, btn) {
    const isMin = panel.classList.toggle('minimized');
    btn.innerHTML = isMin ? '&#x25A1;' : '&#x2015;';
    btn.title = isMin ? 'Restore' : 'Minimize';
  }

  function setupPanelDrag(panel, handle, blockSelector = 'input, button, select, label') {
    if (!panel || !handle) return;

    let mouseDown = false;
    let dragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (blockSelector && e.target.closest(blockSelector)) return;
      mouseDown = true;
      dragging = false;

      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = rect.width + 'px';
      panel.style.transform = 'none';
      panel.style.margin = '0';

      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Only start dragging after actual mouse movement.
      if (!dragging && Math.abs(dx) + Math.abs(dy) < 3) return;
      if (!dragging) {
        dragging = true;
        panel.classList.add('dragging');
      }

      const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
      const nextLeft = Math.min(maxLeft, Math.max(0, startLeft + dx));
      const nextTop = Math.min(maxTop, Math.max(0, startTop + dy));
      panel.style.left = nextLeft + 'px';
      panel.style.top = nextTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      mouseDown = false;
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
    });

    window.addEventListener('blur', () => {
      mouseDown = false;
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
    });
  }

  function setupPanelResize(panel, handle) {
    if (!panel || !handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      resizing = true;
      panel.classList.add('dragging');

      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = rect.width + 'px';
      panel.style.height = rect.height + 'px';

      startX = e.clientX;
      startY = e.clientY;
      startW = rect.width;
      startH = rect.height;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!resizing) return;
      const nextW = Math.max(400, startW + (e.clientX - startX));
      const nextH = Math.max(200, startH + (e.clientY - startY));
      panel.style.width = nextW + 'px';
      panel.style.height = nextH + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!resizing) return;
      resizing = false;
      panel.classList.remove('dragging');
    });

    window.addEventListener('blur', () => {
      if (!resizing) return;
      resizing = false;
      panel.classList.remove('dragging');
    });
  }

  function updateRecordMockBadge() {
    if (recordMockActive && recordMockCount > 0) {
      recordMockBadge.textContent = String(recordMockCount);
      recordMockBadge.style.display = '';
    } else {
      recordMockBadge.style.display = 'none';
    }
  }

  function updateRecordMockLabel() {
    recordMockLabel.innerHTML = `Record ${recordMockSource} &rarr; Mock ${recordMockTarget}`;
  }

  function toggleNetwork() {
    networkActive = !networkActive;
    btnNetwork.classList.toggle('active', networkActive);

    if (networkActive) {
      netPanel.style.left = '12px';
      netPanel.style.right = 'auto';
      netPanel.style.bottom = '56px';
      netPanel.style.top = 'auto';
      netPanel.style.width = '';
      netPanel.style.height = '';
      netPanel.classList.remove('minimized');
      netMin.innerHTML = '&#x2015;';
      netMin.title = 'Minimize';
      netPanel.classList.add('visible');
      refreshNetworkOverrideKeys().then(() => renderNetworkPanel());
    } else {
      netPanel.classList.remove('visible', 'minimized');
    }
  }

  function handleNetworkEntryUpdate(entry) {
    const max = parseInt(netMax.value) || 1000;
    ensureNetworkEntrySequence(entry);
    networkEntries.push(entry);
    while (networkEntries.length > max) networkEntries.shift();
    if (networkActive) renderNetworkPanel();
    if (bulkTestActive) populateBulkApiList();
  }

  function getApiKey(entry) {
    let path;
    try {
      path = new URL(entry.url).pathname;
    } catch {
      path = entry.url.split('?')[0];
    }
    path = String(path || '/').replace(/\/{2,}/g, '/');
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    let key = entry.method + ' ' + path;
    if (entry.widgetName) key += ' [' + entry.widgetName + ']';
    return key;
  }

  function ensureNetworkEntrySequence(entry) {
    if (!entry || typeof entry !== 'object') return;
    if (!Number.isInteger(entry.captureSeq) || entry.captureSeq < 1) {
      entry.captureSeq = nextNetworkSeq++;
      return;
    }
    if (entry.captureSeq >= nextNetworkSeq) {
      nextNetworkSeq = entry.captureSeq + 1;
    }
  }

  function normalizeNetworkEntries(entries) {
    if (!Array.isArray(entries)) return;
    nextNetworkSeq = 1;
    for (const entry of entries) {
      ensureNetworkEntrySequence(entry);
    }
  }

  function formatCallSequence(entry) {
    if (!entry || !Number.isInteger(entry.captureSeq) || entry.captureSeq < 1) return '#?';
    return `#${entry.captureSeq}`;
  }

  function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 0) return 'just now';
    const sec = Math.floor(diff / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return sec + 's ago';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    const remainMin = min % 60;
    if (hr < 24) return remainMin > 0 ? hr + 'h ' + remainMin + 'm ago' : hr + 'h ago';
    const days = Math.floor(hr / 24);
    return days + 'd ago';
  }

  function formatCallTime(timestamp) {
    const time = new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
    const rel = formatRelativeTime(timestamp);
    return `${time} (${rel})`;
  }

  let lastGrouped = {};
  const netSelectedCalls = {};
  const netPendingCalls = {};

  function getSelectedIndices(key, g) {
    const fallback = { a: g.A.length - 1, b: g.B.length - 1 };
    const saved = netSelectedCalls[key];
    if (!saved) return fallback;
    return {
      a: Number.isInteger(saved.a) && saved.a >= 0 && saved.a < g.A.length ? saved.a : fallback.a,
      b: Number.isInteger(saved.b) && saved.b >= 0 && saved.b < g.B.length ? saved.b : fallback.b,
    };
  }

  function getPendingIndices(key, g) {
    const pending = netPendingCalls[key];
    if (!pending) return { a: null, b: null };
    return {
      a: Number.isInteger(pending.a) && pending.a >= 0 && pending.a < g.A.length ? pending.a : null,
      b: Number.isInteger(pending.b) && pending.b >= 0 && pending.b < g.B.length ? pending.b : null,
    };
  }

  let pendingOverrideContext = null;

  async function openOverrideModal(entry, key, side) {
    const isEditing = networkOverrideKeys.has(key);
    let bodyStr = '';
    let status = entry.responseStatus || 200;

    if (isEditing) {
      const existing = await sendMsg({ action: 'get-network-override', key });
      if (existing?.found) {
        bodyStr = existing.body || '';
        status = existing.status || 200;
      }
    }

    if (!bodyStr) {
      bodyStr = entry.responseBody;
      if (typeof bodyStr === 'object' && bodyStr !== null) bodyStr = JSON.stringify(bodyStr, null, 2);
    }

    try { bodyStr = JSON.stringify(JSON.parse(bodyStr), null, 2); } catch {}

    overrideModalInfo.textContent = `${entry.method} ${entry.url}`;
    overrideModalStatus.value = status;
    overrideModalEditor.value = bodyStr || '';
    overrideModalTitle.textContent = isEditing ? 'Edit Override Response' : 'Create Override Response';
    overrideModalSave.textContent = isEditing ? 'Update Override' : 'Save & Apply Override';
    pendingOverrideContext = { entry, key, side };
    overrideModalBackdrop.classList.add('visible');
    overrideModalEditor.focus();
  }

  function closeOverrideModal() {
    overrideModalBackdrop.classList.remove('visible');
    pendingOverrideContext = null;
  }

  async function saveOverrideFromModal() {
    if (!pendingOverrideContext) return;
    const { entry, key } = pendingOverrideContext;
    const bodyStr = overrideModalEditor.value;
    const status = parseInt(overrideModalStatus.value) || 200;
    const res = await sendMsg({
      action: 'set-network-override',
      method: entry.method,
      url: entry.url,
      widgetName: entry.widgetName || null,
      responseBody: bodyStr,
      responseStatus: status,
      contentType: 'application/json',
    });
    networkOverrideKeys.add(res?.key || key);
    closeOverrideModal();
    renderNetworkPanel();
  }

  async function refreshNetworkOverrideKeys() {
    try {
      const res = await sendMsg({ action: 'get-network-overrides' });
      networkOverrideKeys = new Set(res?.keys || []);
    } catch {
      networkOverrideKeys = new Set();
    }
  }

  function renderNetworkPanel() {
    normalizeNetworkEntries(networkEntries);

    const displayGroups = [];
    const activeGroupByApi = {};

    for (const e of networkEntries) {
      const apiKey = getApiKey(e);
      const label = e.label;
      if (label !== 'A' && label !== 'B') continue;

      const existingIdx = activeGroupByApi[apiKey];
      let group = existingIdx !== undefined ? displayGroups[existingIdx] : null;

      if (!group) {
        let pathPart = apiKey.slice(e.method.length + 1);
        const bracketIdx = pathPart.indexOf(' [');
        if (bracketIdx !== -1) pathPart = pathPart.slice(0, bracketIdx);
        group = {
          apiKey,
          displayKey: apiKey,
          method: e.method,
          path: pathPart,
          widgetName: null,
          A: [],
          B: [],
        };
        displayGroups.push(group);
        activeGroupByApi[apiKey] = displayGroups.length - 1;
      }

      if (e.widgetName) group.widgetName = e.widgetName;
      group[label].push(e);
    }

    lastGrouped = {};
    for (const g of displayGroups) {
      lastGrouped[g.displayKey] = g;
    }

    netEmpty.classList.toggle('hidden', displayGroups.length > 0);

    const existingDetails = {};
    netPanelBody.querySelectorAll('.net-group-detail.visible').forEach(d => {
      existingDetails[d.dataset.key] = true;
    });

    const netLabelA = getAliasLabel('A');
    const netLabelB = getAliasLabel('B');
    const netLabelAEsc = escHtml(netLabelA);
    const netLabelBEsc = escHtml(netLabelB);

    let html = '';
    for (const g of displayGroups) {
      const key = g.displayKey;
      const keyEsc = escHtml(key);
      const apiKeyEsc = escHtml(g.apiKey);
      const hasA = g.A.length > 0;
      const hasB = g.B.length > 0;
      const isMatch = hasA && hasB;
      const expanded = existingDetails[key] ? ' expanded' : '';
      const detailVis = existingDetails[key] ? ' visible' : '';
      const callCount = Math.max(g.A.length, g.B.length);

      let badges = '';
      if (isMatch) {
        badges = `<span class="net-badge net-badge-match">${netLabelAEsc}+${netLabelBEsc}</span>`;
      } else if (hasA) {
        badges = `<span class="net-badge net-badge-only">${netLabelAEsc} only</span>`;
      } else {
        badges = `<span class="net-badge net-badge-only">${netLabelBEsc} only</span>`;
      }
      const totalCalls = g.A.length + g.B.length;
      if (totalCalls > 1) {
        badges += `<span class="net-badge net-badge-count">${totalCalls} calls</span>`;
      }
      if (networkOverrideKeys.has(g.apiKey)) {
        badges += `<span class="net-badge net-badge-override">Overridden</span>`;
      }

      let latestTs = 0;
      for (const a of g.A) { if (a.timestamp > latestTs) latestTs = a.timestamp; }
      for (const b of g.B) { if (b.timestamp > latestTs) latestTs = b.timestamp; }
      const latestTimeHtml = latestTs > 0
        ? `<span class="net-group-latest" title="Latest call">${formatRelativeTime(latestTs)}</span>`
        : '';

      const sel = getSelectedIndices(key, g);
      const pending = getPendingIndices(key, g);
      const selA = g.A[sel.a] || null;
      const selB = g.B[sel.b] || null;
      const methodLower = g.method.toLowerCase();

      const widgetHtml = g.widgetName
        ? `<span class="net-group-widget" title="Widget: ${escHtml(g.widgetName)}">${escHtml(g.widgetName)}</span>`
        : '';

      html += `<div class="net-group">`;
      html += `<div class="net-group-header${expanded}" data-key="${keyEsc}">`;
      html += `<span class="net-group-method ${methodLower}">${escHtml(g.method)}</span>`;
      html += widgetHtml;
      html += `<span class="net-group-url" title="${escHtml(g.path)}">${escHtml(g.path)}</span>`;
      html += latestTimeHtml;
      html += `<div class="net-group-badges">${badges}</div>`;
      html += `<button class="net-copy-btn" data-key="${keyEsc}" title="Copy to clipboard">Copy</button>`;
      html += `</div>`;

      html += `<div class="net-group-detail${detailVis}" data-key="${keyEsc}">`;

      if (callCount > 1) {
        const markedBoth = pending.a !== null && pending.b !== null;
        const markedASeq = markedBoth ? formatCallSequence(g.A[pending.a]) : '';
        const markedBSeq = markedBoth ? formatCallSequence(g.B[pending.b]) : '';
        const compareHint = markedBoth
          ? `Marked: ${netLabelAEsc} ${markedASeq} vs ${netLabelBEsc} ${markedBSeq}`
          : `Mark one ${netLabelAEsc} row and one ${netLabelBEsc} row, then click Compare`;

        html += `<div class="net-call-history">`;
        html += `<div class="net-call-history-col">`;
        html += `<div class="net-call-history-title">${netLabelAEsc} calls</div>`;
        for (let i = 0; i < callCount; i++) {
          const e = g.A[i];
          if (!e) {
            html += `<div class="net-call-row net-call-row-empty"><span class="net-call-empty">\u2014</span></div>`;
            continue;
          }
          const selected = i === sel.a ? ' selected' : '';
          const marked = i === pending.a ? ' marked' : '';
          const time = formatCallTime(e.timestamp);
          html += `<div class="net-call-row${selected}${marked}" data-key="${keyEsc}" data-side="a" data-idx="${i}">`;
          html += `<span class="net-call-num">${formatCallSequence(e)}</span>`;
          html += `<span class="net-call-status status-${statusBucket(e.responseStatus)}">${responseStatusWithResult(e.responseStatus)}</span>`;
          html += `<span class="net-call-time">${time}</span>`;
          if (e.widgetName) html += `<span class="net-call-widget">${escHtml(e.widgetName)}</span>`;
          html += `</div>`;
        }
        html += `</div>`;
        html += `<div class="net-call-history-col">`;
        html += `<div class="net-call-history-title">${netLabelBEsc} calls</div>`;
        for (let i = 0; i < callCount; i++) {
          const e = g.B[i];
          if (!e) {
            html += `<div class="net-call-row net-call-row-empty"><span class="net-call-empty">\u2014</span></div>`;
            continue;
          }
          const selected = i === sel.b ? ' selected' : '';
          const marked = i === pending.b ? ' marked' : '';
          const time = formatCallTime(e.timestamp);
          html += `<div class="net-call-row${selected}${marked}" data-key="${keyEsc}" data-side="b" data-idx="${i}">`;
          html += `<span class="net-call-num">${formatCallSequence(e)}</span>`;
          html += `<span class="net-call-status status-${statusBucket(e.responseStatus)}">${responseStatusWithResult(e.responseStatus)}</span>`;
          html += `<span class="net-call-time">${time}</span>`;
          if (e.widgetName) html += `<span class="net-call-widget">${escHtml(e.widgetName)}</span>`;
          html += `</div>`;
        }
        html += `</div>`;
        html += `</div>`;
        html += `<div class="net-call-history-actions">`;
        html += `<span class="net-call-history-hint">${compareHint}</span>`;
        html += `<button class="net-compare-rows-btn${markedBoth ? '' : ' disabled'}" data-key="${keyEsc}" ${markedBoth ? '' : 'disabled'}>Compare</button>`;
        html += `<button class="net-copy-compare-btn" data-key="${keyEsc}" title="Copy both ${netLabelAEsc} and ${netLabelBEsc} request & response">Copy</button>`;
        html += `</div>`;
      }

      const reqObjA = toSortedObj(selA?.requestBody);
      const reqObjB = toSortedObj(selB?.requestBody);
      const resObjA = toSortedObj(selA?.responseBody);
      const resObjB = toSortedObj(selB?.responseBody);

      const isOverridden = networkOverrideKeys.has(g.apiKey);
      const removeBtnHtml = isOverridden
        ? `<button class="net-override-remove-btn" data-key="${keyEsc}" data-api-key="${apiKeyEsc}" title="Remove override">Remove</button>`
        : '';
      const overrideBtnA = selA
        ? `<button class="net-override-btn" data-key="${keyEsc}" data-side="a" title="${isOverridden ? 'Edit override response' : 'Override response for this API'}">${isOverridden ? 'Edit' : 'Override'}</button>${removeBtnHtml}`
        : '';
      const overrideBtnB = selB
        ? `<button class="net-override-btn" data-key="${keyEsc}" data-side="b" title="${isOverridden ? 'Edit override response' : 'Override response for this API'}">${isOverridden ? 'Edit' : 'Override'}</button>${!selA ? removeBtnHtml : ''}`
        : '';
      html += `<div class="net-compare-cols">`;
      html += `<div class="net-compare-col">`;
      html += `<div class="net-compare-heading net-compare-heading-a">${netLabelAEsc} ${selA ? '(' + formatCallSequence(selA) + ' \u2014 ' + responseStatusWithResult(selA.responseStatus) + ')' : '(none)'}</div>`;
      html += `<div class="net-compare-sub">Request</div>`;
      html += `<div class="net-json">${renderDiffJson(reqObjA, reqObjB, 'a')}</div>`;
      html += `<div class="net-compare-sub">Response ${overrideBtnA}</div>`;
      html += `<div class="net-json">${renderDiffJson(resObjA, resObjB, 'a')}</div>`;
      html += `</div>`;

      html += `<div class="net-compare-col">`;
      html += `<div class="net-compare-heading net-compare-heading-b">${netLabelBEsc} ${selB ? '(' + formatCallSequence(selB) + ' \u2014 ' + responseStatusWithResult(selB.responseStatus) + ')' : '(none)'}</div>`;
      html += `<div class="net-compare-sub">Request</div>`;
      html += `<div class="net-json">${renderDiffJson(reqObjB, reqObjA, 'b')}</div>`;
      html += `<div class="net-compare-sub">Response ${overrideBtnB}</div>`;
      html += `<div class="net-json">${renderDiffJson(resObjB, resObjA, 'b')}</div>`;
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
    }

    netPanelBody.querySelectorAll('.net-group').forEach(el => el.remove());
    if (displayGroups.length > 0) {
      netPanelBody.insertAdjacentHTML('beforeend', html);
      netPanelBody.querySelectorAll('.net-group-header').forEach(hdr => {
        hdr.addEventListener('click', (e) => {
          if (e.target.closest('.net-copy-btn')) return;
          hdr.classList.toggle('expanded');
          const detail = hdr.nextElementSibling;
          detail.classList.toggle('visible');
        });
      });
      netPanelBody.querySelectorAll('.net-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = btn.dataset.key;
          const g = lastGrouped[key];
          if (g) copyGroupToClipboard(key, g);
        });
      });
      netPanelBody.querySelectorAll('.net-call-row').forEach(row => {
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = row.dataset.key;
          const side = row.dataset.side;
          const idx = parseInt(row.dataset.idx, 10);
          if (!side || Number.isNaN(idx)) return;
          const prev = netPendingCalls[key] || { a: null, b: null };
          netPendingCalls[key] = { ...prev, [side]: idx };
          renderNetworkPanel();
        });
      });
      netPanelBody.querySelectorAll('.net-compare-rows-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = btn.dataset.key;
          const g = lastGrouped[key];
          if (!g) return;
          const pending = getPendingIndices(key, g);
          if (pending.a === null || pending.b === null) return;
          netSelectedCalls[key] = { a: pending.a, b: pending.b };
          delete netPendingCalls[key];
          renderNetworkPanel();
        });
      });
      netPanelBody.querySelectorAll('.net-copy-compare-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = btn.dataset.key;
          const g = lastGrouped[key];
          if (g) {
            copyGroupToClipboard(key, g);
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
          }
        });
      });
      netPanelBody.querySelectorAll('.net-override-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = btn.dataset.key;
          const side = btn.dataset.side;
          const g = lastGrouped[key];
          if (!g) return;
          const sel = getSelectedIndices(key, g);
          const entry = side === 'a' ? g.A[sel.a] : g.B[sel.b];
          if (!entry) return;
          openOverrideModal(entry, g.apiKey, side);
        });
      });
      netPanelBody.querySelectorAll('.net-override-remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const apiKey = btn.dataset.apiKey;
          await sendMsg({ action: 'remove-network-override', key: apiKey });
          networkOverrideKeys.delete(apiKey);
          renderNetworkPanel();
        });
      });
    }
  }

  // ===== Bulk Test Panel =====

  let bulkTestHasOpened = false;

  function toggleBulkTest() {
    bulkTestActive = !bulkTestActive;
    btnBulkTest.classList.toggle('active', bulkTestActive);

    if (bulkTestActive) {
      if (!bulkTestHasOpened) {
        bulkTestPanel.style.left = '12px';
        bulkTestPanel.style.right = 'auto';
        bulkTestPanel.style.top = '60px';
        bulkTestPanel.style.bottom = 'auto';
        bulkTestPanel.style.width = '1000px';
        bulkTestPanel.style.height = 'calc(100vh - 120px)';
        bulkTestHasOpened = true;
      }
      bulkTestPanel.classList.remove('minimized');
      bulkTestMin.innerHTML = '&#x2015;';
      bulkTestMin.title = 'Minimize';
      bulkTestPanel.classList.add('visible');
      bulkTabA.textContent = aliasAInput.value.trim() || 'A';
      bulkTabB.textContent = aliasBInput.value.trim() || 'B';
      switchBulkTab(bulkTestFrame);
    } else {
      bulkTestPanel.classList.remove('visible', 'minimized');
      stopBulkTests();
    }
  }

  function switchBulkTab(frame) {
    bulkTestFrame = frame;
    bulkTabA.classList.toggle('active', frame === 'A');
    bulkTabB.classList.toggle('active', frame === 'B');
    bulkPayloadPreview.style.display = 'none';
    bulkPreviewEntry = null;
    populateBulkApiList();
  }

  function populateBulkApiList() {
    const entries = networkEntries.filter(e => e.label === bulkTestFrame);
    if (entries.length === 0) {
      bulkHint.style.display = '';
      bulkApiList.innerHTML = '';
      updateBulkCaseCount();
      return;
    }
    bulkHint.style.display = 'none';

    const grouped = {};
    for (const e of entries) {
      const key = getApiKey(e);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }

    let html = '';
    for (const [key, calls] of Object.entries(grouped)) {
      const latest = calls[calls.length - 1];
      const method = latest.method || 'GET';
      const methodLower = method.toLowerCase();
      let path;
      try { path = new URL(latest.url).pathname; } catch { path = latest.url.split('?')[0]; }
      const widget = latest.widgetName || '';
      const status = latest.responseStatus || '';
      const statusCls = status >= 200 && status < 300 ? 'bulk-result-ok' : status >= 400 ? 'bulk-result-blocked' : '';

      html += `<label class="bulk-api-row">`;
      html += `<input type="checkbox" class="bulk-api-cb" data-key="${escHtml(key)}">`;
      html += `<span class="bulk-api-method bulk-api-method-${methodLower}">${escHtml(method)}</span>`;
      html += `<span class="bulk-api-path" title="${escHtml(latest.url)}">${escHtml(path)}</span>`;
      if (widget) html += `<span class="bulk-api-widget" title="${escHtml(widget)}">${escHtml(widget)}</span>`;
      html += `<span class="bulk-api-status ${statusCls}">${status || ''}</span>`;
      html += `<span class="bulk-api-count">${calls.length}x</span>`;
      html += `</label>`;
    }
    bulkApiList.innerHTML = html;
    updateBulkCaseCount();
  }

  function handleBulkApiRowClick(e) {
    if (e.target.tagName === 'INPUT') return;
    const row = e.target.closest('.bulk-api-row');
    if (!row) return;
    const key = row.querySelector('.bulk-api-cb')?.dataset.key;
    if (!key) return;

    bulkApiList.querySelectorAll('.bulk-api-row').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');

    const entries = networkEntries.filter(en => en.label === bulkTestFrame);
    const grouped = {};
    for (const en of entries) {
      const k = getApiKey(en);
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(en);
    }
    const calls = grouped[key];
    if (!calls || calls.length === 0) return;
    const latest = calls[calls.length - 1];
    bulkPreviewEntry = latest;

    let bodyStr = '';
    if (latest.requestBody) {
      try {
        const parsed = typeof latest.requestBody === 'string' ? JSON.parse(latest.requestBody) : latest.requestBody;
        bodyStr = JSON.stringify(parsed, null, 2);
      } catch {
        bodyStr = String(latest.requestBody);
      }
    }

    let path;
    try { path = new URL(latest.url).pathname; } catch { path = latest.url.split('?')[0]; }
    bulkPayloadTitle.textContent = `${latest.method} ${path}`;
    bulkPayloadBody.value = bodyStr || '(no request body)';
    bulkPayloadPreview.style.display = 'flex';
  }

  function clearBulkPanel() {
    networkEntries = networkEntries.filter(e => e.label !== bulkTestFrame);
    bulkResults.style.display = 'none';
    bulkResultsBody.innerHTML = '';
    bulkSummary.innerHTML = '';
    bulkProgress.style.display = 'none';
    bulkPayloadPreview.style.display = 'none';
    bulkPreviewEntry = null;
    populateBulkApiList();
  }

  async function runSingleFromPreview() {
    if (!bulkPreviewEntry) { alert('No API selected.'); return; }
    const entry = bulkPreviewEntry;
    const bodyText = bulkPayloadBody.value.trim();

    let bodyStr = null;
    if (bodyText && bodyText !== '(no request body)') {
      try { JSON.parse(bodyText); bodyStr = bodyText; } catch {
        alert('Payload is not valid JSON.');
        return;
      }
    }

    bulkPayloadRun.disabled = true;
    bulkPayloadRun.textContent = '...';

    let result;
    try {
      result = await sendMsg({
        action: 'run-bulk-api-test',
        frameLabel: bulkTestFrame,
        method: entry.method,
        url: entry.url,
        body: bodyStr,
        headers: entry.requestHeaders || {},
      });
    } catch (err) {
      result = { error: err.message, status: 0, responseBody: '' };
    }

    bulkPayloadRun.disabled = false;
    bulkPayloadRun.textContent = 'Run';

    const status = result.status || 0;
    const resBody = result.responseBody || '';
    const duration = result.duration || 0;
    const error = result.error || '';

    bulkResults.style.display = '';
    const statusClass = error ? 'bulk-result-error' : (status >= 200 && status < 300) ? 'bulk-result-ok' : 'bulk-result-blocked';
    const resultLabel = error ? 'Error' : (status >= 200 && status < 300) ? 'Passed' : 'Blocked';

    let apiPath;
    try { apiPath = new URL(entry.url).pathname; } catch { apiPath = entry.url.split('?')[0]; }

    const detailId = `bulk-preview-detail-${Date.now()}`;
    let rowHtml = `<tr>`;
    rowHtml += `<td>\u25CF</td>`;
    rowHtml += `<td title="${escHtml(entry.url)}">${escHtml(entry.method)} ${escHtml(apiPath)}</td>`;
    rowHtml += `<td>\u2014</td><td>\u2014</td><td>\u2014</td>`;
    rowHtml += `<td class="${statusClass}">${status || '\u2014'}</td>`;
    rowHtml += `<td class="${statusClass}">${resultLabel}</td>`;
    rowHtml += `<td><button class="bulk-detail-toggle" data-row="${detailId}">\u25B6</button></td>`;
    rowHtml += `</tr>`;

    const reqDisplay = bodyStr ? bodyStr.substring(0, 3000) : '(no body)';
    const resDisplay = typeof resBody === 'string' ? resBody.substring(0, 3000) : JSON.stringify(resBody).substring(0, 3000);

    rowHtml += `<tr class="bulk-detail-row" id="${detailId}" style="display:none"><td colspan="8">`;
    rowHtml += `<div class="bulk-detail-body">`;
    rowHtml += `<div class="bulk-detail-section"><div class="bulk-detail-heading">Request (${escHtml(entry.method)} ${escHtml(entry.url)})</div>${escHtml(reqDisplay)}</div>`;
    rowHtml += `<div class="bulk-detail-section"><div class="bulk-detail-heading">Response (${status} \u2014 ${duration}ms${error ? ' \u2014 ' + escHtml(error) : ''})</div>${escHtml(resDisplay)}</div>`;
    rowHtml += `</div></td></tr>`;

    bulkResultsBody.insertAdjacentHTML('beforeend', rowHtml);

    const toggleBtn = bulkResultsBody.querySelector(`[data-row="${detailId}"]`);
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const detailRow = document.getElementById(detailId);
        if (detailRow) {
          const open = detailRow.style.display !== 'none';
          detailRow.style.display = open ? 'none' : '';
          toggleBtn.textContent = open ? '\u25B6' : '\u25BC';
        }
      });
    }
  }

  function toggleBulkSelectAll() {
    const cbs = bulkApiList.querySelectorAll('.bulk-api-cb');
    const allChecked = [...cbs].every(cb => cb.checked);
    cbs.forEach(cb => cb.checked = !allChecked);
    bulkSelectAll.textContent = allChecked ? 'Select All' : 'Deselect All';
    updateBulkCaseCount();
  }

  function getSelectedBulkApis() {
    const cbs = bulkApiList.querySelectorAll('.bulk-api-cb:checked');
    const selectedKeys = new Set([...cbs].map(cb => cb.dataset.key));
    const entries = networkEntries.filter(e => e.label === bulkTestFrame);
    const grouped = {};
    for (const e of entries) {
      const key = getApiKey(e);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }
    const result = [];
    for (const key of selectedKeys) {
      if (grouped[key] && grouped[key].length > 0) {
        result.push({ key, entry: grouped[key][grouped[key].length - 1] });
      }
    }
    return result;
  }

  function parseValueList(text) {
    return text.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  function parseUniqueValues(text) {
    return [...new Set(parseValueList(text))];
  }

  function buildCartesianCases(ptnMdns, subscribers, bans) {
    const dims = [];
    if (ptnMdns.length > 0) dims.push({ key: 'ptnMdn', vals: ptnMdns });
    if (subscribers.length > 0) dims.push({ key: 'subscriber', vals: subscribers });
    if (bans.length > 0) dims.push({ key: 'ban', vals: bans });
    if (dims.length === 0) return [{ ptnMdn: null, subscriber: null, ban: null }];
    let combos = [{}];
    for (const dim of dims) {
      const next = [];
      for (const combo of combos) {
        for (const v of dim.vals) {
          next.push({ ...combo, [dim.key]: v });
        }
      }
      combos = next;
    }
    return combos.map(c => ({
      ptnMdn: c.ptnMdn || null,
      subscriber: c.subscriber || null,
      ban: c.ban || null,
    }));
  }

  const PTN_MDN_KEYS = ['ptn', 'mdn', 'msisdn', 'phonenumber', 'phone_number', 'phoneNumber', 'mobile'];
  const SUBSCRIBER_KEYS = ['subscriber', 'subscriberId', 'subscriber_id', 'subscriberNo', 'subscriber_no'];
  const BAN_KEYS = ['ban', 'billingAccountNumber', 'billing_account_number', 'billingAccount', 'billing_account', 'accountNumber', 'account_number', 'accountId', 'account_id', 'customerId', 'customer_id', 'customerNo', 'customer_no', 'customerid'];

  const TYPE_VALUE_MDN = ['mdn', 'ptn', 'msisdn', 'mobile', 'phone'];
  const TYPE_VALUE_SUB = ['sub', 'subscriber'];
  const TYPE_VALUE_BAN = ['acnt', 'account', 'ban', 'billing'];

  function resolveTypeValueReplacement(typeStr, ptnMdnVal, subscriberVal, banVal) {
    const t = (typeStr || '').toLowerCase().trim();
    if (ptnMdnVal !== null && TYPE_VALUE_MDN.some(m => t === m || t.includes(m))) return ptnMdnVal;
    if (subscriberVal !== null && TYPE_VALUE_SUB.some(s => t === s || t.includes(s))) return subscriberVal;
    if (banVal !== null && TYPE_VALUE_BAN.some(b => t === b || t.includes(b))) return banVal;
    return null;
  }

  function replaceFieldsDeep(obj, ptnMdnVal, subscriberVal, banVal) {
    if (Array.isArray(obj)) return obj.map(item => replaceFieldsDeep(item, ptnMdnVal, subscriberVal, banVal));
    if (obj !== null && typeof obj === 'object') {
      if (typeof obj.type === 'string' && 'value' in obj) {
        const replacement = resolveTypeValueReplacement(obj.type, ptnMdnVal, subscriberVal, banVal);
        if (replacement !== null) {
          const result = {};
          for (const [k, v] of Object.entries(obj)) {
            result[k] = k === 'value' ? replacement : v;
          }
          return result;
        }
      }

      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        const kLower = k.toLowerCase();
        if (ptnMdnVal !== null && PTN_MDN_KEYS.some(pk => pk.toLowerCase() === kLower)) {
          result[k] = ptnMdnVal;
        } else if (subscriberVal !== null && SUBSCRIBER_KEYS.some(sk => sk.toLowerCase() === kLower)) {
          result[k] = subscriberVal;
        } else if (banVal !== null && BAN_KEYS.some(bk => bk.toLowerCase() === kLower)) {
          result[k] = banVal;
        } else {
          result[k] = replaceFieldsDeep(v, ptnMdnVal, subscriberVal, banVal);
        }
      }
      return result;
    }
    return obj;
  }

  function updateBulkCaseCount() {
    const ptns = parseUniqueValues(bulkPtnMdn.value);
    const subs = parseUniqueValues(bulkSubscribers.value);
    const bans = parseUniqueValues(bulkBans.value);
    const cases = buildCartesianCases(ptns, subs, bans);
    const apis = getSelectedBulkApis();
    const total = apis.length * cases.length;
    if (apis.length === 0) {
      bulkCaseCount.textContent = 'Select APIs to test';
    } else if (cases.length <= 1 && ptns.length === 0 && subs.length === 0 && bans.length === 0) {
      bulkCaseCount.textContent = `${apis.length} API${apis.length !== 1 ? 's' : ''} \u2014 single run each (no substitution)`;
    } else {
      bulkCaseCount.textContent = `${apis.length} API${apis.length !== 1 ? 's' : ''} \u00d7 ${cases.length} cases = ${total} total requests`;
    }
  }

  function classifyBulkResult(status, responseBody, keywords) {
    const statusBlocked = !(status >= 200 && status < 300);
    let keywordBlocked = false;
    if (keywords.length > 0 && responseBody) {
      const bodyLower = (typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)).toLowerCase();
      keywordBlocked = keywords.some(kw => bodyLower.includes(kw.toLowerCase()));
    }
    if (statusBlocked || keywordBlocked) {
      const reasons = [];
      if (statusBlocked) reasons.push(`status ${status}`);
      if (keywordBlocked) reasons.push('keyword match');
      return { blocked: true, reason: reasons.join(' + ') };
    }
    return { blocked: false, reason: '' };
  }

  function stopBulkTests() {
    if (bulkTestAbortController) {
      bulkTestAbortController.abort();
      bulkTestAbortController = null;
    }
    bulkRunBtn.style.display = '';
    bulkStopBtn.style.display = 'none';
    bulkRunBtn.disabled = false;
  }

  async function runBulkTests() {
    const apis = getSelectedBulkApis();
    if (apis.length === 0) { alert('Select at least one API to test.'); return; }

    const ptnMdns = parseUniqueValues(bulkPtnMdn.value);
    const subscribers = parseUniqueValues(bulkSubscribers.value);
    const bans = parseUniqueValues(bulkBans.value);
    const keywords = parseValueList(bulkKeywords.value);
    const cases = buildCartesianCases(ptnMdns, subscribers, bans);
    const totalRuns = apis.length * cases.length;

    bulkRunBtn.style.display = 'none';
    bulkStopBtn.style.display = '';
    bulkRunBtn.disabled = true;
    bulkResults.style.display = '';
    bulkProgress.style.display = 'flex';
    bulkResultsBody.innerHTML = '';
    bulkSummary.innerHTML = '';
    bulkProgressFill.style.width = '0%';
    bulkProgressText.textContent = `0 / ${totalRuns}`;

    bulkTestAbortController = new AbortController();
    const signal = bulkTestAbortController.signal;

    let okCount = 0, blockedCount = 0, errorCount = 0;
    let runIdx = 0;

    for (const api of apis) {
      if (signal.aborted) break;
      const entry = api.entry;
      const requestHeaders = entry.requestHeaders || {};

      let basePayload = null;
      if (entry.requestBody) {
        try {
          basePayload = typeof entry.requestBody === 'string' ? JSON.parse(entry.requestBody) : entry.requestBody;
        } catch { basePayload = null; }
      }

      for (const c of cases) {
        if (signal.aborted) break;
        runIdx++;

        let body = basePayload;
        if (body !== null && (c.ptnMdn !== null || c.subscriber !== null || c.ban !== null)) {
          body = replaceFieldsDeep(JSON.parse(JSON.stringify(body)), c.ptnMdn, c.subscriber, c.ban);
        }
        const bodyStr = body !== null ? JSON.stringify(body) : null;

        let result;
        try {
          result = await sendMsg({
            action: 'run-bulk-api-test',
            frameLabel: bulkTestFrame,
            method: entry.method,
            url: entry.url,
            body: bodyStr,
            headers: requestHeaders,
          });
        } catch (err) {
          result = { error: err.message, status: 0, responseBody: '' };
        }

        if (signal.aborted) break;

        const status = result.status || 0;
        const resBody = result.responseBody || '';
        const duration = result.duration || 0;
        const error = result.error || '';

        let classification;
        if (error) {
          classification = { blocked: false, reason: error };
          errorCount++;
        } else {
          classification = classifyBulkResult(status, resBody, keywords);
          if (classification.blocked) blockedCount++; else okCount++;
        }

        const statusClass = error ? 'bulk-result-error' : classification.blocked ? 'bulk-result-blocked' : 'bulk-result-ok';
        const resultLabel = error ? 'Error' : classification.blocked ? 'Blocked' : 'Passed';

        let apiPath;
        try { apiPath = new URL(entry.url).pathname; } catch { apiPath = entry.url.split('?')[0]; }

        const detailId = `bulk-detail-${runIdx}`;
        let rowHtml = `<tr>`;
        rowHtml += `<td>${runIdx}</td>`;
        rowHtml += `<td title="${escHtml(entry.url)}">${escHtml(entry.method)} ${escHtml(apiPath)}</td>`;
        rowHtml += `<td>${escHtml(c.ptnMdn || '\u2014')}</td>`;
        rowHtml += `<td>${escHtml(c.subscriber || '\u2014')}</td>`;
        rowHtml += `<td>${escHtml(c.ban || '\u2014')}</td>`;
        rowHtml += `<td class="${statusClass}">${status || '\u2014'}</td>`;
        rowHtml += `<td class="${statusClass}">${resultLabel}</td>`;
        rowHtml += `<td><button class="bulk-detail-toggle" data-row="${detailId}">\u25B6</button></td>`;
        rowHtml += `</tr>`;

        const reqDisplay = bodyStr ? bodyStr.substring(0, 3000) : '(no body)';
        const resDisplay = typeof resBody === 'string' ? resBody.substring(0, 3000) : JSON.stringify(resBody).substring(0, 3000);

        rowHtml += `<tr class="bulk-detail-row" id="${detailId}" style="display:none"><td colspan="8">`;
        rowHtml += `<div class="bulk-detail-body">`;
        rowHtml += `<div class="bulk-detail-section"><div class="bulk-detail-heading">Request (${escHtml(entry.method)} ${escHtml(entry.url)})</div>${escHtml(reqDisplay)}</div>`;
        rowHtml += `<div class="bulk-detail-section"><div class="bulk-detail-heading">Response (${status} \u2014 ${duration}ms${classification.reason ? ' \u2014 ' + escHtml(classification.reason) : ''})</div>${escHtml(resDisplay)}</div>`;
        rowHtml += `</div></td></tr>`;

        bulkResultsBody.insertAdjacentHTML('beforeend', rowHtml);

        const toggleBtn = bulkResultsBody.querySelector(`[data-row="${detailId}"]`);
        if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
            const detailRow = document.getElementById(detailId);
            if (detailRow) {
              const open = detailRow.style.display !== 'none';
              detailRow.style.display = open ? 'none' : '';
              toggleBtn.textContent = open ? '\u25B6' : '\u25BC';
            }
          });
        }

        const pct = Math.round((runIdx / totalRuns) * 100);
        bulkProgressFill.style.width = pct + '%';
        bulkProgressText.textContent = `${runIdx} / ${totalRuns}`;

        bulkSummary.innerHTML =
          `<span class="bulk-summary-ok">Passed: ${okCount}</span>` +
          `<span class="bulk-summary-blocked">Blocked: ${blockedCount}</span>` +
          `<span class="bulk-summary-error">Errors: ${errorCount}</span>`;
      }
    }

    stopBulkTests();
  }

  function statusBucket(status) {
    if (!status) return '0';
    if (status >= 200 && status < 300) return '2xx';
    if (status >= 300 && status < 400) return '3xx';
    if (status >= 400 && status < 500) return '4xx';
    return '5xx';
  }

  function isSuccessfulStatus(status) {
    const code = Number(status);
    if (!Number.isFinite(code)) return false;
    return code >= 200 && code < 300;
  }

  function responseStatusWithResult(status) {
    if (status === null || status === undefined || status === '') return '\u2014';
    return `${status} (${isSuccessfulStatus(status) ? 'Success' : 'Failed'})`;
  }

  function sortKeysDeep(obj) {
    if (Array.isArray(obj)) return obj.map(sortKeysDeep);
    if (obj !== null && typeof obj === 'object') {
      const sorted = {};
      for (const key of Object.keys(obj).sort()) {
        sorted[key] = sortKeysDeep(obj[key]);
      }
      return sorted;
    }
    return obj;
  }

  const SENTINEL = Symbol('none');

  function toSortedObj(raw) {
    if (raw === null || raw === undefined) return SENTINEL;
    let parsed;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return raw;
    }
    return sortKeysDeep(parsed);
  }

  function toSortedText(raw) {
    const obj = toSortedObj(raw);
    if (obj === SENTINEL) return null;
    if (typeof obj === 'string') return obj;
    return JSON.stringify(obj, null, 2);
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }

  function renderDiffJson(thisObj, otherObj, side) {
    if (thisObj === SENTINEL) return '<span class="jl">No payload</span>';
    if (typeof thisObj === 'string') return escHtml(thisObj);
    if (otherObj === SENTINEL) {
      return renderJsonValue(thisObj, '', false, null);
    }
    return renderJsonValue(thisObj, '', false, otherObj);
  }

  function renderJsonValue(val, indent, isDiff, otherVal) {
    if (val === null) return isDiff ? wrapDiff('null', 'jl') : '<span class="jl">null</span>';
    if (typeof val === 'boolean') return isDiff ? wrapDiff(String(val), 'jb') : `<span class="jb">${val}</span>`;
    if (typeof val === 'number') return isDiff ? wrapDiff(String(val), 'jn') : `<span class="jn">${val}</span>`;
    if (typeof val === 'string') {
      const escaped = escHtml(JSON.stringify(val));
      return isDiff ? wrapDiff(escaped, 'js') : `<span class="js">${escaped}</span>`;
    }
    if (Array.isArray(val)) return renderArray(val, indent, otherVal);
    if (typeof val === 'object') return renderObject(val, indent, otherVal);
    return escHtml(String(val));
  }

  function wrapDiff(content, cls) {
    return `<span class="${cls} diff-prop">${content}</span>`;
  }

  function renderObject(obj, indent, otherObj) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '<span class="jc">{}</span>';
    const inner = indent + '  ';
    let out = '<span class="jc">{</span>\n';
    const hasOther = otherObj !== null && typeof otherObj === 'object' && !Array.isArray(otherObj);
    keys.forEach((k, i) => {
      const comma = i < keys.length - 1 ? ',' : '';
      const keyHtml = `<span class="jk">${escHtml(JSON.stringify(k))}</span>`;
      const otherHasKey = hasOther && Object.prototype.hasOwnProperty.call(otherObj, k);
      const keyMissing = hasOther && !otherHasKey;
      const childOther = otherHasKey ? otherObj[k] : null;
      const propDiff = keyMissing || (otherHasKey && !deepEqual(obj[k], otherObj[k]));

      if (keyMissing) {
        const valHtml = renderJsonValue(obj[k], inner, false, null);
        out += `<span class="diff-line">${inner}${keyHtml}: ${valHtml}${comma}</span>\n`;
      } else if (propDiff && isLeaf(obj[k])) {
        const valHtml = renderJsonValue(obj[k], inner, true, childOther);
        out += `${inner}${keyHtml}: ${valHtml}${comma}\n`;
      } else {
        const valHtml = renderJsonValue(obj[k], inner, false, propDiff ? childOther : null);
        out += `${inner}${keyHtml}: ${valHtml}${comma}\n`;
      }
    });
    out += indent + '<span class="jc">}</span>';
    return out;
  }

  function renderArray(arr, indent, otherArr) {
    if (arr.length === 0) return '<span class="jc">[]</span>';
    const inner = indent + '  ';
    const hasOther = Array.isArray(otherArr);
    let out = '<span class="jc">[</span>\n';
    arr.forEach((item, i) => {
      const comma = i < arr.length - 1 ? ',' : '';
      if (!hasOther) {
        const valHtml = renderJsonValue(item, inner, false, null);
        out += `${inner}${valHtml}${comma}\n`;
        return;
      }
      const otherItem = i < otherArr.length ? otherArr[i] : SENTINEL;
      const itemDiff = otherItem === SENTINEL || !deepEqual(item, otherItem);
      const childOther = otherItem !== SENTINEL ? otherItem : null;

      if (otherItem === SENTINEL) {
        const valHtml = renderJsonValue(item, inner, false, null);
        out += `<span class="diff-line">${inner}${valHtml}${comma}</span>\n`;
      } else if (itemDiff && isLeaf(item)) {
        const valHtml = renderJsonValue(item, inner, true, childOther);
        out += `${inner}${valHtml}${comma}\n`;
      } else {
        const valHtml = renderJsonValue(item, inner, false, itemDiff ? childOther : null);
        out += `${inner}${valHtml}${comma}\n`;
      }
    });
    out += indent + '<span class="jc">]</span>';
    return out;
  }

  function isLeaf(val) {
    return val === null || typeof val !== 'object';
  }

  function copyGroupToClipboard(key, g) {
    const sel = getSelectedIndices(key, g);
    const selA = g.A[sel.a] || null;
    const selB = g.B[sel.b] || null;
    const netLabelA = getAliasLabel('A');
    const netLabelB = getAliasLabel('B');
    let text = `API: ${g.apiKey || key}\n`;
    text += '='.repeat(60) + '\n\n';

    text += `--- ${netLabelA} (call ${formatCallSequence(selA)}) ---\n`;
    if (selA) {
      text += `Status: ${responseStatusWithResult(selA.responseStatus)}\n\n`;
      text += 'REQUEST:\n';
      text += (toSortedText(selA.requestBody) || 'No payload') + '\n\n';
      text += 'RESPONSE:\n';
      text += (toSortedText(selA.responseBody) || 'No payload') + '\n';
    } else {
      text += 'No request captured\n';
    }

    text += `\n--- ${netLabelB} (call ${formatCallSequence(selB)}) ---\n`;
    if (selB) {
      text += `Status: ${responseStatusWithResult(selB.responseStatus)}\n\n`;
      text += 'REQUEST:\n';
      text += (toSortedText(selB.requestBody) || 'No payload') + '\n\n';
      text += 'RESPONSE:\n';
      text += (toSortedText(selB.responseBody) || 'No payload') + '\n';
    } else {
      text += 'No request captured\n';
    }

    copyText(text).then(() => {
      const btns = netPanelBody.querySelectorAll(`.net-copy-btn[data-key="${CSS.escape(key)}"]`);
      btns.forEach(b => {
        b.textContent = 'Copied!';
        setTimeout(() => { b.textContent = 'Copy'; }, 1500);
      });
    });
  }
})();
