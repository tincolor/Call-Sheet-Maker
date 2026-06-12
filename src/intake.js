import { signal } from '@preact/signals';
import { app, save, normalizeMultilineFields } from './store.js';
import { uid, clamp } from './utils.js';
import { INTAKE_WIDTH_KEY } from './constants.js';
import { renderSheet } from './render/sheet.js';
import { BLANK_DAY } from './data.js';

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
  try { return localStorage.getItem(API_MODEL_STORAGE) || 'claude-sonnet-4-6'; } catch { return 'claude-sonnet-4-6'; }
}

export function saveApiKey(key, model) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key);
  else localStorage.removeItem(API_KEY_STORAGE);
  if (model) localStorage.setItem(API_MODEL_STORAGE, model);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

// ---- Intake memory: rolling digest of prior inputs (raw pastes are sent once,
// then live on only as this model-maintained summary) ----
const INTAKE_MEMORY_STORAGE = 'callsheet.intakeMemory';
export const intakeMemorySignal = signal(
  (() => { try { return localStorage.getItem(INTAKE_MEMORY_STORAGE) || ''; } catch { return ''; } })()
);

export function getIntakeMemory() {
  return intakeMemorySignal.value;
}

export function setIntakeMemory(text) {
  intakeMemorySignal.value = text || '';
  try {
    if (text) localStorage.setItem(INTAKE_MEMORY_STORAGE, text);
    else localStorage.removeItem(INTAKE_MEMORY_STORAGE);
  } catch {}
}

export async function completeWithClaude(userContent, system) {
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
        ...(system ? { system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }] } : {}),
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
    messages: [{ role: 'user', content: system ? `${system}\n\n${userContent}` : userContent }],
  });
}

export const INTAKE_SYSTEM = `You are the editing engine of Call Sheet Maker, a multi-day film/TV call sheet app. The document is a list of DAYS; each day has "meta" (header fields) and "sections".

You receive the CURRENT SHEET as JSON (every day, with its 1-based index and which one is current), followed by USER INPUT. The input is either raw production text to interpret (messages, emails, notes; may be mixed English/Japanese) or an instruction to change the sheet.

Only the current day's sections include full data. Other days (and days marked "placeholderTemplate": true, which still hold untouched template text) list section titles with row counts only. A placeholderTemplate day should be treated as empty: use mode "replace" when writing sections to it. Avoid updateSection/setSections with mode "replace" on a NON-current day whose data you cannot see — you would overwrite content blindly; tell the user to switch to that day instead (in "note", with an empty ops list if nothing else was asked).

You may also receive INTAKE MEMORY: a running digest of earlier inputs from this production. Raw pastes are NOT resent on later turns — this memory is your only record of them.

Respond with ONLY a JSON object — no markdown fences, no prose:
{ "note"?: "<one short sentence summarizing what you did>", "memory"?: "<updated digest, see below>", "ops": [ ...operations... ] }

Operations ("day" is a 1-based index or "current"; it defaults to "current"):
- { "op": "updateMeta", "day"?, "meta": { ...partial header fields... } }
- { "op": "setSections", "day"?, "mode": "replace" | "append", "sections": [ ...section objects... ] }
- { "op": "updateSection", "day"?, "match": "<section title>", "section": { "title"?, "data"? } }  // data replaces the whole section data
- { "op": "removeSection", "day"?, "match": "<section title>" }
- { "op": "addDay", "meta"?: { ... }, "sections"?: [ ... ] }  // creates a new day and switches to it
- { "op": "deleteDay", "day": <index> }

Meta fields: company, address, project, client, mainLocation, date, day, shootCall, emergency, weatherCallout, headerNote, sunrise, sunset, crewRoles (array of { "role", "names" }).

Section shapes:
{ "type": "schedule", "title": "...", "data": [ { "type": "row", "time": "...", "dur": "...", "task": "...", "loc": "...", "cast": "...", "note": "..." }, { "type": "span", "time": "...", "text": "..." } ] }
{ "type": "contacts", "title": "...", "data": [ { "role": "...", "name": "...", "phone": "..." } ] }
{ "type": "equipment", "title": "...", "data": [ { "text": "...", "done": false } ] }
{ "type": "hospital", "title": "...", "data": { "name": "...", "addr": "...", "phone": "...", "hours": "...", "dist": "..." } }
{ "type": "basecamp", "title": "...", "data": { "name": "...", "addr": "...", "parking": "...", "restroom": "...", "catering": "..." } }
{ "type": "notes", "title": "Notes", "data": { "text": "..." } }

Rules:
- Raw production text → interpret it into the current day: updateMeta plus setSections. Use mode "replace" when the existing sections are only placeholder/template text, otherwise "append" or targeted updateSection ops.
- Instructions → emit the minimal ops that accomplish them. "Add a day" or "add a second day" means addDay (never just changing meta.day on an existing day). Carry over meta that stays the same (company, project, client, crewRoles) when adding a day for the same production.
- Keep output SHORT: omit empty fields, only include sections that have content. Anything that fits nowhere goes into a notes section.

Memory rules:
- Whenever the input contains source material (chats, emails, notes), return "memory": an updated digest that REPLACES the old INTAKE MEMORY. Merge what the old memory said with what the new input adds. Max ~250 words; plain text bullets.
- Preserve: key decisions with their timestamp and source (e.g. "crew call 7:30 — WhatsApp 6/10 21:42"), unresolved questions, and anything mentioned but not yet placed on the sheet.
- Successive inputs are often one ongoing production conversation continuing across platforms (WhatsApp → email → notes). Reconcile them: when facts conflict, the most recent timestamp wins. If recency is unclear, keep both versions in memory and flag the conflict in "note".
- Do NOT duplicate facts already visible on the CURRENT SHEET into memory — the sheet is authoritative for published data. Memory carries provenance, pending items, and conflicts only.
- For pure instructions with no new source material, omit "memory" (the old one is kept).`;

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

