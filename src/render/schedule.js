import { app, save } from '../store.js';
import { esc, confirmDel, parseTimeValue, formatTimeValue, parseDurationValue } from '../utils.js';
import { drag } from './drag.js';
import { renderSections } from './sections.js';

export function recalculateScheduleTimes(sec, startIndex = 1) {
  for (let i = Math.max(1, startIndex); i < sec.data.length; i++) {
    const prev = sec.data[i - 1];
    const cur = sec.data[i];
    const prevTime = parseTimeValue(prev?.time);
    const prevDur = parseDurationValue(prev?.dur);
    if (prevTime == null || prevDur == null || !cur) continue;
    cur.time = formatTimeValue(prevTime + prevDur);
  }
}

export function syncScheduleTimeCells(tb, sec, startIndex = 1) {
  for (let i = Math.max(1, startIndex); i < sec.data.length; i++) {
    const el = tb.querySelector(`[data-f="time"][data-i="${i}"]`);
    if (el) el.textContent = sec.data[i].time || '';
  }
}

export function togglePageBreakRow(sectionId, idx) {
  const ex = app.state.pageBreaks.findIndex(p => p.beforeRow && p.beforeRow.sectionId === sectionId && p.beforeRow.idx === idx);
  if (ex >= 0) app.state.pageBreaks.splice(ex, 1);
  else app.state.pageBreaks.push({ beforeRow: { sectionId, idx } });
}

