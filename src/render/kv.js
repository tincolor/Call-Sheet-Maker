import { save } from '../store.js';
import { esc } from '../utils.js';

export function renderKV(sec, host, fields) {
  host.innerHTML = `<div class="kv-grid">${fields.map(([k, lbl]) => `
    <div class="k">${esc(lbl)}</div>
    <div class="v" contenteditable="true" data-f="${k}" data-placeholder="—">${esc(sec.data[k] || '')}</div>
  `).join('')}</div>`;
  host.querySelectorAll('[data-f]').forEach(el =>
    el.addEventListener('input', () => { sec.data[el.dataset.f] = el.textContent; save(); })
  );
}
