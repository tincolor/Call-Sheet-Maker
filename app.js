// ============================================================
// Call Sheet — core application bootstrap
// ============================================================

let _drag = null;      // shared drag-and-drop state
let _reflowing = false; // prevents recursive autoReflow calls

// ---- API Keys ----
function getApiKey() { try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; } }
function getApiModel() { try { return localStorage.getItem(API_MODEL_STORAGE) || 'claude-sonnet-4-5'; } catch { return 'claude-sonnet-4-5'; } }

function initApiKey() {
  const input  = document.getElementById('apiKeyInput');
  const select = document.getElementById('apiKeyModel');
  const save   = document.getElementById('apiKeySave');
  const clear  = document.getElementById('apiKeyClear');
  if (!input) return;

  // hydrate
  const existing = getApiKey();
  if (existing) input.value = existing;
  select.value = getApiModel();
  refreshApiKeyStatus();

  save.addEventListener('click', () => {
    const v = input.value.trim();
    if (v) localStorage.setItem(API_KEY_STORAGE, v);
    else   localStorage.removeItem(API_KEY_STORAGE);
    localStorage.setItem(API_MODEL_STORAGE, select.value);
    refreshApiKeyStatus();
    save.textContent = 'Saved ✓';
    setTimeout(() => save.textContent = 'Save', 1200);
  });
  clear.addEventListener('click', () => {
    input.value = '';
    localStorage.removeItem(API_KEY_STORAGE);
    refreshApiKeyStatus();
  });
  select.addEventListener('change', () => {
    localStorage.setItem(API_MODEL_STORAGE, select.value);
    refreshApiKeyStatus();
  });
}

function refreshApiKeyStatus() {
  const pill = document.getElementById('apiKeyStatus');
  const hint = document.getElementById('intakeHint');
  if (!pill) return;
  const key = getApiKey();
  if (key) {
    pill.textContent = 'using ' + getApiModel().replace('claude-', '');
    pill.classList.add('active');
    hint.textContent = 'Using your API key · ' + getApiModel() + ' · up to 8k output tokens';
  } else {
    pill.textContent = 'built-in';
    pill.classList.remove('active');
    hint.textContent = 'Uses built-in Claude Haiku · output capped at ~1024 tokens';
  }
}

// ---- Intake Resizing ----
function setIntakeWidth(width, persist = true) {
  const px = Math.round(clamp(width, 200, 520));
  document.documentElement.style.setProperty('--intake-w', `${px}px`);
  if (persist) {
    try { localStorage.setItem(INTAKE_WIDTH_KEY, String(px)); } catch {}
  }
}

function initIntakeResize() {
  const resizer = document.getElementById('intakeResizer');
  const sidebar = document.getElementById('intakeSidebar');
  if (!resizer || !sidebar) return;

  try {
    const stored = Number(localStorage.getItem(INTAKE_WIDTH_KEY));
    if (stored) setIntakeWidth(stored, false);
  } catch {}

  let startX = 0;
  let startW = 0;

  const onMove = e => {
    setIntakeWidth(startW + (e.clientX - startX));
  };
  const onUp = () => {
    document.body.classList.remove('resizing-intake');
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  resizer.addEventListener('pointerdown', e => {
    e.preventDefault();
    startX = e.clientX;
    startW = sidebar.getBoundingClientRect().width;
    document.body.classList.add('resizing-intake');
    resizer.setPointerCapture?.(e.pointerId);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  });
}

// ============================================================
// TABS + CHROME
// ============================================================
function switchTab(tab) {
  if (tab === 'sheet') renderSheet();
}

function initChrome() {
  document.getElementById('btnPrint').addEventListener('click', () => window.print());
  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Wipe ALL days and start fresh? (Cannot undo.)')) return;
    localStorage.removeItem(CS_KEY);
    store = DEFAULT_STORE(); state = currentDay();
    save(); renderSheet(); renderDaySwitcher();
  });
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnImportCSV').addEventListener('click', importCSV);
  const bDel = document.getElementById('btnDelDay'); if (bDel) bDel.addEventListener('click', deleteDay);
  const bDupReal = document.getElementById('btnDupDay'); if (bDupReal) bDupReal.addEventListener('click', newDay);

  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  // add section
  document.querySelectorAll('[data-new]').forEach(b => b.addEventListener('click', () => addSection(b.dataset.new)));

  // tweaks
  document.getElementById('btnTweaks').addEventListener('click', () =>
    document.body.classList.toggle('tweaks-open'));
  document.getElementById('tweaksClose').addEventListener('click', () =>
    document.body.classList.remove('tweaks-open'));
  document.querySelectorAll('[data-tweak]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.tweak;
      store.tweaks[k] = !store.tweaks[k];
      save(); applyTweaks();
    });
  });
  // page size buttons
  const bA4 = document.getElementById('btnSizeA4');
  const bLetter = document.getElementById('btnSizeLetter');
  if (bA4) bA4.addEventListener('click', () => { store.tweaks.paperSize = 'a4'; save(); applyTweaks(); });
  if (bLetter) bLetter.addEventListener('click', () => { store.tweaks.paperSize = 'letter'; save(); applyTweaks(); });

  initIntakeResize();
}

// ---- BOOT ----
function boot() {
  document.body.classList.add('editing');
  initChrome();
  initIntake();
  renderDaySwitcher();
  renderSheet(); // renders header + sections + applies tweaks (incl. paper size)
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
