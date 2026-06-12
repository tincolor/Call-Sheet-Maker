import { useEffect, useRef } from 'preact/hooks';
import { useState } from 'preact/hooks';
import { clamp } from '../utils.js';
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
  setIntakeDraft,
  setIntakeStep,
  intakeMemorySignal,
  setIntakeMemory,
} from '../intake.js';
import { DEFAULT_DAY } from '../data.js';

// ── Resize handle ──────────────────────────────────────────────────────────

function useResizeHandle(sidebarRef) {
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
}

// ── API key panel ──────────────────────────────────────────────────────────

function ApiKeyPanel() {
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [apiModel, setApiModel] = useState(() => getApiModel());
  const [savedLabel, setSavedLabel] = useState('Save');
  const hasKey = !!apiKey;
  const hasBuiltIn = typeof window !== 'undefined' && !!window.claude?.complete;
  const pillText = hasKey
    ? 'using ' + apiModel.replace('claude-', '')
    : (hasBuiltIn ? 'built-in' : 'key required');

  const handleSave = () => {
    const v = apiKey.trim();
    saveApiKey(v, apiModel);
    setApiKey(v);
    setSavedLabel('Saved ✓');
    setTimeout(() => setSavedLabel('Save'), 1400);
  };

  return (
    <details class="isb-api-panel">
      <summary>
        Claude API key
        <span class={`isb-pill${hasKey ? ' isb-pill--active' : ''}`}>{pillText}</span>
        <span class="isb-chev">▾</span>
      </summary>
      <div class="isb-api-body">
        <p>Key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. Stored only in this browser.</p>
        <div class="isb-api-row">
          <input
            type="password"
            placeholder="sk-ant-…"
            autocomplete="off"
            spellcheck="false"
            value={apiKey}
            onInput={e => setApiKey(e.currentTarget.value)}
          />
          <button onClick={handleSave}>{savedLabel}</button>
          <button onClick={() => { clearApiKey(); setApiKey(''); }}>Clear</button>
        </div>
        <select
          value={apiModel}
          onChange={e => { setApiModel(e.currentTarget.value); saveApiKey(apiKey, e.currentTarget.value); }}
        >
          <option value="claude-sonnet-4-6">Sonnet 4.6 (best)</option>
          <option value="claude-haiku-4-5">Haiku 4.5 (fast)</option>
          {apiModel === 'claude-sonnet-4-5' && <option value="claude-sonnet-4-5">Sonnet 4.5 (saved)</option>}
        </select>
        <p class="isb-warn">⚠ Usage bills to your Anthropic account.</p>
      </div>
    </details>
  );
}

// ── Input step ─────────────────────────────────────────────────────────────

function InputStep({ textareaRef, onInterpret }) {
  const hasKey = !!getApiKey();
  const hasBuiltIn = typeof window !== 'undefined' && !!window.claude?.complete;
  const hint = hasKey
    ? `Using your key · ${getApiModel()}`
    : hasBuiltIn
      ? 'Uses built-in Claude Haiku · ~1024 token limit'
      : 'Claude API key required';

  const loadExample = () => {
    const d = DEFAULT_DAY();
    setIntakeDraft({
      note: 'Example data preview',
      ops: [
        { op: 'updateMeta', day: 'current', meta: d.meta },
        { op: 'setSections', day: 'current', mode: 'replace', sections: d.sections },
      ],
    });
    setIntakeStep('verify');
  };

  return (
    <>
      <p class="isb-lede">Paste raw notes — messages, emails, mixed languages — or tell Claude what to change. It can fill in the sheet, edit sections, and add or remove days.</p>
      <textarea
        ref={textareaRef}
        class="isb-textarea"
        placeholder='Paste anything — WhatsApp threads, emails, voice notes — or give an instruction like "add a second day for June 14".'
      />
      <div class="isb-row-actions">
        <button class="isb-btn isb-btn--primary" onClick={onInterpret}>Interpret →</button>
        <span class="isb-hint">{hint}</span>
      </div>
      {import.meta.env.DEV && (
        <div class="isb-row-actions" style="margin-top:6px">
          <button class="isb-btn isb-btn--ghost" onClick={loadExample}>Preview with example data</button>
        </div>
      )}
      <MemoryPanel />
      <ApiKeyPanel />
    </>
  );
}

// ── Intake memory panel ────────────────────────────────────────────────────

