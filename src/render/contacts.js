import { app, save } from '../store.js';
import { esc, confirmDel } from '../utils.js';
import { renderSections } from './sections.js';

export function renderContacts(sec, host) {
  host.innerHTML = `<div class="crew-grid-wrap"></div><div class="add-row"><button data-act="add">+ Add contact</button></div>`;
  const g = host.querySelector('.crew-grid-wrap');
  g.innerHTML = '<div class="crew-grid">' + sec.data.map((c, i) => `
    <div class="crew-row" data-i="${i}">
      <span class="crew-ctrls">
        <button data-act="up" data-i="${i}" title="Move up">↑</button>
        <button data-act="down" data-i="${i}" title="Move down">↓</button>
        <button class="rm" data-act="del" data-i="${i}" title="Delete">×</button>
      </span>
      <span class="role" contenteditable="true" data-f="role" data-i="${i}" data-placeholder="Role">${esc(c.role)}</span>
      <span class="name" contenteditable="true" data-f="name" data-i="${i}" data-placeholder="Name">${esc(c.name)}</span>
      <span class="phone" contenteditable="true" data-f="phone" data-i="${i}" data-placeholder="Phone / email">${esc(c.phone)}</span>
    </div>
  `).join('') + '</div>';

  g.querySelectorAll('[data-f]').forEach(el => {
    el.addEventListener('input', () => {
      sec.data[+el.dataset.i][el.dataset.f] = el.textContent;
      save();
    });
  });
  g.querySelectorAll('[data-act]').forEach(b =>
    b.addEventListener('click', () => {
      const i = +b.dataset.i, act = b.dataset.act;
      if (act === 'up' && i > 0) { const [r] = sec.data.splice(i, 1); sec.data.splice(i - 1, 0, r); }
      if (act === 'down' && i < sec.data.length - 1) { const [r] = sec.data.splice(i, 1); sec.data.splice(i + 1, 0, r); }
      if (act === 'del') { if (!confirmDel('Delete contact?')) return; sec.data.splice(i, 1); }
      save(); renderSections();
    })
  );
  host.querySelector('[data-act="add"]').addEventListener('click', () => {
    sec.data.push({ role:'', name:'', phone:'' }); save(); renderSections();
  });
}
