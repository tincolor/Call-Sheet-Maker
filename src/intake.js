// ============================================================
// LLM INTAKE SIDEBAR MODULE
// ============================================================

let intakeDraft = null; // parsed JSON awaiting verify

function initIntake() {
  const btn = document.getElementById('intakeInterpret');
  btn.addEventListener('click', runIntake);
  document.getElementById('intakeCancel').addEventListener('click', resetIntake);
  document.getElementById('intakePublish').addEventListener('click', publishIntake);
  document.getElementById('intakeRetry').addEventListener('click', runIntake);

  const keyInput = document.getElementById('apiKeyInput');
  const keySave  = document.getElementById('apiKeySave');
  const keyClear = document.getElementById('apiKeyClear');
  const keyModel = document.getElementById('apiKeyModel');

  if (keyInput && keySave && keyClear && keyModel) {
    initApiKey();
  }
}

async function completeWithClaude(userContent) {
  const key = getApiKey();
  if (key) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: getApiModel(),
        max_tokens: 8000,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch {}
      throw new Error(`Claude API ${res.status}: ${detail || res.statusText}`);
    }
    const json = await res.json();
    return (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }
  // fall back to built-in helper (design environment)
  if (!window.claude?.complete) {
    throw new Error('No API key set and built-in Claude helper is not available. Save an API key in the panel below.');
  }
  return await window.claude.complete({
    messages: [{ role: 'user', content: userContent }],
  });
}

const INTAKE_SYSTEM = `You convert raw production text (messages, emails, notes; may be mixed English/Japanese) into a compact JSON call-sheet object. Keep output SHORT — omit any key whose value is empty. Use this shape:

{ "meta": { "company"?, "address"?, "project"?, "client"?, "mainLocation"?, "date"?, "day"?, "shootCall"?, "emergency"?, "weatherCallout"?, "headerNote"?, "sunrise"?, "sunset"? },
  "sections": [
    { "type": "schedule", "title": "...", "data": [ { "type": "row", "time": "...", "dur": "...", "task": "...", "loc": "...", "cast": "...", "note": "..." }, { "type": "span", "time": "...", "text": "..." } ] },
    { "type": "contacts", "title": "...", "data": [ { "role": "...", "name": "...", "phone": "..." } ] },
    { "type": "equipment", "title": "...", "data": [ { "text": "...", "done": false } ] },
    { "type": "hospital", "title": "...", "data": { "name": "...", "addr": "...", "phone": "...", "hours": "...", "dist": "..." } },
    { "type": "basecamp", "title": "...", "data": { "name": "...", "addr": "...", "parking": "...", "restroom": "...", "catering": "..." } },
    { "type": "notes", "title": "Notes", "data": { "text": "..." } }
  ]
}

Rules: only include sections that have content. Inside each section, only include fields that are present. Anything that does not fit goes into a notes section. Return ONLY the JSON object — no markdown, no prose, no commentary.`;

// Attempt to repair JSON that was truncated mid-output (Haiku 1024-token cap).
// Strategy: close any open string, then close arrays/objects in reverse-stack order.
function tryRepairJSON(s) {
  s = s.trim();
  // strip trailing comma / dangling key
  s = s.replace(/,\s*$/, '');
  const stack = [];
  let inStr = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  if (inStr) s += '"';
  // if we ended inside an incomplete key-value (e.g. "key": with no value)
  s = s.replace(/,?\s*"[^"]*"\s*:\s*$/, '');
  s = s.replace(/,\s*$/, '');
  while (stack.length) {
    const o = stack.pop();
    s += (o === '{' ? '}' : ']');
  }
  return s;
}

async function runIntake() {
  const txt = document.getElementById('intakeInput').value.trim();
  if (!txt) { alert('Paste some text first.'); return; }
  setIntakeStep('loading');
  try {
    const raw = await completeWithClaude(
      `${INTAKE_SYSTEM}\n\n--- INPUT START ---\n${txt}\n--- INPUT END ---`
    );
    const clean = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    let parsed, repairedNote = '';
    try {
      parsed = JSON.parse(clean);
    } catch (e1) {
      const repaired = tryRepairJSON(clean);
      try {
        parsed = JSON.parse(repaired);
        repairedNote = 'Output was truncated — some trailing content may be missing. Review carefully before publishing.';
      } catch (e2) {
        throw new Error('Could not parse model output. The response was likely truncated (Claude Haiku has a 1024-token output cap). Try pasting a smaller chunk, or break the input into parts. Original parse error: ' + e1.message);
      }
    }
    intakeDraft = parsed;
    renderIntakePreview(repairedNote);
    setIntakeStep('verify');
  } catch (e) {
    document.getElementById('intakeError').textContent = e.message || String(e);
    setIntakeStep('error');
  }
}

function setIntakeStep(step) {
  ['input','loading','verify','error'].forEach(s =>
    document.getElementById('intake-' + s).style.display = (s === step ? '' : 'none'));
}

function resetIntake() {
  intakeDraft = null;
  document.getElementById('intakeInput').value = '';
  setIntakeStep('input');
}

function renderIntakePreview(note = '') {
  const host = document.getElementById('intakePreview');
  host.innerHTML = '';
  if (note) {
    const n = document.createElement('div');
    n.style.cssText = 'background:#FFF3B0;border:1px solid #CBB04F;color:#5A4700;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;';
    n.textContent = note;
    host.appendChild(n);
  }

  // META
  const meta = intakeDraft.meta || {};
  const curMeta = state.meta;
  const metaTable = document.createElement('div');
  metaTable.className = 'preview-block';
  metaTable.innerHTML = `<h4>Header</h4><table class="pv"><tbody>${
    Object.keys(meta).map(k => {
      const v = meta[k] || '';
      const changed = (v || '') !== (curMeta[k] || '');
      return `<tr><td class="k">${esc(k)}</td><td class="v ${changed ? 'changed' : ''}" contenteditable="true" data-scope="meta" data-k="${esc(k)}">${esc(v)}</td></tr>`;
    }).join('')
  }</tbody></table>`;
  host.appendChild(metaTable);

  // SECTIONS
  (intakeDraft.sections || []).forEach((sec, si) => {
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

  // wire edits back into intakeDraft
  host.querySelectorAll('[data-scope]').forEach(el => {
    el.addEventListener('input', () => {
      const s = el.dataset.scope;
      if (s === 'meta') intakeDraft.meta[el.dataset.k] = el.textContent;
      if (s === 'sec.row') intakeDraft.sections[+el.dataset.si].data[+el.dataset.ri][el.dataset.c] = el.textContent;
      if (s === 'sec.obj') intakeDraft.sections[+el.dataset.si].data[el.dataset.c] = el.textContent;
    });
  });
}

function publishIntake() {
  if (!intakeDraft) return;
  // merge meta
  Object.assign(state.meta, intakeDraft.meta || {});
  // merge / replace sections: assign new uids and append to existing
  if (Array.isArray(intakeDraft.sections) && intakeDraft.sections.length) {
    const action = confirm('OK = Replace existing sections with interpreted ones.\nCancel = Append to existing sections.');
    const fresh = intakeDraft.sections.map(s => ({ ...s, id: uid() }));
    if (action) state.sections = fresh;
    else state.sections.push(...fresh);
  }
  save();
  switchTab('sheet');
  renderSheet();
  resetIntake();
}