// Snapshot of the whole sheet sent to Claude as context (logos/ids stripped).
function cleanMeta(meta = {}) {
  const m = {};
  for (const [k, v] of Object.entries(meta)) {
    if (k.startsWith('crew.')) continue;
    if (k === 'crewRoles') {
      m.crewRoles = (v || []).map(({ role, names }) => ({ role, names }));
      continue;
    }
    if (v) m[k] = v;
  }
  return m;
}

// Sentinel values from DEFAULT_DAY — if these are untouched, the day is still
// the placeholder template and its content is noise to the model.
function isPlaceholderDay(day) {
  const m = day.meta || {};
  return m.company === 'Company Name' && m.project === 'Project Title' && m.client === 'Client Name';
}

export function buildSheetContext() {
  const s = app.store;
  const curIdx = Math.max(0, s.days.findIndex(d => d.id === s.currentDayId));
  return {
    currentDay: curIdx + 1,
    dayCount: s.days.length,
    days: s.days.map((d, i) => {
      const isCurrent = i === curIdx;
      const placeholder = isPlaceholderDay(d);
      // Full section data only for the current, real day. Other days (and
      // untouched templates) are summarized — enough to target ops, a
      // fraction of the tokens.
      const sections = (d.sections || []).map(sec =>
        (isCurrent && !placeholder)
          ? { type: sec.type, title: sec.title, data: sec.data }
          : { type: sec.type, title: sec.title, rows: Array.isArray(sec.data) ? sec.data.length : undefined }
      );
      return {
        index: i + 1,
        isCurrent,
        ...(placeholder ? { placeholderTemplate: true } : {}),
        meta: placeholder ? {} : cleanMeta(d.meta),
        sections,
      };
    }),
  };
}

// Accept both the ops protocol and the legacy single-day shape.
export function normalizeToOps(parsed) {
  const memory = typeof parsed?.memory === 'string' ? parsed.memory : null;
  if (Array.isArray(parsed?.ops)) return { note: parsed.note || '', memory, ops: parsed.ops };
  const ops = [];
  if (parsed?.meta && Object.keys(parsed.meta).length) {
    ops.push({ op: 'updateMeta', day: 'current', meta: parsed.meta });
  }
  if (Array.isArray(parsed?.sections) && parsed.sections.length) {
    ops.push({ op: 'setSections', day: 'current', mode: 'append', sections: parsed.sections });
  }
  return { note: parsed?.note || '', memory, ops };
}

// ~150k tokens of input is well past anything a call sheet needs.
const MAX_INPUT_CHARS = 600000;

