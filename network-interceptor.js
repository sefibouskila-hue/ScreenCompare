(() => {
  // Detect if patches are still intact (handles HMR replacing window.fetch)
  if (window.__dupscreen_network_patched) {
    window.__dupscreen_network_active = true;
    const fetchOk = window.fetch === window.__dupscreen_patched_fetch;
    const xhrOk = XMLHttpRequest.prototype.send === window.__dupscreen_patched_xhr_send;
    if (fetchOk && xhrOk) return;
    // Patches were lost (HMR / dev server replaced globals) — re-apply below
  }
  window.__dupscreen_network_patched = true;
  window.__dupscreen_network_active = true;

  if (!window.__dupscreen_network_overrides) {
    window.__dupscreen_network_overrides = {};
  }
  if (!window.__dupscreen_recorded_responses) {
    window.__dupscreen_recorded_responses = {};
  }
  let entryId = Date.now();

  function isActive() {
    return window.__dupscreen_network_active === true;
  }

  function getFilter() {
    return (window.__dupscreen_network_filter || '').toLowerCase();
  }

  function getLabel() {
    return window.__dupscreen_network_label || '?';
  }

  function shouldCapture(url) {
    return isActive() && url.toLowerCase().includes(getFilter());
  }

  function post(entry) {
    window.postMessage({
      type: '__dupscreen_network__',
      entry: { ...entry, label: getLabel() },
    }, '*');
  }

  function safeStringify(body) {
    if (body === null || body === undefined) return null;
    if (typeof body === 'string') return body;
    try { return JSON.stringify(body); } catch { return String(body); }
  }

  function safeReadXhrResponse(xhr) {
    const rt = xhr.responseType;
    if (!rt || rt === 'text') {
      try { return xhr.responseText; } catch {}
    }
    if (rt === 'json') {
      try { return xhr.responseText; } catch {}
      return safeStringify(xhr.response);
    }
    if (rt === 'document') return xhr.response?.documentElement?.outerHTML ?? null;
    return '[binary ' + (rt || 'unknown') + ']';
  }

  function buildXhrResponse(bodyStr, responseType) {
    if (!responseType || responseType === 'text' || responseType === '') return bodyStr;
    if (responseType === 'json') {
      try { return JSON.parse(bodyStr); } catch { return null; }
    }
    if (responseType === 'document') {
      try { return new DOMParser().parseFromString(bodyStr, 'text/html'); } catch { return null; }
    }
    return bodyStr;
  }

  function applyMockToXhr(xhr, bodyStr, status, url, contentType) {
    const rt = xhr.responseType;
    Object.defineProperty(xhr, 'status', { get: () => status, configurable: true });
    Object.defineProperty(xhr, 'statusText', { get: () => 'OK', configurable: true });
    Object.defineProperty(xhr, 'readyState', { get: () => 4, configurable: true });
    Object.defineProperty(xhr, 'responseText', {
      get: () => {
        if (rt && rt !== 'text' && rt !== '') throw new DOMException(
          "Failed to read the 'responseText' property from 'XMLHttpRequest': " +
          "The value is only accessible if the object's 'responseType' is '' or 'text' (was '" + rt + "').",
          'InvalidStateError');
        return bodyStr;
      },
      configurable: true,
    });
    Object.defineProperty(xhr, 'response', {
      get: () => buildXhrResponse(bodyStr, rt),
      configurable: true,
    });
    Object.defineProperty(xhr, 'responseURL', { get: () => url, configurable: true });
    Object.defineProperty(xhr, 'getAllResponseHeaders', {
      value: () => `content-type: ${contentType}\r\n`,
      configurable: true,
    });
    Object.defineProperty(xhr, 'getResponseHeader', {
      value: (name) => name.toLowerCase() === 'content-type' ? contentType : null,
      configurable: true,
    });
  }

  function fireMockXhrEvents(xhr) {
    setTimeout(() => {
      xhr.dispatchEvent(new Event('readystatechange'));
      xhr.dispatchEvent(new Event('load'));
      xhr.dispatchEvent(new Event('loadend'));
      if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
      if (typeof xhr.onload === 'function') xhr.onload();
    }, 0);
  }

  function extractHeaders(headers) {
    if (!headers) return {};
    const out = {};
    if (headers instanceof Headers) {
      headers.forEach((v, k) => { out[k] = v; });
      return out;
    }
    if (Array.isArray(headers)) {
      for (const pair of headers) {
        if (Array.isArray(pair) && pair.length >= 2) out[pair[0]] = pair[1];
      }
      return out;
    }
    if (typeof headers === 'object') {
      for (const k of Object.keys(headers)) out[k] = headers[k];
      return out;
    }
    return out;
  }

  function extractWidgetName(headers) {
    if (!headers) return null;
    if (headers instanceof Headers) {
      return headers.get('widgetname') || headers.get('WidgetName') || headers.get('widgetName') || null;
    }
    if (Array.isArray(headers)) {
      const pair = headers.find(h => Array.isArray(h) && h[0]?.toLowerCase() === 'widgetname');
      return pair ? pair[1] : null;
    }
    if (typeof headers === 'object') {
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'widgetname') return headers[key];
      }
    }
    return null;
  }

  function computeFingerprint(method, url, body) {
    const parts = [];
    try {
      const u = new URL(url, location.origin);
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

  // Mock key is widget-agnostic — see overrideGetKey in background.js.
  // The widgetName parameter is kept for backwards-compatible callsites.
  function getOverrideKey(method, url, _widgetName) {
    let path;
    try {
      path = new URL(url, location.origin).pathname;
    } catch {
      path = url.split('?')[0];
    }
    path = String(path || '/').replace(/\/{2,}/g, '/');
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return (method || 'GET').toUpperCase() + ' ' + path;
  }

  function findOverride(method, url, widgetName) {
    const overrides = window.__dupscreen_network_overrides;
    if (!overrides) return null;
    return overrides[getOverrideKey(method, url, widgetName)] || null;
  }

  function peekRecordedResponse(method, url, widgetName, fingerprint) {
    const recorded = window.__dupscreen_recorded_responses;
    if (!recorded) return false;
    const responses = recorded[getOverrideKey(method, url, widgetName)];
    if (!responses) return false;
    if (!fingerprint) return true;
    if (Array.isArray(responses)) {
      return responses.some(r => r?.requestFingerprint === fingerprint);
    }
    return true;
  }

  function resolveResponses(recorded, method, url, widgetName) {
    return recorded[getOverrideKey(method, url, widgetName)] || null;
  }

  function findRecordedResponse(method, url, widgetName, fingerprint, strictFingerprint) {
    const recorded = window.__dupscreen_recorded_responses;
    if (!recorded) return null;

    const responses = resolveResponses(recorded, method, url, widgetName);
    if (!responses) return null;

    if (Array.isArray(responses)) {
      if (fingerprint) {
        for (let i = responses.length - 1; i >= 0; i--) {
          if (responses[i]?.requestFingerprint === fingerprint) {
            console.warn('[DupScreen] Fingerprint match at index', i, 'of', responses.length, 'for', url);
            return responses[i];
          }
        }
      }
      if (strictFingerprint) return null;

      // Fingerprint didn't match — fall back to the latest recorded entry for
      // the same key. This is the right behaviour for "record B, mock A":
      // the recording IS the source of truth, so any A request hitting a known
      // path should get the recorded body rather than leak through to the real
      // server (which often returns 404 and breaks the UI).
      if (fingerprint) {
        // Prefer entries without a stored fingerprint (legacy) first.
        for (let i = responses.length - 1; i >= 0; i--) {
          if (!responses[i]?.requestFingerprint) {
            console.warn('[DupScreen] No fingerprint match — falling back to legacy entry for', url,
              { incoming: fingerprint, count: responses.length });
            return responses[i];
          }
        }
        // Otherwise serve the most recent recording for this key.
        console.warn('[DupScreen] No fingerprint match — serving latest recorded entry for', url,
          { incoming: fingerprint, stored: responses.map(r => r?.requestFingerprint), count: responses.length });
        return responses[responses.length - 1] || null;
      }

      // No fingerprint (GET with no distinctive params/body) — return last
      return responses[responses.length - 1] || null;
    }

    return responses;
  }

  function isRecordReplayActive() {
    return window.__dupscreen_record_replay_active === true;
  }

  async function waitForRecordedResponse(method, url, widgetName, fingerprint, maxWaitMs) {
    const interval = 150;
    let waited = 0;
    while (waited < maxWaitMs) {
      await new Promise(r => setTimeout(r, interval));
      waited += interval;
      const peeked = peekRecordedResponse(method, url, widgetName, fingerprint);
      if (peeked) {
        const found = findRecordedResponse(method, url, widgetName, fingerprint);
        if (found) return found;
      }
      if (!fingerprint && peekRecordedResponse(method, url, widgetName, null)) {
        return findRecordedResponse(method, url, widgetName, null);
      }
    }
    return null;
  }

  // ---- Patch fetch ----
  // Always use the very first original, even across re-patches (HMR)
  const origFetch = window.__dupscreen_orig_fetch || window.fetch;
  window.__dupscreen_orig_fetch = origFetch;

  const patchedFetch = async function (input, init) {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.href
      : input instanceof Request ? input.url
      : String(input);

    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    let widgetName = extractWidgetName(init?.headers);
    if (!widgetName && input instanceof Request) {
      widgetName = extractWidgetName(input.headers);
    }

    // Extract request body early for fingerprinting
    let requestBody = null;
    if (init?.body !== undefined && init?.body !== null) {
      requestBody = safeStringify(init.body);
    } else if (input instanceof Request) {
      try { requestBody = await input.clone().text(); } catch {}
    }
    const fingerprint = computeFingerprint(method, url, requestBody);

    const override = findOverride(method, url, widgetName);
    if (override) {
      let reqHeaders = extractHeaders(init?.headers);
      if (input instanceof Request) {
        reqHeaders = { ...extractHeaders(input.headers), ...reqHeaders };
      }

      const id = ++entryId;
      const timestamp = Date.now();

      if (shouldCapture(url)) {
        post({
          id, method, url, timestamp, requestBody, widgetName,
          requestHeaders: reqHeaders,
          responseStatus: override.status || 200,
          responseBody: override.body || '',
        });
      }

      return new Response(override.body || '', {
        status: override.status || 200,
        statusText: 'OK',
        headers: { 'content-type': override.contentType || 'application/json' },
      });
    }

    let recorded = fingerprint
      ? findRecordedResponse(method, url, widgetName, fingerprint, true)
      : findRecordedResponse(method, url, widgetName, fingerprint);
    if (!recorded && isRecordReplayActive() && shouldCapture(url)) {
      recorded = await waitForRecordedResponse(method, url, widgetName, fingerprint, 3000);
    }
    if (!recorded && fingerprint) {
      recorded = findRecordedResponse(method, url, widgetName, fingerprint, false);
    }
    if (recorded) {
      let reqHeaders = extractHeaders(init?.headers);
      if (input instanceof Request) {
        reqHeaders = { ...extractHeaders(input.headers), ...reqHeaders };
      }

      const id = ++entryId;
      const timestamp = Date.now();

      if (shouldCapture(url)) {
        post({
          id, method, url, timestamp, requestBody, widgetName,
          requestHeaders: reqHeaders,
          responseStatus: recorded.status || 200,
          responseBody: recorded.body || '',
        });
      }

      return new Response(recorded.body || '', {
        status: recorded.status || 200,
        statusText: 'OK',
        headers: { 'content-type': recorded.contentType || 'application/json' },
      });
    }

    if (!shouldCapture(url)) return origFetch.apply(this, arguments);

    let reqHeaders = extractHeaders(init?.headers);
    if (input instanceof Request) {
      reqHeaders = { ...extractHeaders(input.headers), ...reqHeaders };
    }

    const id = ++entryId;
    const timestamp = Date.now();

    try {
      const response = await origFetch.apply(this, arguments);
      const clone = response.clone();
      let responseBody = null;
      try { responseBody = await clone.text(); } catch {}

      if (isActive()) {
        post({
          id, method, url, timestamp, requestBody, widgetName,
          requestHeaders: reqHeaders,
          responseStatus: response.status,
          responseBody,
        });
      }
      return response;
    } catch (err) {
      if (isActive()) {
        post({
          id, method, url, timestamp, requestBody, widgetName,
          requestHeaders: reqHeaders,
          responseStatus: 0,
          responseBody: null,
          error: err.message,
        });
      }
      throw err;
    }
  };

  window.fetch = patchedFetch;
  window.__dupscreen_patched_fetch = patchedFetch;

  // ---- Patch XMLHttpRequest ----
  const origOpen = window.__dupscreen_orig_xhr_open || XMLHttpRequest.prototype.open;
  const origSend = window.__dupscreen_orig_xhr_send || XMLHttpRequest.prototype.send;
  const origSetRequestHeader = window.__dupscreen_orig_xhr_setHeader || XMLHttpRequest.prototype.setRequestHeader;
  window.__dupscreen_orig_xhr_open = origOpen;
  window.__dupscreen_orig_xhr_send = origSend;
  window.__dupscreen_orig_xhr_setHeader = origSetRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__ds_method = method;
    this.__ds_url = typeof url === 'string' ? url : String(url);
    this.__ds_headers = {};
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__ds_headers) {
      this.__ds_headers[name.toLowerCase()] = value;
    }
    return origSetRequestHeader.apply(this, arguments);
  };

  const patchedSend = function (body) {
    const method = (this.__ds_method || 'GET').toUpperCase();
    const url = this.__ds_url;

    const xhrHeaders = this.__ds_headers ? { ...this.__ds_headers } : {};
    const widgetName = this.__ds_headers?.widgetname || null;

    const requestBodyStr = safeStringify(body);
    const fingerprint = computeFingerprint(method, url, requestBodyStr);

    const override = findOverride(method, url, widgetName);
    if (override) {
      const id = ++entryId;
      const requestBody = requestBodyStr;
      const timestamp = Date.now();
      const ct = override.contentType || 'application/json';

      applyMockToXhr(this, override.body || '', override.status || 200, url, ct);

      if (shouldCapture(url)) {
        post({
          id, method, url, timestamp, requestBody, widgetName,
          requestHeaders: xhrHeaders,
          responseStatus: override.status || 200,
          responseBody: override.body || '',
        });
      }

      fireMockXhrEvents(this);
      return;
    }

    const applyRecordedXhr = (xhr, rec, m, u, b, wn, hdrs) => {
      const id = ++entryId;
      const requestBody = safeStringify(b);
      const timestamp = Date.now();
      const ct = rec.contentType || 'application/json';

      applyMockToXhr(xhr, rec.body || '', rec.status || 200, u, ct);

      if (shouldCapture(u)) {
        post({
          id, method: m, url: u, timestamp, requestBody, widgetName: wn,
          requestHeaders: hdrs,
          responseStatus: rec.status || 200,
          responseBody: rec.body || '',
        });
      }

      fireMockXhrEvents(xhr);
    };

    const recorded = fingerprint
      ? findRecordedResponse(method, url, widgetName, fingerprint, true)
      : findRecordedResponse(method, url, widgetName, fingerprint);
    if (recorded) {
      applyRecordedXhr(this, recorded, method, url, body, widgetName, xhrHeaders);
      return;
    }

    if (isRecordReplayActive() && shouldCapture(url)) {
      const self = this;
      const capturedBody = body;
      let waited = 0;
      const maxWait = 3000;
      const checkInterval = 150;
      const poll = () => {
        waited += checkInterval;
        if (peekRecordedResponse(method, url, widgetName, fingerprint)) {
          const found = findRecordedResponse(method, url, widgetName, fingerprint);
          if (found) {
            applyRecordedXhr(self, found, method, url, capturedBody, widgetName, xhrHeaders);
            return;
          }
        }
        if (waited < maxWait) {
          setTimeout(poll, checkInterval);
        } else {
          const fallback = fingerprint ? findRecordedResponse(method, url, widgetName, fingerprint, false) : null;
          if (fallback) {
            applyRecordedXhr(self, fallback, method, url, capturedBody, widgetName, xhrHeaders);
            return;
          }
          const id = ++entryId;
          const reqBody = safeStringify(capturedBody);
          const ts = Date.now();
          self.addEventListener('load', function () {
            if (isActive()) {
              post({
                id, method, url, timestamp: ts, requestBody: reqBody, widgetName,
                requestHeaders: xhrHeaders,
                responseStatus: this.status,
                responseBody: safeReadXhrResponse(this),
              });
            }
          });
          self.addEventListener('error', function () {
            if (isActive()) {
              post({
                id, method, url, timestamp: ts, requestBody: reqBody, widgetName,
                requestHeaders: xhrHeaders,
                responseStatus: 0, responseBody: null, error: 'Network error',
              });
            }
          });
          origSend.apply(self, [capturedBody]);
        }
      };
      setTimeout(poll, checkInterval);
      return;
    }

    if (!url || !shouldCapture(url)) {
      return origSend.apply(this, arguments);
    }

    const id = ++entryId;
    const xhrMethod = method;
    const xhrUrl = url;
    const requestBody = requestBodyStr;
    const timestamp = Date.now();

    this.addEventListener('load', function () {
      if (isActive()) {
        post({
          id, method: xhrMethod, url: xhrUrl, timestamp, requestBody, widgetName,
          requestHeaders: xhrHeaders,
          responseStatus: this.status,
          responseBody: safeReadXhrResponse(this),
        });
      }
    });

    this.addEventListener('error', function () {
      if (isActive()) {
        post({
          id, method: xhrMethod, url: xhrUrl, timestamp, requestBody, widgetName,
          requestHeaders: xhrHeaders,
          responseStatus: 0,
          responseBody: null,
          error: 'Network error',
        });
      }
    });

    return origSend.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = patchedSend;
  window.__dupscreen_patched_xhr_send = patchedSend;

  // Periodic self-healing: detect when HMR replaces our patches and re-apply.
  // HMR doesn't trigger onCommitted, so the interceptor is never re-injected.
  if (!window.__dupscreen_hmr_monitor) {
    window.__dupscreen_hmr_monitor = setInterval(() => {
      if (!window.__dupscreen_network_patched) return;
      let restored = false;
      if (window.fetch !== window.__dupscreen_patched_fetch) {
        window.fetch = window.__dupscreen_patched_fetch;
        restored = true;
      }
      if (XMLHttpRequest.prototype.send !== window.__dupscreen_patched_xhr_send) {
        XMLHttpRequest.prototype.send = window.__dupscreen_patched_xhr_send;
        restored = true;
      }
      if (restored) {
        console.warn('[DupScreen] HMR detected — re-applied network patches');
      }
    }, 1500);
  }
})();
