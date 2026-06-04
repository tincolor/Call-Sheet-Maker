// ============================================================
// SHARED UTILITIES & CONSTANTS MODULE
// ============================================================

const CS_KEY = 'callsheet.app.v2';
const CS_KEY_V1 = 'callsheet.app.v1';
const INTAKE_WIDTH_KEY = 'callsheet.intakeWidth';
const API_KEY_STORAGE = 'callsheet.claudeApiKey';
const API_MODEL_STORAGE = 'callsheet.claudeApiModel';

const uid = () => Math.random().toString(36).slice(2, 9);

const MULTILINE_META_KEYS = new Set([
  'company',
  'address',
  'project',
  'client',
  'mainLocation',
  'emergency',
  'weatherCallout',
  'headerNote',
]);

const esc = s => (s == null ? '' : String(s))
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function confirmDel(msg) { return confirm(msg); }

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ---- Text & HTML Editing Helpers ----
function htmlToText(html) {
  return String(html || '')
    .replace(/<div><br><\/div>/gi, '\n')
    .replace(/<\/div>\s*<div>/gi, '\n')
    .replace(/<div>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function textToHTML(text) {
  const safe = esc(String(text || '').replace(/\r\n?/g, '\n'));
  return safe.replace(/\n/g, '<br>');
}

function getEditableText(el, multiline = false) {
  return multiline ? htmlToText(el.innerHTML) : el.textContent;
}

function setEditableText(el, value, multiline = false) {
  if (multiline) el.innerHTML = textToHTML(value);
  else el.textContent = value || '';
}

function insertLineBreak() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const br = document.createElement('br');
  range.insertNode(br);
  range.setStartAfter(br);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function wireMultilineEditing(el) {
  if (el.dataset.multilineWired) return;
  el.dataset.multilineWired = '1';
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertLineBreak();
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

// ---- Time & Duration Helpers ----
function parseTimeValue(value) {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const mins = Number(m[2]);
  if (hours > 23 || mins > 59) return null;
  return (hours * 60) + mins;
}

function formatTimeValue(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return '';
  const minsInDay = 24 * 60;
  const safe = ((totalMinutes % minsInDay) + minsInDay) % minsInDay;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function parseDurationValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = text.match(/(\d+)\s*m/);
  const hours = hourMatch ? Math.round(Number(hourMatch[1]) * 60) : 0;
  const mins = minMatch ? Number(minMatch[1]) : 0;
  const total = hours + mins;
  return total > 0 ? total : null;
}

function recalculateScheduleTimes(sec, startIndex = 1) {
  for (let i = Math.max(1, startIndex); i < sec.data.length; i++) {
    const prev = sec.data[i - 1];
    const cur = sec.data[i];
    const prevTime = parseTimeValue(prev?.time);
    const prevDur = parseDurationValue(prev?.dur);
    if (prevTime == null || prevDur == null || !cur) continue;
    cur.time = formatTimeValue(prevTime + prevDur);
  }
}

function syncScheduleTimeCells(tb, sec, startIndex = 1) {
  for (let i = Math.max(1, startIndex); i < sec.data.length; i++) {
    const el = tb.querySelector(`[data-f="time"][data-i="${i}"]`);
    if (el) el.textContent = sec.data[i].time || '';
  }
}
