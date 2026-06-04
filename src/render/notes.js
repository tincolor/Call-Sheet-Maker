import { save } from '../store.js';
import { textToHTML, getEditableText, wireMultilineEditing } from '../utils.js';

export function renderNotes(sec, host) {
  host.innerHTML = `<div class="notes-block" contenteditable="true" data-placeholder="Notes…">${textToHTML(sec.data.text || '')}</div>`;
  const el = host.querySelector('.notes-block');
  wireMultilineEditing(el);
  el.addEventListener('input', () => { sec.data.text = getEditableText(el, true); save(); });
}
