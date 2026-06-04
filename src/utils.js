export const uid = () => Math.random().toString(36).slice(2, 9);

export const esc = s => (s == null ? '' : String(s))
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export function htmlToText(html) {
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

export function textToHTML(text) {
  const safe = esc(String(text || '').replace(/\r\n?/g, '\n'));
  return safe.replace(/\n/g, '<br>');
}

export function getEditableText(el, multiline = false) {
  return multiline ? htmlToText(el.innerHTML) : el.textContent;
}

export function setEditableText(el, value, multiline = false) {
  if (multiline) el.innerHTML = textToHTML(value);
  else el.textContent = value || '';
}

export function insertLineBreak() {
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

export function wireMultilineEditing(el) {
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

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function confirmDel(msg) {
  return confirm(msg);
}

export function parseTimeValue(value) {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const mins = Number(m[2]);
  if (hours > 23 || mins > 59) return null;
  return (hours * 60) + mins;
}

export function formatTimeValue(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return '';
  const minsInDay = 24 * 60;
  const safe = ((totalMinutes % minsInDay) + minsInDay) % minsInDay;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function parseDurationValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = text.match(/(\d+)\s*m/);
  const hours = hourMatch ? Math.round(Number(hourMatch[1]) * 60) : 0;
  const mins = minMatch ? Number(minMatch[1]) : 0;
  const total = hours + mins;
  return total > 0 ? total : null;
}