export function renderSchedule(sec, host) {
  host.innerHTML = '';

  // Split data into segments at every page-break point
  const brkIdxs = app.state.pageBreaks
    .filter(b => b.beforeRow && b.beforeRow.sectionId === sec.id)
    .map(b => b.beforeRow.idx)
    .sort((a, b) => a - b);

  const segs = [];
  let from = 0;
  for (const bi of brkIdxs) { segs.push({ rows: sec.data.slice(from, bi), start: from }); from = bi; }
  segs.push({ rows: sec.data.slice(from), start: from });

  const THEAD = `<thead><tr>
    <th class="time">Time</th><th class="task">Task</th>
    <th class="loc">Location</th><th class="cast">Cast / Extras</th>
    <th class="note">Notes</th>
  </tr></thead>`;

  segs.forEach((seg, segIdx) => {
    const isLast = segIdx === segs.length - 1;

    // Between segments: page-break wrapper with white space + "Continued" heading
    if (segIdx > 0) {
      const breakRowIdx = seg.start;
      const isAuto = !!app.state.pageBreaks.find(b => b.auto && b.beforeRow && b.beforeRow.sectionId === sec.id && b.beforeRow.idx === breakRowIdx);
      const wrap = document.createElement('div');
      wrap.className = 'sched-cont-wrap';
      // Screen-only bar — built via DOM so the Remove button keeps its listener
      const bar = document.createElement('div');
      bar.className = 'brk-bar';
      const barLabel = document.createElement('span');
      barLabel.textContent = isAuto ? 'Page Break (auto)' : 'Page Break';
      const rmBtn = document.createElement('button');
      rmBtn.className = 'brk-remove';
      rmBtn.textContent = 'Remove';
      rmBtn.addEventListener('click', () => {
        app.state.pageBreaks = app.state.pageBreaks.filter(b =>
          !(b.beforeRow && b.beforeRow.sectionId === sec.id && b.beforeRow.idx === breakRowIdx)
        );
        if (isAuto) {
          // Pin this row so autoReflow won't re-insert the break immediately
          if (!app.state.noBreakPins) app.state.noBreakPins = [];
          if (!app.state.noBreakPins.some(p => p.sectionId === sec.id && p.idx === breakRowIdx))
            app.state.noBreakPins.push({ sectionId: sec.id, idx: breakRowIdx });
        }
        save(); renderSections();
      });
      bar.appendChild(barLabel);
      bar.appendChild(rmBtn);
      const content = document.createElement('div');
      content.className = 'sched-cont-content';
      const titleEl = document.createElement('div');
      titleEl.className = 'sched-cont-title';
      titleEl.textContent = sec.title;
      const subEl = document.createElement('div');
      subEl.className = 'sched-cont-subtitle';
      subEl.textContent = 'Continued from previous page.';
      content.appendChild(titleEl);
      content.appendChild(subEl);
      wrap.appendChild(bar);    // bar sits at the break boundary, before the white space
      wrap.appendChild(content); // content has the padding-top white space
      host.appendChild(wrap);
    }

    // Table for this segment
    const tbl = document.createElement('table');
    tbl.className = 'sched';
    tbl.innerHTML = THEAD + '<tbody></tbody>';
    const tb = tbl.querySelector('tbody');

    seg.rows.forEach((r, li) => {
      const gi = seg.start + li; // global index into sec.data
      const tr = document.createElement('tr');
      const rc = `<button class="drag-handle row-drag-handle" title="Drag to reorder">⠿</button><button data-act="up" data-i="${gi}">↑</button><button data-act="down" data-i="${gi}">↓</button><button data-act="brk" data-i="${gi}" title="Page break before">⤓</button><button data-act="del" data-i="${gi}">×</button>`;
      if (r.type === 'span') {
        tr.className = 'span';
        tr.innerHTML = `<td class="time"><div class="row-controls">${rc}</div>
          <span contenteditable="true" data-f="time" data-i="${gi}">${esc(r.time)}</span>
          <span class="dur" contenteditable="true" data-f="dur" data-i="${gi}">${esc(r.dur)}</span></td>
          <td class="spanned" colspan="4" contenteditable="true" data-f="text" data-i="${gi}"><b>${esc(r.text||'')}</b></td>`;
      } else {
        tr.innerHTML = `<td class="time"><div class="row-controls">${rc}</div>
          <span contenteditable="true" data-f="time" data-i="${gi}" data-placeholder="00:00">${esc(r.time)}</span>
          <span class="dur" contenteditable="true" data-f="dur" data-i="${gi}" data-placeholder="dur">${esc(r.dur)}</span></td>
          <td class="task" contenteditable="true" data-f="task" data-i="${gi}" data-placeholder="Task">${esc(r.task)}</td>
          <td class="loc"  contenteditable="true" data-f="loc"  data-i="${gi}" data-placeholder="Location / address">${esc(r.loc)}</td>
          <td class="cast" contenteditable="true" data-f="cast" data-i="${gi}" data-placeholder="Cast / extras">${esc(r.cast)}</td>
          <td class="note" contenteditable="true" data-f="note" data-i="${gi}" data-placeholder="Notes">${esc(r.note)}</td>`;
      }
      // Drag-and-drop
      const dh = tr.querySelector('.row-drag-handle');
      if (dh) {
        dh.addEventListener('mousedown', () => { tr.draggable = true; });
        tr.addEventListener('dragstart', e => {
          if (!tr.draggable) { e.preventDefault(); return; }
          drag.current = { type: 'row', secId: sec.id, idx: gi };
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(gi));
          tr.classList.add('dragging');
        });
        tr.addEventListener('dragend', () => {
          tr.draggable = false; tr.classList.remove('dragging');
          host.querySelectorAll('tr.drag-over').forEach(r => r.classList.remove('drag-over'));
        });
        tr.addEventListener('dragover', e => {
          if (drag.current?.type !== 'row' || drag.current.secId !== sec.id) return;
          e.preventDefault(); e.dataTransfer.dropEffect = 'move';
          host.querySelectorAll('tr.drag-over').forEach(r => r.classList.remove('drag-over'));
          tr.classList.add('drag-over');
        });
        tr.addEventListener('drop', e => {
          e.preventDefault(); tr.classList.remove('drag-over');
          if (!drag.current || drag.current.type !== 'row' || drag.current.secId !== sec.id) return;
          const f2 = drag.current.idx, t2 = gi; drag.current = null;
          if (f2 === t2) return;
          const [mv] = sec.data.splice(f2, 1); sec.data.splice(t2, 0, mv);
          recalculateScheduleTimes(sec, Math.min(f2, t2));
          save(); renderSections();
        });
      }
      tb.appendChild(tr);
    });

    // "Continued on next page." footer for non-last segments
    if (!isLast) {
      const ft = document.createElement('tr');
      ft.className = 'sched-page-footer';
      ft.innerHTML = `<td colspan="5">Continued on next page.</td>`;
      tb.appendChild(ft);
    }

    host.appendChild(tbl);

    // Wire contenteditable input events
    tbl.querySelectorAll('[data-f]').forEach(el => {
      el.addEventListener('input', () => {
        const ii = +el.dataset.i, f = el.dataset.f;
        sec.data[ii][f] = el.textContent;
        if (f === 'time' || f === 'dur') {
          recalculateScheduleTimes(sec, ii + 1);
          // Sync time cells across all table segments
          host.querySelectorAll('[data-f="time"]').forEach(ce => {
            const ci = +ce.dataset.i;
            if (ci >= ii + 1 && sec.data[ci]) ce.textContent = sec.data[ci].time || '';
          });
        }
        save();
      });
    });

    // Wire button click events
    tbl.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ii = +btn.dataset.i, act = btn.dataset.act;
        if (act === 'up' && ii > 0) { const [r] = sec.data.splice(ii, 1); sec.data.splice(ii-1, 0, r); recalculateScheduleTimes(sec, ii); }
        if (act === 'down' && ii < sec.data.length-1) { const [r] = sec.data.splice(ii, 1); sec.data.splice(ii+1, 0, r); recalculateScheduleTimes(sec, ii); }
        if (act === 'del') {
          if (!confirmDel('Delete row?')) return;
          sec.data.splice(ii, 1);
          app.state.pageBreaks = app.state.pageBreaks.filter(p => !(p.beforeRow && p.beforeRow.sectionId === sec.id && p.beforeRow.idx === ii));
          recalculateScheduleTimes(sec, ii);
        }
        if (act === 'brk') { togglePageBreakRow(sec.id, ii); }
        save(); renderSections();
      });
    });
  });

  // Add row / add span buttons (after all segments)
  const addDiv = document.createElement('div');
  addDiv.className = 'add-row';
  addDiv.innerHTML = `<button data-act="addRow">+ Add row</button><button data-act="addSpan">+ Add spanning row (travel / wrap)</button>`;
  addDiv.querySelector('[data-act="addRow"]').addEventListener('click', () => {
    sec.data.push({ type:'row', time:'', dur:'', task:'', loc:'', cast:'', note:'' });
    recalculateScheduleTimes(sec, sec.data.length - 1);
    save(); renderSections();
  });
  addDiv.querySelector('[data-act="addSpan"]').addEventListener('click', () => {
    sec.data.push({ type:'span', time:'', dur:'', text:'' });
    recalculateScheduleTimes(sec, sec.data.length - 1);
    save(); renderSections();
  });
  host.appendChild(addDiv);
}