function MemoryPanel() {
  const memory = intakeMemorySignal.value;
  if (!memory) return null;
  return (
    <details class="isb-api-panel">
      <summary>
        Intake memory
        <span class="isb-pill isb-pill--active">{`~${Math.max(1, Math.round(memory.length / 4))} tokens`}</span>
        <span class="isb-chev">▾</span>
      </summary>
      <div class="isb-api-body">
        <p>Claude's running digest of everything you've pasted so far. It is sent with each request so follow-up pastes are understood in context. Clear it when you start a new production.</p>
        <pre class="isb-memory-text">{memory}</pre>
        <button class="isb-btn" onClick={() => setIntakeMemory('')}>Clear memory</button>
      </div>
    </details>
  );
}

// ── Loading step ───────────────────────────────────────────────────────────

function LoadingStep() {
  return (
    <div class="isb-loading">
      <div class="isb-spinner" />
      <span>Interpreting…</span>
    </div>
  );
}

// ── Error step ─────────────────────────────────────────────────────────────

function ErrorStep({ errorMsg, onRetry }) {
  return (
    <>
      <p class="isb-error-msg">{errorMsg}</p>
      <div class="isb-row-actions">
        <button class="isb-btn isb-btn--primary" onClick={onRetry}>Retry</button>
        <button class="isb-btn" onClick={() => { intakeStepSignal.value = 'input'; }}>Back</button>
      </div>
    </>
  );
}

// ── Verify step ────────────────────────────────────────────────────────────
// Uses contenteditable spans with imperative initial-value setting (via ref +
// useEffect) so Preact never re-reconciles typed content.

function Editable({ value, multiline, cls, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.textContent = value ?? '';
  }, []); // mount only — never reset on re-render
  return (
    <span
      ref={ref}
      class={`isb-editable${multiline ? ' isb-editable--block' : ''}${cls ? ' ' + cls : ''}`}
      contenteditable="true"
      onInput={e => onChange(e.currentTarget.textContent)}
    />
  );
}

function ScheduleRows({ data }) {
  return (
    <>
      {data.map((row, ri) => (
        <div class={`isb-item${row.type === 'span' ? ' isb-item--span' : ''}`} key={ri}>
          <div class="isb-item-time">
            {row.time}{row.dur ? ` · ${row.dur}` : ''}
          </div>
          {row.type === 'span' ? (
            <Editable
              cls="isb-item-span"
              value={row.text}
              onChange={v => { row.text = v; }}
            />
          ) : (
            <>
              <Editable
                cls="isb-item-task"
                value={row.task}
                onChange={v => { row.task = v; }}
              />
              {row.loc  && <Field label="loc"  value={row.loc}  onChange={v => { row.loc  = v; }} />}
              {row.cast && <Field label="cast" value={row.cast} onChange={v => { row.cast = v; }} />}
              {row.note && <Field label="note" value={row.note} onChange={v => { row.note = v; }} />}
            </>
          )}
        </div>
      ))}
    </>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div class="isb-field">
      <span class="isb-field-label">{label}</span>
      <Editable value={value} onChange={onChange} />
    </div>
  );
}

