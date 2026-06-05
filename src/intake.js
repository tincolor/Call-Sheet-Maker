import { signal } from '@preact/signals';
import { app, save } from './store.js';
import { uid, clamp } from './utils.js';
import { INTAKE_WIDTH_KEY } from './constants.js';
import { renderSheet } from './render/sheet.js';

// ---- Intake flow signals (read by IntakeSidebar.jsx and csv.js) ----
export const intakeStepSignal = signal('input'); // 'input' | 'loading' | 'verify' | 'error'
export const intakeErrorSignal = signal('');
export const intakeRepairNoteSignal = signal('');

export let intakeDraft = null;

export function setIntakeDraft(val) { intakeDraft = val; }
export function setIntakeStep(step) { intakeStepSignal.value = step; }

// ---- Claude API key handling ----
const API_KEY_STORAGE = 'callsheet.claudeApiKey';
const API_MODEL_STORAGE = 'callsheet.claudeModel';

export function getApiKey() {
  try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; }
}

export function getApiModel() {
  try { return localStorage.getItem(API_MODEL_STORAGE) || 'claude-sonnet-4-5'; } catch { return 'claude-sonnet-4-5'; }
}

export function saveApiKey(key, model) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key);
  else localStorage.removeItem(API_KEY_STORAGE);
  if (model) localStorage.setItem(API_MODEL_STORAGE, model);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

export async function completeWithClaude(userContent) {
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

export const INTAKE_SYSTEM = `You convert raw production text (messages, emails, notes; may be mixed English/Japanese) into a compact JSON call-sheet object. Keep output SHORT — omit any key whose value is empty. Use this shape:

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
export function tryRepairJSON(s) {
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

export async function runIntake(text) {
  if (!text) { alert('Paste some text first.'); return; }
  intakeStepSignal.value = 'loading';
  try {
    const raw = await completeWithClaude(
      `${INTAKE_SYSTEM}\n\n--- INPUT START ---\n${text}\n--- INPUT END ---`
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
    intakeRepairNoteSignal.value = repairedNote;
    intakeStepSignal.value = 'verify';
  } catch (e) {
    intakeErrorSignal.value = e.message || String(e);
    intakeStepSignal.value = 'error';
  }
}

export function resetIntake() {
  intakeDraft = null;
  intakeErrorSignal.value = '';
  intakeRepairNoteSignal.value = '';
  intakeStepSignal.value = 'input';
}

export function publishIntake() {
  if (!intakeDraft) return;
  Object.assign(app.state.meta, intakeDraft.meta || {});
  if (Array.isArray(intakeDraft.sections) && intakeDraft.sections.length) {
    const action = confirm('OK = Replace existing sections with interpreted ones.\nCancel = Append to existing sections.');
    const fresh = intakeDraft.sections.map(s => ({ ...s, id: uid() }));
    if (action) app.state.sections = fresh;
    else app.state.sections.push(...fresh);
  }
  save();
  renderSheet();
  resetIntake();
}

export function setIntakeWidth(width, persist = true) {
  const px = Math.round(clamp(width, 200, 520));
  document.documentElement.style.setProperty('--intake-w', `${px}px`);
  if (persist) {
    try { localStorage.setItem(INTAKE_WIDTH_KEY, String(px)); } catch {}
  }
}
