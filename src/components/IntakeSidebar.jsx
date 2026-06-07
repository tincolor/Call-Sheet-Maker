import { useEffect, useRef, useState } from 'preact/hooks';
import { esc, clamp } from '../utils.js';
import { INTAKE_WIDTH_KEY } from '../constants.js';
import {
  intakeStepSignal,
  intakeErrorSignal,
  intakeRepairNoteSignal,
  intakeDraft,
  runIntake,
  resetIntake,
  publishIntake,
  getApiKey,
  getApiModel,
  saveApiKey,
  clearApiKey,
  setIntakeWidth,
} from '../intake.js';

function renderPreview(host, draft, note) {
  host.innerHTML = '';
  if (note) {
    const n = document.createElement('div');
    n.style.cssText = 'background:#FFF3B0;border:1px solid #CBB04F;color:#5A4700;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;';
    n.textContent = note;
    host.appendChild(n);
  }

  // META
  const meta = draft.meta || {};
  const metaTable = document.createElement('div');
  metaTable.className = 'preview-block';
  metaTable.innerHTML = `<h4>Header</h4><table class="pv"><tbody>${
    Object.keys(meta).map(k => {
      const v = meta[k] || '';
      return `<tr><td class="k">${esc(k)}</td><td class="v" contenteditable="true" data-scope="meta" data-k="${esc(k)}">${esc(v)}</td></tr>`;
    }).join('')
  }</tbody></table>`;
  host.appendChild(metaTable);

  // SECTIONS
  (draft.sections || []).forEach((sec, si) => {
    const block = document.createElement('div');
    block.className = 'preview-block';
    block.innerHTML = `<h4>${esc(sec.title || sec.type)} <span class="tag">${esc(sec.type)}</span></h4>`;
    if (Array.isArray(sec.data)) {
      if (sec.data.length === 0) { block.innerHTML += '<p class="muted">(empty)</p>'; host.appendChild(block); return; }
      const cols = Object.keys(sec.data[0]);
      block.innerHTML += `<table class="pv"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
        sec.data.map((r, ri) => `<tr>${
          cols.map(c => `<td class="v" contenteditable="true" data-scope="sec.row" data-si="${si}" data-ri="${ri}" data-c="${esc(c)}">${esc(r[c] != null ? r[c] : '')}</td>`).join('')
        }</tr>`).join('')
      }</tbody></table>`;
    } else if (sec.data && typeof sec.data === 'object') {
      const cols = Object.keys(sec.data);
      block.innerHTML += `<table class="pv"><tbody>${
        cols.map(c => `<tr><td class="k">${esc(c)}</td><td class="v" contenteditable="true" data-scope="sec.obj" data-si="${si}" data-c="${esc(c)}">${esc(sec.data[c] || '')}</td></tr>`).join('')
      }</tbody></table>`;
    }
    host.appendChild(block);
  });

  // wire edits back into draft in-place
  host.querySelectorAll('[data-scope]').forEach(el => {
    el.addEventListener('input', () => {
      const s = el.dataset.scope;
      if (s === 'meta') draft.meta[el.dataset.k] = el.textContent;
      if (s === 'sec.row') draft.sections[+el.dataset.si].data[+el.dataset.ri][el.dataset.c] = el.textContent;
      if (s === 'sec.obj') draft.sections[+el.dataset.si].data[el.dataset.c] = el.textContent;
    });
  });
}