function ContactRows({ data }) {
  return (
    <>
      {data.map((c, ri) => (
        <div class="isb-item" key={ri}>
          <Editable cls="isb-item-name" value={c.name} onChange={v => { c.name = v; }} />
          <div class="isb-field">
            <Editable value={c.role} onChange={v => { c.role = v; }} />
            {c.phone && (
              <>
                <span class="isb-sep">·</span>
                <Editable value={c.phone} onChange={v => { c.phone = v; }} />
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function EquipmentRows({ data }) {
  return (
    <>
      {data.map((item, ri) => (
        <div class="isb-item isb-item--eq" key={ri}>
          <span class="isb-eq-mark">○</span>
          <Editable value={item.text} onChange={v => { item.text = v; }} />
        </div>
      ))}
    </>
  );
}

function KVRows({ data }) {
  return (
    <>
      {Object.entries(data).map(([k, v]) => (
        <div class="isb-kv-row" key={k}>
          <span class="isb-kv-key">{k}</span>
          <Editable
            cls="isb-kv-val"
            multiline={typeof v === 'string' && v.includes('\n')}
            value={v}
            onChange={val => { data[k] = val; }}
          />
        </div>
      ))}
    </>
  );
}

function MetaRows({ meta }) {
  return (
    <>
      {Object.entries(meta).filter(([, v]) => typeof v === 'string').map(([k, v]) => (
        <div class="isb-kv-row" key={k}>
          <span class="isb-kv-key">{k}</span>
          <Editable
            cls="isb-kv-val"
            multiline={v.includes('\n')}
            value={v}
            onChange={val => { meta[k] = val; }}
          />
        </div>
      ))}
    </>
  );
}

function SectionCard({ sec }) {
  const { type, title, data } = sec;
  let rows;
  if (!Array.isArray(data) || data.length === 0) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      rows = <KVRows data={data} />;
    } else {
      rows = <p class="isb-empty">(empty)</p>;
    }
  } else if (type === 'schedule') {
    rows = <ScheduleRows data={data} />;
  } else if (type === 'contacts') {
    rows = <ContactRows data={data} />;
  } else if (type === 'equipment') {
    rows = <EquipmentRows data={data} />;
  } else {
    rows = <KVRows data={data} />;
  }

  return (
    <div class="isb-card">
      <div class="isb-card-head">
        <span class="isb-card-title">{title || type}</span>
        <span class="isb-card-type">{type}</span>
      </div>
      {rows}
    </div>
  );
}

function opLabel(op) {
  const dayRef = op.day == null || op.day === 'current' ? 'current day' : `day ${op.day}`;
  switch (op.op) {
    case 'updateMeta':    return `Update header — ${dayRef}`;
    case 'setSections':   return `${op.mode === 'replace' ? 'Replace all sections' : 'Add sections'} — ${dayRef}`;
    case 'updateSection': return `Update "${op.match}" — ${dayRef}`;
    case 'removeSection': return `Remove "${op.match}" — ${dayRef}`;
    case 'addDay':        return 'Add new day';
    case 'deleteDay':     return `Delete day ${op.day}`;
    default:              return op.op;
  }
}

function OpCard({ op }) {
  const sections = op.op === 'updateSection'
    ? (op.section ? [{ type: op.section.type || 'section', title: op.section.title || op.match, data: op.section.data }] : [])
    : (op.sections || []);
  return (
    <div class="isb-op">
      <div class="isb-op-head">{opLabel(op)}</div>
      {op.meta && (
        <div class="isb-card">
          <div class="isb-card-head">
            <span class="isb-card-title">Header</span>
            <span class="isb-card-type">meta</span>
          </div>
          <MetaRows meta={op.meta} />
        </div>
      )}
      {sections.map((sec, si) => <SectionCard key={si} sec={sec} />)}
    </div>
  );
}

function VerifyStep({ draft, repairNote }) {
  if (!draft || (!draft.ops?.length && draft.memory == null && !draft.note)) {
    return <p class="isb-empty">No changes proposed.</p>;
  }
  return (
    <>
      {repairNote && <div class="isb-repair-note">{repairNote}</div>}
      {draft.note && <p class="isb-lede">{draft.note}</p>}
      {!draft.ops?.length && (
        <p class="isb-empty">
          {draft.memory != null
            ? 'No sheet changes — Claude noted this input for later. Publish to keep the updated memory.'
            : 'No sheet changes.'}
        </p>
      )}
      {(draft.ops || []).map((op, i) => <OpCard key={i} op={op} />)}
      {draft.memory != null && (
        <p class="isb-memory-flag">✦ Intake memory will be updated on publish.</p>
      )}
    </>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────

export function IntakeSidebar() {
  const step = intakeStepSignal.value;
  const errorMsg = intakeErrorSignal.value;
  const repairNote = intakeRepairNoteSignal.value;

  const textareaRef = useRef(null);
  const sidebarRef = useRef(null);

  useResizeHandle(sidebarRef);

  const handleInterpret = () => runIntake(textareaRef.current?.value.trim() ?? '');

  return (
    <div class="intake-sidebar" ref={sidebarRef}>
      <div class="isb-head">Intake</div>

      <div class="isb-body">
        {step === 'input'  && <InputStep textareaRef={textareaRef} onInterpret={handleInterpret} />}
        {step === 'loading' && <LoadingStep />}
        {step === 'verify'  && <VerifyStep draft={intakeDraft} repairNote={repairNote} />}
        {step === 'error'   && <ErrorStep errorMsg={errorMsg} onRetry={handleInterpret} />}
      </div>

      {step === 'verify' && (
        <div class="isb-footer">
          <button class="isb-btn isb-btn--primary" onClick={publishIntake}>Publish to Sheet →</button>
          <button class="isb-btn" onClick={resetIntake}>Discard</button>
        </div>
      )}
    </div>
  );
}
