import { app, save } from '../store.js';
import { uid, esc, confirmDel } from '../utils.js';
import { drag } from './drag.js';
import { adjustSectionBreakSpacing } from './reflow.js';
import { renderSchedule } from './schedule.js';
import { renderContacts } from './contacts.js';
import { renderEquipment } from './equipment.js';
import { renderKV } from './kv.js';
import { renderNotes } from './notes.js';

export function renderSections() {
  const host = document.getElementById('sectionsHost');
  if (!host) return;
  host.innerHTML = '';

  // page break BEFORE first section slot
  host.appendChild(pageBreakSlot({ before: app.state.sections[0]?.id || '__end__' }, 0));

  app.state.sections.forEach((sec, idx) => {
    const secEl = renderSection(sec, idx);
    // after-break stays on the section; adjustSectionBreakSpacing() pushes it to
    // the correct page boundary on screen. Print uses break-before: page directly.
    host.appendChild(secEl);
    const nextId = app.state.sections[idx + 1]?.id || '__end__';
    host.appendChild(pageBreakSlot({ before: nextId }, idx + 1));
  });

  // Push after-break sections to the right page boundary in the screen preview
  requestAnimationFrame(adjustSectionBreakSpacing);

  host.querySelectorAll('[data-sec-act]').forEach(b =>
    b.addEventListener('click', () => sectionAction(b.dataset.secAct, b.dataset.secId))
  );
}

export function renderSection(sec, idx) {
  const el = document.createElement('div');
  el.className = 'section section--' + sec.type;
  el.dataset.id = sec.id;

  const breakMarker = app.state.pageBreaks.find(p => p.before === sec.id);
  if (breakMarker) el.classList.add('after-break');

  const nth = String(idx + 1).padStart(2, '0');

  el.innerHTML = `
    <div class="section-head">
      <h3>
        <span class="num">${nth}</span>
        <span class="title" contenteditable="true" data-placeholder="Section title">${esc(sec.title)}</span>
      </h3>
      <div class="sec-ctrls">
        <button class="drag-handle sec-drag-handle" title="Drag to reorder section">⠿</button>
        <button data-sec-act="up"    data-sec-id="${sec.id}" title="Move up">↑</button>
        <button data-sec-act="down"  data-sec-id="${sec.id}" title="Move down">↓</button>
        <button data-sec-act="del"   data-sec-id="${sec.id}" title="Delete section">✕</button>
      </div>
    </div>
    <div class="section-body"></div>
  `;

  const titleEl = el.querySelector('.title');
  titleEl.addEventListener('blur', () => { sec.title = titleEl.textContent; save(); });

  // section drag-and-drop
  const dragHandle = el.querySelector('.sec-drag-handle');
  dragHandle.addEventListener('mousedown', () => { el.draggable = true; });
  el.addEventListener('dragend', () => {
    el.draggable = false; el.classList.remove('dragging'); drag.current = null;
    document.querySelectorAll('.section.drag-over').forEach(s => s.classList.remove('drag-over'));
  });
  el.addEventListener('dragstart', e => {
    if (!el.draggable) { e.preventDefault(); return; }
    drag.current = { type: 'section', id: sec.id };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sec.id);
    el.classList.add('dragging');
  });
  el.addEventListener('dragover', e => {
    if (drag.current?.type !== 'section' || drag.current.id === sec.id) return;
    e.preventDefault();
    document.querySelectorAll('.section.drag-over').forEach(s => s.classList.remove('drag-over'));
    el.classList.add('drag-over');
  });
  el.addEventListener('drop', e => {
    e.preventDefault(); el.classList.remove('drag-over');
    if (!drag.current || drag.current.type !== 'section') return;
    const fromIdx = app.state.sections.findIndex(s => s.id === drag.current.id);
    const toIdx   = app.state.sections.findIndex(s => s.id === sec.id);
    drag.current = null;
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = app.state.sections.splice(fromIdx, 1);
    app.state.sections.splice(toIdx, 0, moved);
    save(); renderSections();
  });

  // If this schedule section has any row-level page breaks, allow break-inside
  if (sec.type === 'schedule') {
    const hasRowBreaks = app.state.pageBreaks.some(b => b.beforeRow && b.beforeRow.sectionId === sec.id);
    if (hasRowBreaks) el.classList.add('has-row-break');
  }

  const body = el.querySelector('.section-body');
  if (sec.type === 'schedule')   renderSchedule(sec, body);
  if (sec.type === 'contacts')   renderContacts(sec, body);
  if (sec.type === 'equipment')  renderEquipment(sec, body);
  if (sec.type === 'hospital')   renderKV(sec, body, [
    ['name','Name'],['addr','Address'],['phone','Phone'],['hours','Hours'],['dist','Dist.']
  ]);
  if (sec.type === 'basecamp')   renderKV(sec, body, [
    ['name','Basecamp'],['addr','Address'],['parking','Parking'],['restroom','Restroom'],['catering','Catering']
  ]);
  if (sec.type === 'notes')      renderNotes(sec, body);

  return el;
}

export function addSection(type) {
  const blank = { id: uid(), type, title: type[0].toUpperCase() + type.slice(1) };
  if (type === 'schedule')  blank.data = [];
  if (type === 'contacts')  blank.data = [];
  if (type === 'equipment') blank.data = [];
  if (type === 'hospital')  blank.data = { name:'', addr:'', phone:'', hours:'', dist:'' };
  if (type === 'basecamp')  blank.data = { name:'', addr:'', parking:'', restroom:'', catering:'' };
  if (type === 'notes')     blank.data = { text:'' };
  app.state.sections.push(blank);
  save(); renderSections();
}

function sectionAction(act, id) {
  const i = app.state.sections.findIndex(s => s.id === id);
  if (i < 0) return;
  if (act === 'up' && i > 0) { const [s] = app.state.sections.splice(i, 1); app.state.sections.splice(i - 1, 0, s); }
  if (act === 'down' && i < app.state.sections.length - 1) { const [s] = app.state.sections.splice(i, 1); app.state.sections.splice(i + 1, 0, s); }
  if (act === 'del') {
    if (!confirmDel('Delete this section?')) return;
    app.state.sections.splice(i, 1);
    // also clean any page breaks that referenced this section
    app.state.pageBreaks = app.state.pageBreaks.filter(p => p.before !== id);
  }
  save(); renderSections();
}

export function pageBreakSlot(ref, _idx) {
  const wrap = document.createElement('div');
  const has = app.state.pageBreaks.some(p => p.before === ref.before);
  wrap.className = 'pbreak-slot' + (has ? ' is-break' : '');
  if (has) {
    wrap.innerHTML = `<div class="pbreak-marker"><span>PAGE BREAK</span><button class="pbreak-rm">✕ remove</button></div>`;
    wrap.querySelector('.pbreak-rm').addEventListener('click', () => {
      app.state.pageBreaks = app.state.pageBreaks.filter(p => p.before !== ref.before);
      save(); renderSections();
    });
  } else {
    wrap.innerHTML = `<button class="pbreak-add" title="Insert page break">＋ insert page break</button>`;
    wrap.querySelector('.pbreak-add').addEventListener('click', () => {
      app.state.pageBreaks.push({ before: ref.before });
      save(); renderSections();
    });
  }
  return wrap;
}