export function IntakeSidebar() {
  const step = intakeStepSignal.value;
  const errorMsg = intakeErrorSignal.value;
  const repairNote = intakeRepairNoteSignal.value;

  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const sidebarRef = useRef(null);

  // Local state for API key UI (not signal — only affects this component)
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [apiModel, setApiModel] = useState(() => getApiModel());
  const [saveBtnText, setSaveBtnText] = useState('Save');

  const hasKey = !!apiKey;
  const hasBuiltIn = typeof window !== 'undefined' && !!window.claude?.complete;
  const pillText = hasKey 
    ? 'using ' + apiModel.replace('claude-', '') 
    : (hasBuiltIn ? 'built-in' : 'key required');
  const hintText = hasKey
    ? `Using your API key · ${apiModel} · up to 8k output tokens`
    : hasBuiltIn
      ? 'Uses built-in Claude Haiku · output capped at ~1024 tokens'
      : 'Claude API key required for AI Intake';

  // Render preview imperatively when entering verify step
  useEffect(() => {
    if (step === 'verify' && previewRef.current && intakeDraft) {
      renderPreview(previewRef.current, intakeDraft, repairNote);
    }
  }, [step]);

  // Wire resize handle
  useEffect(() => {
    const resizer = document.getElementById('intakeResizer');
    const sidebar = sidebarRef.current;
    if (!resizer || !sidebar) return;

    try {
      const stored = Number(localStorage.getItem(INTAKE_WIDTH_KEY));
      if (stored) setIntakeWidth(stored, false);
    } catch {}

    let startX = 0, startW = 0;

    const onMove = e => setIntakeWidth(startW + (e.clientX - startX));
    const onUp = () => {
      document.body.classList.remove('resizing-intake');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    const onDown = e => {
      e.preventDefault();
      startX = e.clientX;
      startW = sidebar.getBoundingClientRect().width;
      document.body.classList.add('resizing-intake');
      resizer.setPointerCapture?.(e.pointerId);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    };

    resizer.addEventListener('pointerdown', onDown);
    return () => resizer.removeEventListener('pointerdown', onDown);
  }, []);

  const handleInterpret = () => {
    const txt = textareaRef.current?.value.trim() ?? '';
    runIntake(txt);
  };

  const handleSaveKey = () => {
    const v = apiKey.trim();
    saveApiKey(v, apiModel);
    setApiKey(v);
    setSaveBtnText('Saved ✓');
    setTimeout(() => setSaveBtnText('Save'), 1200);
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKey('');
  };

  return (
    <div class="intake-sidebar" ref={sidebarRef}>
      <div class="intake-sidebar-hd">Intake</div>
      <div class="intake">
        <p class="lede">Paste raw notes — messages, emails, mixed languages — and Claude will structure them into the call sheet.</p>

        {/* Input step */}
        <div id="intake-input" style={{ display: step === 'input' ? '' : 'none' }}>
          <textarea ref={textareaRef} placeholder="Paste anything — WhatsApp threads, emails, voice notes. Claude will interpret and organize it."></textarea>
          <div class="actions">
            <button class="primary" onClick={handleInterpret}>Interpret →</button>
            <span class="hint">{hintText}</span>
          </div>
          <details class="api-key-block">
            <summary>
              <span>Claude API key <span class={`pill${hasKey ? ' active' : ''}`}>{pillText}</span></span>
              <span class="chev">▾</span>
            </summary>
            <div class="api-key-body">
              <p>Paste a key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. Stored only in this browser.</p>
              <div class="api-key-row">
                <input
                  type="password"
                  placeholder="sk-ant-…"
                  autocomplete="off"
                  spellcheck="false"
                  style="flex:1;min-width:0;"
                  value={apiKey}
                  onInput={e => setApiKey(e.currentTarget.value)}
                />
                <button onClick={handleSaveKey}>{saveBtnText}</button>
                <button onClick={handleClearKey}>Clear</button>
              </div>
              <select
                style="width:100%;margin-top:6px;"
                value={apiModel}
                onChange={e => { setApiModel(e.currentTarget.value); saveApiKey(apiKey, e.currentTarget.value); }}
              >
                <option value="claude-sonnet-4-5">Sonnet 4.5 (best)</option>
                <option value="claude-haiku-4-5">Haiku 4.5 (fast)</option>
              </select>
              <p class="warn" style="margin-top:8px;">⚠ Usage bills to your Anthropic account.</p>
            </div>
          </details>
        </div>

        {/* Loading step */}
        {step === 'loading' && (
          <div>
            <div class="loader"><div class="spinner"></div><div>Interpreting…</div></div>
          </div>
        )}

        {/* Verify step */}
        <div style={{ display: step === 'verify' ? '' : 'none' }}>
          <div ref={previewRef}></div>
          <div class="actions">
            <button class="primary" onClick={(e) => publishIntake(e.currentTarget)}>Publish to Sheet →</button>
            <button onClick={resetIntake}>Cancel</button>
            <span class="hint">Yellow = differs from current sheet</span>
          </div>
        </div>

        {/* Error step */}
        {step === 'error' && (
          <div>
            <h3 style="font-size:13px;margin:0 0 6px;">Something went wrong</h3>
            <div style="font-size:12px;color:var(--accent);margin-bottom:10px;">{errorMsg}</div>
            <div class="actions">
              <button class="primary" onClick={() => runIntake(textareaRef.current?.value.trim() ?? '')}>Retry</button>
              <button onClick={() => { intakeStepSignal.value = 'input'; }}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
