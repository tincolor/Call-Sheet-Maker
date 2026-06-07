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

let activeConfirm = null;

function getAnchorEl(anchor) {
  if (!anchor) return null;
  if (anchor.currentTarget) return anchor.currentTarget;
  if (anchor.target) return anchor.target;
  return anchor;
}

export function confirmPopover(anchor, message, options = {}) {
  closeConfirmPopover(false);

  const anchorEl = getAnchorEl(anchor);
  const pop = document.createElement('div');
  pop.className = 'confirm-popover';
  pop.innerHTML = `
    <div class="confirm-popover-msg"></div>
    <div class="confirm-popover-actions">
      <button type="button" class="confirm-popover-cancel"></button>
      <button type="button" class="confirm-popover-ok"></button>
    </div>
  `;
  pop.querySelector('.confirm-popover-msg').textContent = message;
  pop.querySelector('.confirm-popover-cancel').textContent = options.cancelText || 'Cancel';
  pop.querySelector('.confirm-popover-ok').textContent = options.confirmText || 'Confirm';
  document.body.appendChild(pop);

  const place = () => {
    const rect = anchorEl?.getBoundingClientRect?.() || {
      left: window.innerWidth / 2,
      right: window.innerWidth / 2,
      bottom: window.innerHeight / 2,
    };
    const popRect = pop.getBoundingClientRect();
    const margin = 8;
    const centeredLeft = rect.left + (rect.width || 0) / 2 - popRect.width / 2;
    const left = clamp(centeredLeft + window.scrollX, margin + window.scrollX, window.scrollX + window.innerWidth - popRect.width - margin);
    const top = rect.bottom + window.scrollY + 8;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  };

  requestAnimationFrame(place);

  return new Promise(resolve => {
    const cleanup = (result) => {
      if (activeConfirm !== cleanup) return;
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', place);
      pop.remove();
      activeConfirm = null;
      resolve(result);
    };

    const onDocPointer = (e) => {
      if (pop.contains(e.target) || anchorEl?.contains?.(e.target)) return;
      cleanup(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') cleanup(false);
    };

    activeConfirm = cleanup;
    pop.querySelector('.confirm-popover-cancel').addEventListener('click', () => cleanup(false));
    pop.querySelector('.confirm-popover-ok').addEventListener('click', () => cleanup(true));
    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', place);
  });
}

export function closeConfirmPopover(result = false) {
  if (activeConfirm) activeConfirm(result);
}

export function confirmDel(msg, anchor) {
  return confirmPopover(anchor, msg, { confirmText: 'Delete' });
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
