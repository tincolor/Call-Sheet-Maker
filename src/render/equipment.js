import { app, save } from '../store.js';
import { esc, confirmDel } from '../utils.js';
import { renderSections } from './sections.js';

export function renderEquipment(sec, host) {
  host.innerHTML = `<div class="equip-list"></div><div class="add-row"><button data-act="add">+ Add item</button></div>`;
  const list = host.querySelector('.equip-list');
  list.innerHTML = sec.data.map((item, i) => `
    <div class="chk ${item.done ? 'done' : ''}" data-i="${i}">
      <span class="box" data-act="toggle" data-i="${i}"></span>
      <span class="txt" contenteditable="true" data-f="text" data-i="${i}" data-placeholder="Item">${esc(item.text)}</span>
      <span class="row-ctrls">
        <button data-act="up" data-i="${i}" title="Move up">↑</button>
        <button data-act="down" data-i="${i}" title="Move down">↓</button>
        <button class="rm" data-act="del" data-i="${i}" title="Delete">×</button>
      </span>
    </div>
  `).join('');

  list.querySelectorAll('[data-f="text"]').forEach(el =>
    el.addEventListener('input', () => { sec.data[+el.dataset.i].text = el.textContent; save(); })
  );
  list.querySelectorAll('[data-act="toggle"]').forEach(el =>
    el.addEventListener('click', () => {
      sec.data[+el.dataset.i].done = !sec.data[+el.dataset.i].done; save(); renderSections();
    })
  );
  list.querySelectorAll('.row-ctrls button').forEach(b =>
    b.addEventListener('click', () => {
      const i = +b.dataset.i, act = b.dataset.act;
      if (act === 'up' && i > 0) { const [r] = sec.data.splice(i, 1); sec.data.splice(i - 1, 0, r); }
      if (act === 'down' && i < sec.data.length - 1) { const [r] = sec.data.splice(i, 1); sec.data.splice(i + 1, 0, r); }
      if (act === 'del') { if (!confirmDel('Delete item?')) return; sec.data.splice(i, 1); }
      save(); renderSections();
    })
  );
  host.querySelector('[data-act="add"]').addEventListener('click', () => {
    sec.data.push({ text:'', done:false }); save(); renderSections();
  });
}
