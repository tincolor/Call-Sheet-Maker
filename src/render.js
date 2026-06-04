// ============================================================
// DOM RENDERING MODULE
// ============================================================

function renderSheet() {
  renderHeader();
  renderLogos();
  renderSections();
  applyTweaks();
  renderDaySwitcher();
  // After layout settles, auto-calculate page breaks for schedule sections
  if (!_reflowing) requestAnimationFrame(autoReflow);
}

function renderHeader() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    const v = state.meta[k];
    const multiline = MULTILINE_META_KEYS.has(k);
    setEditableText(el, v ?? '', multiline);
    if (multiline) wireMultilineEditing(el);
    if (el.dataset.wired) return;
    el.dataset.wired = '1';
    const commit = () => {
      state.meta[k] = getEditableText(el, multiline);
      save();
    };
    el.addEventListener('input', commit);
    el.addEventListener('blur',  commit);
  });
}

function renderLogos() {
  const wrap = document.getElementById('logoSlot');
  wrap.innerHTML = '';
  state.logos.forEach((logo, i) => {
    const box = document.createElement('div');
    box.className = 'logo-item';
    if (logo.dataUrl) {
      box.innerHTML = `
        <img src="${esc(logo.dataUrl)}" alt="${esc(logo.label)}" class="logo-img" />
        <div class="logo-label" contenteditable="true" data-placeholder="Label">${esc(logo.label)}</div>
        <div class="logo-ctrls">
          <button data-act="replace" data-i="${i}" title="Replace image">⟳</button>
          <button data-act="remove"  data-i="${i}" title="Remove">×</button>
        </div>
      `;
    } else {
      box.innerHTML = `
        <button class="logo-upload" data-act="upload" data-i="${i}">+ upload image</button>
        <div class="logo-label" contenteditable="true" data-placeholder="Label">${esc(logo.label)}</div>
        <div class="logo-ctrls">
          <button data-act="remove" data-i="${i}" title="Remove">×</button>
        </div>
      `;
    }
    wrap.appendChild(box);
    if (i < state.logos.length - 1) {
      const rule = document.createElement('div');
      rule.className = 'logo-rule';
      wrap.appendChild(rule);
    }
  });
  // add logo button
  const add = document.createElement('button');
  add.className = 'logo-add';
  add.textContent = '+ Add logo';
  add.addEventListener('click', () => {
    state.logos.push({ label: '', dataUrl: '' });
    save(); renderLogos();
  });
  wrap.appendChild(add);

  wrap.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', e => handleLogoAction(btn.dataset.act, +btn.dataset.i));
  });
  wrap.querySelectorAll('.logo-label').forEach((el, i) => {
    el.addEventListener('blur', () => {
      state.logos[i].label = el.textContent;
      save();
    });
  });
}

function handleLogoAction(act, i) {
  if (act === 'remove') {
    if (!confirmDel('Remove this logo?')) return;
    state.logos.splice(i, 1);
    save(); renderLogos();
    return;
  }
  if (act === 'upload' || act === 'replace') {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { state.logos[i].dataUrl = fr.result; save(); renderLogos(); };
      fr.readAsDataURL(f);
    };
    inp.click();
  }
}