export async function runIntake(text) {
  if (!text) { alert('Paste some text first.'); return; }
  if (text.length > MAX_INPUT_CHARS) {
    intakeErrorSignal.value = `That paste is very large (${Math.round(text.length / 1000)}k characters). Split it into smaller chunks — earlier chunks are remembered, so you can paste them one after another.`;
    intakeStepSignal.value = 'error';
    return;
  }
  intakeStepSignal.value = 'loading';
  try {
    const memory = getIntakeMemory();
    const raw = await completeWithClaude(
      `--- CURRENT SHEET ---\n${JSON.stringify(buildSheetContext())}\n` +
      `--- INTAKE MEMORY (digest of earlier inputs) ---\n${memory || '(none yet)'}\n` +
      `--- USER INPUT ---\n${text}`,
      INTAKE_SYSTEM
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
        throw new Error('Could not parse model output. The response was likely truncated. Try pasting a smaller chunk, or break the input into parts. Original parse error: ' + e1.message);
      }
    }
    intakeDraft = normalizeToOps(parsed);
    if (!intakeDraft.ops.length && intakeDraft.memory == null && !intakeDraft.note) {
      throw new Error('Claude returned no changes. Try rephrasing the instruction or adding more detail.');
    }
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

function resolveDay(ref) {
  const s = app.store;
  if (ref == null || ref === 'current') {
    return s.days.find(d => d.id === s.currentDayId) || s.days[0];
  }
  const i = Number(ref);
  if (Number.isInteger(i) && i >= 1 && i <= s.days.length) return s.days[i - 1];
  throw new Error(`unknown day "${ref}"`);
}

function findSection(day, match) {
  const q = String(match || '').trim().toLowerCase();
  const sec = (day.sections || []).find(s =>
    (s.title || '').toLowerCase().includes(q) || s.type === q
  );
  if (!sec) throw new Error(`no section matching "${match}"`);
  return sec;
}

function freshSections(sections) {
  return (sections || []).map(s => ({ ...s, id: uid() }));
}

function applyOp(op) {
  switch (op.op) {
    case 'updateMeta': {
      const day = resolveDay(op.day);
      Object.assign(day.meta, op.meta || {});
      normalizeMultilineFields(day);
      break;
    }
    case 'setSections': {
      const day = resolveDay(op.day);
      const fresh = freshSections(op.sections);
      if (op.mode === 'replace') day.sections = fresh;
      else day.sections.push(...fresh);
      normalizeMultilineFields(day);
      break;
    }
    case 'updateSection': {
      const day = resolveDay(op.day);
      const sec = findSection(day, op.match);
      if (op.section?.title != null) sec.title = op.section.title;
      if (op.section?.data != null) sec.data = op.section.data;
      normalizeMultilineFields(day);
      break;
    }
    case 'removeSection': {
      const day = resolveDay(op.day);
      const sec = findSection(day, op.match);
      day.sections = day.sections.filter(s => s !== sec);
      break;
    }
    case 'addDay': {
      const current = app.state;
      const base = BLANK_DAY();
      const day = {
        ...base,
        meta: { ...base.meta, ...(op.meta || {}) },
        sections: op.sections?.length ? freshSections(op.sections) : base.sections,
        logos: (current?.logos || []).map(l => ({ ...l })),
      };
      normalizeMultilineFields(day);
      app.store.days.push(day);
      app.store.currentDayId = day.id;
      break;
    }
    case 'deleteDay': {
      if (app.store.days.length <= 1) throw new Error("can't delete the last day");
      const day = resolveDay(op.day);
      const i = app.store.days.indexOf(day);
      app.store.days.splice(i, 1);
      if (!app.store.days.some(d => d.id === app.store.currentDayId)) {
        app.store.currentDayId = app.store.days[Math.max(0, i - 1)].id;
      }
      break;
    }
    default:
      throw new Error(`unknown operation "${op.op}"`);
  }
}

export function publishIntake() {
  if (!intakeDraft) { resetIntake(); return; }
  const errors = [];
  for (const op of intakeDraft.ops || []) {
    try { applyOp(op); } catch (e) { errors.push(`${op.op}: ${e.message}`); }
  }
  // Memory is committed only on publish — a discarded draft leaves no trace.
  if (intakeDraft.memory != null) setIntakeMemory(intakeDraft.memory);
  save();
  renderSheet();
  resetIntake();
  if (errors.length) alert('Some changes could not be applied:\n' + errors.join('\n'));
}

export function setIntakeWidth(width, persist = true) {
  const px = Math.round(clamp(width, 200, 520));
  document.documentElement.style.setProperty('--intake-w', `${px}px`);
  if (persist) {
    try { localStorage.setItem(INTAKE_WIDTH_KEY, String(px)); } catch {}
  }
}
