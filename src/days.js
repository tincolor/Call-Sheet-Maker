import { app, save } from './store.js';
import { uid, esc } from './utils.js';
import { BLANK_DAY } from './data.js';
import { renderSheet } from './render/sheet.js';

export function renderDaySwitcher() {
  const host = document.getElementById('daySwitcher');
  if (!host) return;
  host.innerHTML = '';
  app.store.days.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.className = 'day-btn' + (d.id === app.store.currentDayId ? ' active' : '');
    const label = (d.meta?.date || '').trim() || `Day ${d.meta?.day || (i+1)}`;
    const sub = d.meta?.day ? `Day ${d.meta.day}` : '';
    btn.innerHTML = `<span class="day-btn-top">${esc(label)}</span>${sub && sub !== label ? `<span class="day-btn-sub">${esc(sub)}</span>` : ''}`;
    btn.addEventListener('click', () => switchDay(d.id));
    host.appendChild(btn);
  });
  const add = document.createElement('button');
  add.className = 'day-btn day-add';
  add.innerHTML = '+';
  add.title = 'Add a new day';
  add.addEventListener('click', newDay);
  host.appendChild(add);
}

export function switchDay(id) {
  if (!app.store.days.find(d => d.id === id)) return;
  app.store.currentDayId = id;
  save();
  renderSheet();
  renderDaySwitcher();
}

export function newDay() {
  const choice = prompt('New day:\n  1 = Blank day\n  2 = Duplicate current day (schedule cleared)\n  3 = Duplicate current day (full copy)', '2');
  if (!choice) return;
  let d;
  if (choice === '1') d = BLANK_DAY();
  else if (choice === '2' || choice === '3') {
    d = JSON.parse(JSON.stringify(app.state));
    d.id = uid();
    d.sections = d.sections.map(s => ({ ...s, id: uid(), data: Array.isArray(s.data) ? s.data.map(r => ({...r})) : {...s.data} }));
    d.pageBreaks = [];
    if (d.meta) d.meta.headerNote = '';
    if (choice === '2') {
      // clear schedule rows but keep everything else
      d.sections.forEach(s => { if (s.type === 'schedule') s.data = []; });
      if (d.meta) {
        d.meta.date = '';
        d.meta.day = String((parseInt(app.state.meta?.day) || 0) + 1 || '');
      }
    }
  } else return;
  app.store.days.push(d);
  app.store.currentDayId = d.id;
  save(); renderSheet(); renderDaySwitcher();
}

export function deleteDay() {
  if (app.store.days.length <= 1) { alert('Can\'t delete the last day.'); return; }
  const label = (app.state.meta?.date || '').trim() || `Day ${app.state.meta?.day || ''}`;
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
  const i = app.store.days.findIndex(d => d.id === app.store.currentDayId);
  app.store.days.splice(i, 1);
  app.store.currentDayId = app.store.days[Math.max(0, i - 1)].id;
  save(); renderSheet(); renderDaySwitcher();
}

export function renameDay() {
  const cur = app.state.meta?.date || '';
  const next = prompt('Day label (date or short name):', cur);
  if (next == null) return;
  app.state.meta.date = next;
  save(); renderSheet(); renderDaySwitcher();
}