function buildPageHeaderRepeat() {
  const m = state.meta;
  const el = document.createElement('div');
  el.className = 'page-header-repeat';
  el.innerHTML = `
    <div class="hd">
      <div class="hd-company">
        <div class="name">${esc(m.company || '')}</div>
        <div class="addr">${esc(m.address || '')}</div>
        <div style="flex:1"></div>
        <div class="hd-crew">
          ${m['crew.lp']      ? `<div><span class="role">Producer :</span><span>${esc(m['crew.lp'])}</span></div>` : ''}
          ${m['crew.usprod']  ? `<div><span class="role">US Producer :</span><span>${esc(m['crew.usprod'])}</span></div>` : ''}
          ${m['crew.director']? `<div><span class="role">Director :</span><span>${esc(m['crew.director'])}</span></div>` : ''}
          ${m['crew.dop']     ? `<div><span class="role">DOP :</span><span>${esc(m['crew.dop'])}</span></div>` : ''}
        </div>
      </div>
      <div class="hd-crew" style="display:flex;flex-direction:column;gap:10px;padding:10px 12px;">
        <div><div class="lbl">Project</div><div style="font-weight:700;margin-top:3px;font-size:15px;letter-spacing:-0.01em;">${esc(m.project || '')}</div></div>
        <div><div class="lbl">Client</div><div style="margin-top:2px;font-weight:500;">${esc(m.client || '')}</div></div>
        <div><div class="lbl">Location</div><div style="margin-top:2px;">${esc(m.mainLocation || '')}</div></div>
      </div>
      <div class="hd-title">
        <div class="title-row">CALL SHEET</div>
        <div class="kv"><div class="k">Date</div><div class="v">${esc(m.date || '')}</div></div>
        <div class="kv"><div class="k">Day</div><div class="v">${esc(m.day || '')}</div></div>
        <div class="shoot-call">
          <span class="lbl">Shoot Call</span>
          <span class="time">${esc(m.shootCall || '')}</span>
          ${m.headerNote ? `<div class="header-note">${esc(m.headerNote)}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="hd2">
      <div class="emergency">
        <div class="lbl">Emergency</div>
        <div class="v">${esc(m.emergency || '')}</div>
      </div>
      <div class="weather">${esc(m.weatherCallout || '')}</div>
      <div class="sun">
        <span><span class="k">↑</span> ${esc(m.sunrise || '')}</span>
        <span><span class="k">↓</span> ${esc(m.sunset || '')}</span>
      </div>
    </div>
  `;
  return el;
}

function renderSections() {
  const host = document.getElementById('sectionsHost');
  host.innerHTML = '';

  // page break BEFORE first section slot
  host.appendChild(pageBreakSlot({ before: state.sections[0]?.id || '__end__' }, 0));

  state.sections.forEach((sec, idx) => {
    const secEl = renderSection(sec, idx);
    // after-break stays on the section; adjustSectionBreakSpacing() pushes it to
    // the correct page boundary on screen. Print uses break-before: page directly.
    host.appendChild(secEl);
    const nextId = state.sections[idx + 1]?.id || '__end__';
    host.appendChild(pageBreakSlot({ before: nextId }, idx + 1));
  });

  // Push after-break sections to the right page boundary in the screen preview
  requestAnimationFrame(adjustSectionBreakSpacing);

  host.querySelectorAll('[data-sec-act]').forEach(b =>
    b.addEventListener('click', () => sectionAction(b.dataset.secAct, b.dataset.secId))
  );
}

function renderSection(sec, idx) {
  const el = document.createElement('div');
  el.className = 'section section--' + sec.type;
  el.dataset.id = sec.id;

  const breakMarker = state.pageBreaks.find(p => p.before === sec.id);
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
    el.draggable = false; el.classList.remove('dragging'); _drag = null;
    document.querySelectorAll('.section.drag-over').forEach(s => s.classList.remove('drag-over'));
  });
  el.addEventListener('dragstart', e => {
    if (!el.draggable) { e.preventDefault(); return; }
    _drag = { type: 'section', id: sec.id };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sec.id);
    el.classList.add('dragging');
  });
  el.addEventListener('dragover', e => {
    if (_drag?.type !== 'section' || _drag.id === sec.id) return;
    e.preventDefault();
    document.querySelectorAll('.section.drag-over').forEach(s => s.classList.remove('drag-over'));
    el.classList.add('drag-over');
  });
  el.addEventListener('drop', e => {
    e.preventDefault(); el.classList.remove('drag-over');
    if (!_drag || _drag.type !== 'section') return;
    const fromIdx = state.sections.findIndex(s => s.id === _drag.id);
    const toIdx   = state.sections.findIndex(s => s.id === sec.id);
    _drag = null;
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = state.sections.splice(fromIdx, 1);
    state.sections.splice(toIdx, 0, moved);
    save(); renderSections();
  });

  // If this schedule section has any row-level page breaks, allow break-inside
  if (sec.type === 'schedule') {
    const hasRowBreaks = state.pageBreaks.some(b => b.beforeRow && b.beforeRow.sectionId === sec.id);
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

function addSection(type) {
  const blank = { id: uid(), type, title: type[0].toUpperCase() + type.slice(1) };
  if (type === 'schedule')  blank.data = [];
  if (type === 'contacts')  blank.data = [];
  if (type === 'equipment') blank.data = [];
  if (type === 'hospital')  blank.data = { name:'', addr:'', phone:'', hours:'', dist:'' };
  if (type === 'basecamp')  blank.data = { name:'', addr:'', parking:'', restroom:'', catering:'' };
  if (type === 'notes')     blank.data = { text:'' };
  state.sections.push(blank);
  save(); renderSections();
}

function sectionAction(act, id) {
  const i = state.sections.findIndex(s => s.id === id);
  if (i < 0) return;
  if (act === 'up' && i > 0) { const [s] = state.sections.splice(i, 1); state.sections.splice(i - 1, 0, s); }
  if (act === 'down' && i < state.sections.length - 1) { const [s] = state.sections.splice(i, 1); state.sections.splice(i + 1, 0, s); }
  if (act === 'del') {
    if (!confirmDel('Delete this section?')) return;
    state.sections.splice(i, 1);
    // also clean any page breaks that referenced this section
    state.pageBreaks = state.pageBreaks.filter(p => p.before !== id);
  }
  save(); renderSections();
}

// ---- SCHEDULE ----
function renderSchedule(sec, host) {
  host.innerHTML = '';

  // Split data into segments at every page-break point
  const brkIdxs = state.pageBreaks
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
      const isAuto = !!state.pageBreaks.find(b => b.auto && b.beforeRow && b.beforeRow.sectionId === sec.id && b.beforeRow.idx === breakRowIdx);
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
        state.pageBreaks = state.pageBreaks.filter(b =>
          !(b.beforeRow && b.beforeRow.sectionId === sec.id && b.beforeRow.idx === breakRowIdx)
        );
        if (isAuto) {
          // Pin this row so autoReflow won't re-insert the break immediately
          if (!state.noBreakPins) state.noBreakPins = [];
          if (!state.noBreakPins.some(p => p.sectionId === sec.id && p.idx === breakRowIdx))
            state.noBreakPins.push({ sectionId: sec.id, idx: breakRowIdx });
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
          _drag = { type: 'row', secId: sec.id, idx: gi };
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(gi));
          tr.classList.add('dragging');
        });
        tr.addEventListener('dragend', () => {
          tr.draggable = false; tr.classList.remove('dragging');
          host.querySelectorAll('tr.drag-over').forEach(r => r.classList.remove('drag-over'));
        });
        tr.addEventListener('dragover', e => {
          if (_drag?.type !== 'row' || _drag.secId !== sec.id) return;
          e.preventDefault(); e.dataTransfer.dropEffect = 'move';
          host.querySelectorAll('tr.drag-over').forEach(r => r.classList.remove('drag-over'));
          tr.classList.add('drag-over');
        });
        tr.addEventListener('drop', e => {
          e.preventDefault(); tr.classList.remove('drag-over');
          if (!_drag || _drag.type !== 'row' || _drag.secId !== sec.id) return;
          const f2 = _drag.idx, t2 = gi; _drag = null;
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
          state.pageBreaks = state.pageBreaks.filter(p => !(p.beforeRow && p.beforeRow.sectionId === sec.id && p.beforeRow.idx === ii));
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

// ---- CONTACTS ----
function renderContacts(sec, host) {
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

// ---- EQUIPMENT ----
function renderEquipment(sec, host) {
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

// ---- KV (hospital / basecamp) ----
function renderKV(sec, host, fields) {
  host.innerHTML = `<div class="kv-grid">${fields.map(([k, lbl]) => `
    <div class="k">${esc(lbl)}</div>
    <div class="v" contenteditable="true" data-f="${k}" data-placeholder="—">${esc(sec.data[k] || '')}</div>
  `).join('')}</div>`;
  host.querySelectorAll('[data-f]').forEach(el =>
    el.addEventListener('input', () => { sec.data[el.dataset.f] = el.textContent; save(); })
  );
}

// ---- NOTES ----
function renderNotes(sec, host) {
  host.innerHTML = `<div class="notes-block" contenteditable="true" data-placeholder="Notes…">${textToHTML(sec.data.text || '')}</div>`;
  const el = host.querySelector('.notes-block');
  wireMultilineEditing(el);
  el.addEventListener('input', () => { sec.data.text = getEditableText(el, true); save(); });
}

// ---- PAGE BREAKS ----
function pageBreakSlot(ref, _idx) {
  const wrap = document.createElement('div');
  const has = state.pageBreaks.some(p => p.before === ref.before);
  wrap.className = 'pbreak-slot' + (has ? ' is-break' : '');
  if (has) {
    wrap.innerHTML = `<div class="pbreak-marker"><span>PAGE BREAK</span><button class="pbreak-rm">✕ remove</button></div>`;
    wrap.querySelector('.pbreak-rm').addEventListener('click', () => {
      state.pageBreaks = state.pageBreaks.filter(p => p.before !== ref.before);
      save(); renderSections();
    });
  } else {
    wrap.innerHTML = `<button class="pbreak-add" title="Insert page break">＋ insert page break</button>`;
    wrap.querySelector('.pbreak-add').addEventListener('click', () => {
      state.pageBreaks.push({ before: ref.before });
      save(); renderSections();
    });
  }
  return wrap;
}

function togglePageBreakRow(sectionId, idx) {
  const ex = state.pageBreaks.findIndex(p => p.beforeRow && p.beforeRow.sectionId === sectionId && p.beforeRow.idx === idx);
  if (ex >= 0) state.pageBreaks.splice(ex, 1);
  else state.pageBreaks.push({ beforeRow: { sectionId, idx } });
}

// ---- TWEAKS ----
function applyTweaks() {
  document.body.classList.add('hide-jp'); // JP labels always hidden
  document.body.classList.toggle('hide-logo', !store.tweaks.showLogo);
  // paper size
  const isLetter = store.tweaks.paperSize === 'letter';
  document.body.classList.toggle('paper-letter', isLetter);
  const lbl = document.getElementById('paperSizeLabel');
  if (lbl) lbl.textContent = isLetter ? 'Letter' : 'A4';
  // update @page size for print
  let ps = document.getElementById('__pageSizeStyle');
  if (!ps) { ps = document.createElement('style'); ps.id = '__pageSizeStyle'; document.head.appendChild(ps); }
  ps.textContent = `@page { size: ${isLetter ? 'letter' : 'A4'}; margin: 0; }`;
  // size buttons
  const btnA4 = document.getElementById('btnSizeA4');
  const btnLetter = document.getElementById('btnSizeLetter');
  if (btnA4) btnA4.classList.toggle('active', !isLetter);
  if (btnLetter) btnLetter.classList.toggle('active', isLetter);
  // other toggles
  document.querySelectorAll('[data-tweak]').forEach(el => {
    const k = el.dataset.tweak;
    if (el.classList.contains('toggle')) el.classList.toggle('on', !!store.tweaks[k]);
  });
}

// ============================================================
// DAYS — multi-day navigation
// ============================================================

function renderDaySwitcher() {
  const host = document.getElementById('daySwitcher');
  if (!host) return;
  host.innerHTML = '';
  store.days.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.className = 'day-btn' + (d.id === store.currentDayId ? ' active' : '');
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

function switchDay(id) {
  if (!store.days.find(d => d.id === id)) return;
  store.currentDayId = id;
  state = currentDay();
  save();
  renderSheet();
  renderDaySwitcher();
}
