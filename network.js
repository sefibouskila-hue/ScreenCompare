document.addEventListener('DOMContentLoaded', async () => {
  const btnClear = document.getElementById('btnClear');
  const btnCloseDetail = document.getElementById('btnCloseDetail');
  const requestListEl = document.getElementById('requestList');
  const emptyState = document.getElementById('emptyState');
  const detailPanel = document.getElementById('detailPanel');
  const detailTitle = document.getElementById('detailTitle');
  const requestPayloadEl = document.getElementById('requestPayload');
  const responsePayloadEl = document.getElementById('responsePayload');
  const statusBadge = document.getElementById('statusBadge');
  const entryCount = document.getElementById('entryCount');
  const filterInput = document.getElementById('filterInput');

  let entries = [];
  let selectedId = null;
  let filterText = '';

  const settingsResult = await sendMessage({ action: 'get-network-settings' });
  const settings = settingsResult?.settings || {};

  const stored = await sendMessage({ action: 'get-network-entries' });
  if (stored?.entries?.length) {
    entries = stored.entries;
    renderList();
  }

  // Listen for live entries from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'network-entry-update') {
      entries.push(message.entry);
      const max = settings?.maxEntries || 100;
      while (entries.length > max) entries.shift();
      renderList();
      updateStatusBadge(true);
    }
  });

  btnClear.addEventListener('click', async () => {
    await sendMessage({ action: 'clear-network-entries' });
    entries = [];
    selectedId = null;
    renderList();
    detailPanel.classList.add('hidden');
  });

  btnCloseDetail.addEventListener('click', () => {
    detailPanel.classList.add('hidden');
    selectedId = null;
    document.querySelectorAll('.request-row.selected').forEach(r => r.classList.remove('selected'));
  });

  filterInput.addEventListener('input', () => {
    filterText = filterInput.value.toLowerCase();
    renderList();
  });

  function updateStatusBadge(monitoring) {
    if (monitoring) {
      statusBadge.textContent = 'Recording';
      statusBadge.className = 'status-badge recording';
    } else {
      statusBadge.textContent = 'Stopped';
      statusBadge.className = 'status-badge stopped';
    }
  }

  function renderList() {
    requestListEl.innerHTML = '';
    const filtered = filterText
      ? entries.filter(e => e.url.toLowerCase().includes(filterText) || (e.method || '').toLowerCase().includes(filterText) || (e.widgetName || '').toLowerCase().includes(filterText))
      : entries;
    emptyState.classList.toggle('hidden', filtered.length > 0);
    const countLabel = filterText && filtered.length !== entries.length
      ? `${filtered.length}/${entries.length} requests`
      : entries.length > 0 ? `${entries.length} request${entries.length > 1 ? 's' : ''}` : '';
    entryCount.textContent = countLabel;

    for (const entry of filtered) {
      const row = document.createElement('div');
      row.className = 'request-row' + (entry.id === selectedId ? ' selected' : '');
      row.dataset.id = entry.id;

      const methodClass = 'method-' + (entry.method || 'get').toLowerCase();
      const statusClass = statusColorClass(entry.responseStatus);
      const shortUrl = shortenUrl(entry.url);
      const time = formatTime(entry.timestamp);

      row.innerHTML =
        `<span class="col-method ${methodClass}">${esc(entry.method)}</span>` +
        `<span class="col-widget" title="${esc(entry.widgetName || '')}">${esc(entry.widgetName || '')}</span>` +
        `<span class="col-url" title="${esc(entry.url)}">${esc(shortUrl)}</span>` +
        `<span class="col-status ${statusClass}">${entry.responseStatus || '\u2014'}</span>` +
        `<span class="col-time">${time}</span>`;

      row.addEventListener('click', () => selectEntry(entry, row));
      requestListEl.appendChild(row);
    }

    requestListEl.scrollTop = requestListEl.scrollHeight;
  }

  function selectEntry(entry, rowEl) {
    selectedId = entry.id;
    document.querySelectorAll('.request-row.selected').forEach(r => r.classList.remove('selected'));
    rowEl.classList.add('selected');

    detailTitle.textContent = `${entry.method} ${entry.url}`;
    requestPayloadEl.innerHTML = formatPayload(entry.requestBody);
    responsePayloadEl.innerHTML = formatPayload(entry.responseBody);
    detailPanel.classList.remove('hidden');
  }

  // ===== JSON formatting with alphabetical key sorting =====

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

  function formatPayload(raw) {
    if (raw === null || raw === undefined) {
      return '<span class="json-null">No payload</span>';
    }

    let parsed;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return esc(raw);
    }

    const sorted = sortKeysDeep(parsed);
    return syntaxHighlight(sorted);
  }

  function syntaxHighlight(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(
      /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")\s*:/g,
      '<span class="json-key">$1</span>:'
    ).replace(
      /:\s*("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")/g,
      ': <span class="json-string">$1</span>'
    ).replace(
      /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
      ': <span class="json-number">$1</span>'
    ).replace(
      /:\s*(true|false)/g,
      ': <span class="json-bool">$1</span>'
    ).replace(
      /:\s*(null)/g,
      ': <span class="json-null">$1</span>'
    ).replace(
      /[{}[\]]/g,
      '<span class="json-brace">$&</span>'
    );
  }

  // ===== Utilities =====

  function statusColorClass(status) {
    if (!status) return 'status-0';
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    return 'status-5xx';
  }

  function shortenUrl(url) {
    try {
      const u = new URL(url);
      return u.pathname + u.search;
    } catch {
      return url;
    }
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-GB', { hour12: false });
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function sendMessage(msg) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(msg, response => resolve(response));
    });
  }
});
