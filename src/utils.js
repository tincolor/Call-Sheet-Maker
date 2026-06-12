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
      top: window.innerHeight / 2,
      bottom: window.innerHeight / 2,
    };
    const popRect = pop.getBoundingClientRect();
    const margin = 8;
    const centeredLeft = rect.left + (rect.width || 0) / 2 - popRect.width / 2;
    const left = clamp(centeredLeft + window.scrollX, margin + window.scrollX, window.scrollX + window.innerWidth - popRect.width - margin);
    const fitsBelow = rect.bottom + popRect.height + margin < window.innerHeight;
    const above = !fitsBelow;
    const top = above
      ? rect.top + window.scrollY - popRect.height - 8
      : rect.bottom + window.scrollY + 8;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.classList.toggle('confirm-popover--above', above);
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

// Forgiving time-of-day parser: "1430", "730", "14:30", "2:30 pm",
// "2:30pm", "2pm", "14". Returns minutes since midnight, or null if the
// text isn't a time (so free text like "TBD" passes through untouched).
export function parseFlexibleTime(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const m = text.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?\.?$/);
  if (!m) return null;
  let hours = Number(m[1]);
  const mins = m[2] != null ? Number(m[2]) : 0;
  if (m[3] === 'pm' && hours < 12) hours += 12;
  if (m[3] === 'am' && hours === 12) hours = 0;
  if (hours > 23 || mins > 59) return null;
  return (hours * 60) + mins;
}

export function parseDurationValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  // H:MM
  const hm = text.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    const total = Number(hm[1]) * 60 + Number(hm[2]);
    return total > 0 ? total : null;
  }
  // explicit units — "2h", "30m", "1h30m", "1 hour 30 minutes"
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*m/);
  if (hourMatch || minMatch) {
    const total = Math.round(
      (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minMatch ? Number(minMatch[1]) : 0)
    );
    return total > 0 ? total : null;
  }
  // bare number: 9 and up reads as minutes, 8 and below as hours
  const num = text.match(/^(\d+(?:\.\d+)?)$/);
  if (num) {
    const n = Number(num[1]);
    const total = Math.round(n >= 9 ? n : n * 60);
    return total > 0 ? total : null;
  }
  return null;
}

export function formatDurationValue(total) {
  if (total == null || total <= 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h && m ? `${h}h${m}m` : h ? `${h}h` : `${m}m`;
}
