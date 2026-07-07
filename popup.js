document.addEventListener('DOMContentLoaded', async () => {
  const btnOverlay = document.getElementById('btnOverlay');
  const btnClose = document.getElementById('btnClose');
  const overlayUrlA = document.getElementById('overlayUrlA');
  const overlayUrlB = document.getElementById('overlayUrlB');
  const overlayAliasA = document.getElementById('overlayAliasA');
  const overlayAliasB = document.getElementById('overlayAliasB');
  const envSelectA = document.getElementById('envSelectA');
  const envSelectB = document.getElementById('envSelectB');

  const ENVS = [
    { name: 'UAT8',       angular: 'http://gateway-server-uat8.apps.ocpuatitvtrn.amdocs.com/',                            react: 'http://gateway-harmony-uat8.apps.ocpuatitvtrn.amdocs.com/harmony/' },
    { name: 'UAT3',       angular: 'http://gateway-server-uat3.apps.ocpuatitvtrn.amdocs.com/',                            react: 'http://gateway-harmony-uat3.apps.ocpuatitvtrn.amdocs.com/harmony/' },
    { name: 'UAT2',       angular: 'http://gateway-server-uat2.apps.ocpuatitvtrn.amdocs.com/',                            react: 'http://gateway-harmony-uat2.apps.ocpuatitvtrn.amdocs.com/harmony/' },
    { name: 'LOCAL-MOCK', angular: null,                                                                                    react: 'http://localhost:5001/' },
    { name: 'LOCAL-GW',   angular: null,                                                                                    react: 'http://localhost:8081/' },
    { name: '33',     angular: 'http://gateway-server-env33.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/edge',      react: 'http://gateway-harmony-env33-dev.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/harmony' },
    { name: '38-dev',     angular: 'http://gateway-server-env38-dev.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/edge',      react: 'http://gateway-harmony-env38-dev.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/harmony' },
    { name: '50',         angular: 'http://gateway-server-env50.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/',              react: 'http://gateway-harmony-env50.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/' },
    { name: '42',         angular: 'http://gateway-server-env42-rel.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/',          react: 'http://gateway-harmony-env42-rel.apps.ildelocpbmmtr1059.ocpd.corp.amdocs.com/' },
  ];

  function resolveEnvSide(aliasValue, fallbackSide) {
    const a = (aliasValue || '').toLowerCase();
    if (a.includes('angular')) return 'angular';
    if (a.includes('react')) return 'react';
    return fallbackSide;
  }

  function populateEnvSelect(select, aliasInput, urlInput, fallbackSide) {
    const prev = select.value;
    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Env';
    placeholder.hidden = true;
    select.appendChild(placeholder);

    const side = resolveEnvSide(aliasInput.value, fallbackSide);
    for (const env of ENVS) {
      const opt = document.createElement('option');
      opt.value = env.name;
      opt.textContent = env.name;
      if (!env[side]) opt.disabled = true;
      select.appendChild(opt);
    }

    if (prev && [...select.options].some(o => o.value === prev && !o.disabled)) {
      select.value = prev;
    }
  }

  function handleEnvChange(select, aliasInput, urlInput, fallbackSide) {
    const envName = select.value;
    const env = ENVS.find(e => e.name === envName);
    if (!env) return;
    const side = resolveEnvSide(aliasInput.value, fallbackSide);
    const url = env[side];
    if (url) urlInput.value = url;
  }

  populateEnvSelect(envSelectA, overlayAliasA, overlayUrlA, 'react');
  populateEnvSelect(envSelectB, overlayAliasB, overlayUrlB, 'angular');

  envSelectA.addEventListener('change', () => handleEnvChange(envSelectA, overlayAliasA, overlayUrlA, 'react'));
  envSelectB.addEventListener('change', () => handleEnvChange(envSelectB, overlayAliasB, overlayUrlB, 'angular'));

  overlayAliasA.addEventListener('input', () => populateEnvSelect(envSelectA, overlayAliasA, overlayUrlA, 'react'));
  overlayAliasB.addEventListener('input', () => populateEnvSelect(envSelectB, overlayAliasB, overlayUrlB, 'angular'));

  const btnGenerateImei = document.getElementById('btnGenerateImei');
  const btnCopyImei = document.getElementById('btnCopyImei');
  const imeiValue = document.getElementById('imeiValue');
  const imeiNotice = document.getElementById('imeiNotice');
  const RBI_OPTIONS = ['01', '10', '30', '33', '35', '44', '45', '49', '50', '51', '52', '53', '54', '86', '91', '98', '99'];

  const btnGenerateCc = document.getElementById('btnGenerateCc');
  const btnCopyCc = document.getElementById('btnCopyCc');
  const ccCard = document.getElementById('ccCard');
  const ccBrand = document.getElementById('ccBrand');
  const ccType = document.getElementById('ccType');
  const ccNumber = document.getElementById('ccNumber');
  const ccExpiry = document.getElementById('ccExpiry');
  const ccCvv = document.getElementById('ccCvv');
  const ccNotice = document.getElementById('ccNotice');

  let targetWidth = 1920;
  let imeiNoticeTimer = null;
  let ccNoticeTimer = null;
  let cachedCards = null;

  const state = await sendMessage({ action: 'get-state' });
  if (state) {
    targetWidth = state.targetWidth || 1920;
  }

  btnOverlay.addEventListener('click', async () => {
    btnOverlay.disabled = true;
    btnOverlay.textContent = 'Opening...';
    await sendMessage({
      action: 'open-overlay',
      urlA: overlayUrlA.value || undefined,
      urlB: overlayUrlB.value || undefined,
      aliasA: overlayAliasA.value.trim() || undefined,
      aliasB: overlayAliasB.value.trim() || undefined,
      mode: 'sidebyside',
      targetWidth,
    });
    btnOverlay.disabled = false;
    btnOverlay.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="16" height="14" rx="1" opacity="0.5"/><rect x="6" y="6" width="16" height="14" rx="1"/></svg> Open Screen Compare`;
  });

  btnClose.addEventListener('click', () => {
    window.close();
  });

  btnGenerateImei.addEventListener('click', () => {
    const generated = generateImei();
    imeiValue.value = generated;
    btnCopyImei.disabled = false;
    setImeiNotice('');
  });

  btnCopyImei.addEventListener('click', async () => {
    if (!imeiValue.value) return;
    const success = await copyTextToClipboard(imeiValue.value);
    if (success) {
      setImeiNotice('Copied');
      if (imeiNoticeTimer) clearTimeout(imeiNoticeTimer);
      imeiNoticeTimer = setTimeout(() => setImeiNotice(''), 1500);
    } else {
      setImeiNotice('Copy failed');
    }
  });

  btnGenerateCc.addEventListener('click', async () => {
    setCcNotice('');
    if (!cachedCards) {
      btnGenerateCc.disabled = true;
      btnGenerateCc.textContent = 'Fetching...';
      try {
        const res = await fetch('https://developer.paypal.com/apis/v1/paypal-test-cards?format=detailed', {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'x-requested-with': 'XMLHttpRequest',
          },
          mode: 'cors',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const raw = data.cards || data;
        cachedCards = (Array.isArray(raw) ? raw : []).filter(c =>
          c.card && c.card.number && c.card.expiry && c.card.security_code
        );
        if (cachedCards.length === 0) throw new Error('No cards returned');
      } catch {
        setCcNotice('Fetch failed');
        btnGenerateCc.disabled = false;
        btnGenerateCc.textContent = 'Generate Card';
        cachedCards = null;
        return;
      }
      btnGenerateCc.disabled = false;
      btnGenerateCc.textContent = 'Generate Card';
    }

    const entry = cachedCards[Math.floor(Math.random() * cachedCards.length)];
    const c = entry.card;
    const number = c.number || '';
    const formatted = number.replace(/(.{4})/g, '$1 ').trim();
    ccNumber.textContent = formatted;
    ccBrand.textContent = c.brand?.display_value || '';
    ccType.textContent = entry.card_rules?.scenario?.display_value || '';
    ccExpiry.textContent = c.expiry || '';
    ccCvv.textContent = c.security_code || '';
    ccCard.classList.remove('cc-hidden');
  });

  btnCopyCc.addEventListener('click', async () => {
    const raw = (ccNumber.textContent || '').replace(/\s/g, '');
    if (!raw) return;
    const success = await copyTextToClipboard(raw);
    if (success) {
      setCcNotice('Copied');
      if (ccNoticeTimer) clearTimeout(ccNoticeTimer);
      ccNoticeTimer = setTimeout(() => setCcNotice(''), 1500);
    } else {
      setCcNotice('Copy failed');
    }
  });

  function setCcNotice(text) {
    ccNotice.textContent = text;
  }

  function sendMessage(msg) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(msg, response => {
        resolve(response);
      });
    });
  }

  function generateImei() {
    const len = 15;
    const str = new Array(len).fill(0);
    let sum = 0;
    let pos = 0;

    const rbi = RBI_OPTIONS[Math.floor(Math.random() * RBI_OPTIONS.length)];
    str[0] = Number(rbi[0]);
    str[1] = Number(rbi[1]);
    pos = 2;

    while (pos < len - 1) {
      str[pos++] = Math.floor(Math.random() * 10) % 10;
    }

    const lenOffset = (len + 1) % 2;
    for (pos = 0; pos < len - 1; pos++) {
      if ((pos + lenOffset) % 2) {
        let t = str[pos] * 2;
        if (t > 9) t -= 9;
        sum += t;
      } else {
        sum += str[pos];
      }
    }

    const finalDigit = (10 - (sum % 10)) % 10;
    str[len - 1] = finalDigit;
    return str.join('').substring(0, len);
  }

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand('copy');
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  function setImeiNotice(text) {
    imeiNotice.textContent = text;
  }

  const GITLAB_RAW_URL = 'https://gitlab.corp.amdocs.com/SEFIBU/dupscreen-chrome-plugin/-/raw/master/manifest.json';
  const GITLAB_DOWNLOAD_URL = 'https://gitlab.corp.amdocs.com/SEFIBU/dupscreen-chrome-plugin/-/archive/master/dupscreen-chrome-plugin-master.zip';
  const GITLAB_REPO_URL = 'https://gitlab.corp.amdocs.com/SEFIBU/dupscreen-chrome-plugin';

  const versionLabel = document.getElementById('versionLabel');
  const versionStatus = document.getElementById('versionStatus');
  const localVersion = chrome.runtime.getManifest().version;
  versionLabel.textContent = 'v' + localVersion;

  checkForUpdates();

  async function checkForUpdates() {
    try {
      const res = await fetch(GITLAB_RAW_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const remote = await res.json();
      const remoteVersion = remote.version;
      if (!remoteVersion) throw new Error('no version');

      if (isNewer(remoteVersion, localVersion)) {
        versionStatus.className = 'version-status update-available';
        versionStatus.innerHTML = 'Update available (v' + escHtml(remoteVersion) + ')'
          + ' <a href="' + escHtml(GITLAB_DOWNLOAD_URL) + '" target="_blank">Download</a>';
      } else {
        versionStatus.className = 'version-status up-to-date';
        versionStatus.textContent = 'Up to date';
      }
    } catch {
      versionStatus.className = 'version-status';
      versionStatus.innerHTML = '<a href="' + escHtml(GITLAB_REPO_URL) + '" target="_blank">Check for updates</a>';
    }
  }

  function isNewer(remote, local) {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
      const rv = r[i] || 0;
      const lv = l[i] || 0;
      if (rv > lv) return true;
      if (rv < lv) return false;
    }
    return false;
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
