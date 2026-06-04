// ============================================================
// Call Sheet — data-driven app (multi-day)
// ============================================================

const CS_KEY = 'callsheet.app.v2';
const CS_KEY_V1 = 'callsheet.app.v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const MULTILINE_META_KEYS = new Set([
  'company',
  'address',
  'project',
  'client',
  'mainLocation',
  'emergency',
  'weatherCallout',
  'headerNote',
]);

// ---- default day (populated from Day 3 sheet) ----
const DEFAULT_DAY = () => ({
  id: uid(),
  meta: {
    company: 'Street Attack Japan K.K.',
    address: '2-13, Akasaka 9-chome, Minato-ku,\nTokyo 107-0052, Japan\nninetytwo13, #607',
    project: 'The Training Ground',
    client:  'Hyundai Motor Company × Boston Dynamics',
    mainLocation: 'Boston Dynamics HQ · Waltham, MA',
    date:    '2026.04.30 (THU)',
    day:     '3',
    shootCall: '07:00',
    emergency: 'Adrian Grey (Producer)  747-302-2379',
    weatherCallout: 'PARTLY CLOUDY · 64° / 45°F',
    headerNote: '',
    sunrise: '5:47',
    sunset:  '7:40',
    'crew.director': ' Tom Slemmons',
    'crew.dop':      ' Brandon Strack',
    'crew.lp':       ' Adrian Grey',
    'crew.usprod':   ' Brett Zaccardi',
  },
  logos: [
    { label: 'BBC StoryWorks', dataUrl: window.__LOGO_BBC || '' },
    { label: 'Street Attack',  dataUrl: window.__LOGO_SA  || '' },
  ],
  pageBreaks: [], // array of position markers: { before: sectionId } or { beforeRow: {sectionId, idx} }
  sections: [
    {
      id: uid(), type: 'schedule', title: 'Schedule',
      data: [
        { type:'row',  time:'7:00',  dur:'1h', task:'LOAD IN', loc:'Boston Dynamics HQ — Waltham, MA', cast:'', note:'Crew call' },
        { type:'row',  time:'8:00',  dur:'4h', task:'SCENE 11 — END SHOT', loc:'Atlas Lab', cast:'Atlas; Reassembly engineers (hands only); Aya Durbin; Yeuhi Abe; HMC staff; Key BD staff (bg)', note:'' },
        { type:'span', time:'12:00', dur:'1h', text:'LUNCH BREAK — Cafeteria (TBC)' },
        { type:'row',  time:'13:00', dur:'4h', task:'SCENE 6 — Four Stages Montage (Manufacturing → Training)', loc:'Manufacturing room, Teleoperation / Training space', cast:'Manufacturing staff; Teleoperation operator', note:'Continues from Wed Apr 29 (Ideation + Programming)' },
        { type:'span', time:'17:00', dur:'',   text:'WRAP' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Hyundai Motor Company',
      data: [
        { role:'Client', name:'June Kim',  phone:'' },
        { role:'Client', name:'Yujin Lee', phone:'' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Boston Dynamics',
      data: [
        { role:'Client', name:'Nik Noel',       phone:'' },
        { role:'Client', name:'Vatche Arabian', phone:'' },
        { role:'Client', name:'Aya Durbin',     phone:'' },
        { role:'Client', name:'Yeuhi Abe',      phone:'' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'BBC StoryWorks',
      data: [
        { role:'Agency', name:'Kome Tamilchelvam', phone:'Director, Production & Delivery' },
        { role:'Agency', name:'Hijanah Hernandez', phone:'Creative Strategist' },
      ],
    },
    {
      id: uid(), type: 'contacts', title: 'Crew Contacts',
      data: [
        { role:'Producer (SAJ Tokyo)',     name:'Adrian Grey',       phone:'747-302-2379' },
        { role:'US Producer (SA US)',      name:'Brett Zaccardi',    phone:'brett@streetattack.com' },
        { role:'Director (SAJ Tokyo)',     name:'Tom Slemmons',      phone:'tom@streetattack.jp' },
        { role:'DOP (SAJ Tokyo)',          name:'Brandon Strack',    phone:'brandon@streetattack.jp' },
        { role:'1st AC (Boston)',          name:'Asa Reed',          phone:'207-653-1170' },
        { role:'Lighting (Boston)',        name:'Ruben Alves',       phone:'rubenmalves05@gmail.com' },
        { role:'Lighting (Boston)',        name:'Tony Ventura',      phone:'774-930-7446' },
        { role:'Sound Op (Boston)',        name:'Justin Lacroix',    phone:'207-891-8268' },
        { role:'Art / Props Manager',      name:'Claudia Santiso',   phone:'claudiasantiso@gmail.com' },
        { role:'PA (Boston)',              name:'Winston Telesford', phone:'wtelesford@gmail.com' },
      ],
    },
    {
      id: uid(), type: 'hospital', title: 'Nearest Hospital',
      data: {
        name: 'Newton-Wellesley Hospital (nearest ER)',
        addr: '2014 Washington St, Newton, MA 02462',
        phone: '617-243-6000',
        hours: '24h / ER',
        dist:  '~6 mi / 15 min from BD Waltham',
      },
    },
    {
      id: uid(), type: 'basecamp', title: 'Parking / Basecamp',
      data: {
        name: 'Residence Inn Waltham (hotel basecamp)',
        addr: 'Waltham, MA',
        parking:  'On-site at BD HQ — confirm w/ Vatche',
        restroom: 'Inside BD HQ',
        catering: 'Cafeteria (TBC)',
      },
    },
    {
      id: uid(), type: 'equipment', title: 'Equipment Checklist',
      data: [
        'FX6 + rigging + batteries','FX3 + batteries','Sony 24–70mm lens','82mm ND filters',
        'DJI RS3 Pro + mounting kit','Tripod (Miller)','SmallHD 7','SmallHD 7 w/ RX',
        'Teradek Bolt 4K 750 LT/RX kit','Memory cards (+ extras?)',
        'RENTAL · Angenieux EZ-1 + EZ-2 zooms','RENTAL · Sony 16–35mm',
        'RENTAL · EasyRig + Stabil / Serene','RENTAL · Sachtler Video 20 tripod',
        'RENTAL · Losmandy Porta-Jib Standard','RENTAL · Matthews Doorway Dolly',
        'RENTAL · Extra monitors + wireless feed (TBC)','RENTAL · GF Multi-Jib larger crane (if needed)',
      ].map(t => ({ text: t, done: false })),
    },
    {
      id: uid(), type: 'notes', title: 'Notes',
      data: { text: '' },
    },
  ],
});

// ---- blank day (for "+ New day") ----
const BLANK_DAY = () => ({
  id: uid(),
  meta: {
    company: '', address: '', project: '', client: '', mainLocation: '',
    date: '', day: '', shootCall: '',
    emergency: '', weatherCallout: '', headerNote: '', sunrise: '', sunset: '',
    'crew.director': '', 'crew.dop': '', 'crew.lp': '', 'crew.usprod': '',
  },
  logos: [],
  pageBreaks: [],
  sections: [
    { id: uid(), type: 'schedule', title: 'Schedule', data: [] },
    { id: uid(), type: 'contacts', title: 'Crew Contacts', data: [] },
    { id: uid(), type: 'hospital', title: 'Nearest Hospital',
      data: { name:'', addr:'', phone:'', hours:'', dist:'' } },
    { id: uid(), type: 'basecamp', title: 'Parking / Basecamp',
      data: { name:'', addr:'', parking:'', restroom:'', catering:'' } },
    { id: uid(), type: 'equipment', title: 'Equipment Checklist', data: [] },
    { id: uid(), type: 'notes', title: 'Notes', data: { text: '' } },
  ],
});

const DEFAULT_STORE = () => {
  const d = DEFAULT_DAY();
  return { days: [d], currentDayId: d.id, tweaks: { showLogo: true, paperSize: 'a4' } };
};

// ---- load / save ----
let store = load();
let state = currentDay(); // live reference to current day

function currentDay() {
  return store.days.find(d => d.id === store.currentDayId) || store.days[0];
}

function htmlToText(html) {
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

function textToHTML(text) {
  const safe = esc(String(text || '').replace(/\r\n?/g, '\n'));
  return safe.replace(/\n/g, '<br>');
}

function getEditableText(el, multiline = false) {
  return multiline ? htmlToText(el.innerHTML) : el.textContent;
}

function setEditableText(el, value, multiline = false) {
  if (multiline) el.innerHTML = textToHTML(value);
  else el.textContent = value || '';
}

function insertLineBreak() {
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

function wireMultilineEditing(el) {
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

function normalizeMultilineFields(day) {
  if (!day?.meta) return;
  if (!('headerNote' in day.meta)) day.meta.headerNote = '';
  for (const key of MULTILINE_META_KEYS) {
    if (key in day.meta) day.meta[key] = htmlToText(day.meta[key]);
  }
  (day.sections || []).forEach(sec => {
    if (sec.type === 'notes' && sec.data && typeof sec.data === 'object') {
      sec.data.text = htmlToText(sec.data.text);
    }
  });
}

function fixupLogos(day) {
  if (day.logos) {
    if (day.logos[0] && !day.logos[0].dataUrl && window.__LOGO_BBC) day.logos[0].dataUrl = window.__LOGO_BBC;
    if (day.logos[1] && !day.logos[1].dataUrl && window.__LOGO_SA)  day.logos[1].dataUrl = window.__LOGO_SA;
  }
  if (!day.pageBreaks) day.pageBreaks = [];
  normalizeMultilineFields(day);
}

function load() {
  try {
    const raw = localStorage.getItem(CS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.days && s.currentDayId) {
        s.days.forEach(fixupLogos);
        if (!s.tweaks) s.tweaks = { showLogo: true, paperSize: 'a4' };
        if (!('paperSize' in s.tweaks)) s.tweaks.paperSize = 'a4';
        return s;
      }
    }
    // migrate v1 single-day state → store with one day
    const v1 = localStorage.getItem(CS_KEY_V1);
    if (v1) {
      const s1 = JSON.parse(v1);
      const day = { id: uid(), meta: s1.meta || {}, logos: s1.logos || [], pageBreaks: s1.pageBreaks || [], sections: s1.sections || [] };
      fixupLogos(day);
      return { days: [day], currentDayId: day.id, tweaks: { showLogo: true, paperSize: 'a4', ...(s1.tweaks || {}) } };
    }
  } catch(e) { console.warn('load fail', e); }
  return DEFAULT_STORE();
}

let _drag = null;      // shared drag-and-drop state
let _reflowing = false; // prevents recursive autoReflow calls

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  setStatus('saving…');
  saveTimer = setTimeout(() => {
    localStorage.setItem(CS_KEY, JSON.stringify(store));
    setStatus('saved · ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
  }, 250);
}
function setStatus(t) { const el = document.getElementById('saveStatus'); if (el) el.textContent = t; }

// ---- utilities ----
const esc = s => (s == null ? '' : String(s))
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function confirmDel(msg) { return confirm(msg); }

function parseTimeValue(value) {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const mins = Number(m[2]);
  if (hours > 23 || mins > 59) return null;
  return (hours * 60) + mins;
}

function formatTimeValue(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return '';
  const minsInDay = 24 * 60;
  const safe = ((totalMinutes % minsInDay) + minsInDay) % minsInDay;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function parseDurationValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = text.match(/(\d+)\s*m/);
  const hours = hourMatch ? Math.round(Number(hourMatch[1]) * 60) : 0;
  const mins = minMatch ? Number(minMatch[1]) : 0;
  const total = hours + mins;
  return total > 0 ? total : null;
}

function recalculateScheduleTimes(sec, startIndex = 1) {
  for (let i = Math.max(1, startIndex); i < sec.data.length; i++) {
    const prev = sec.data[i - 1];
    const cur = sec.data[i];
    const prevTime = parseTimeValue(prev?.time);
    const prevDur = parseDurationValue(prev?.dur);
    if (prevTime == null || prevDur == null || !cur) continue;
    cur.time = formatTimeValue(prevTime + prevDur);
  }
}

function syncScheduleTimeCells(tb, sec, startIndex = 1) {
  for (let i = Math.max(1, startIndex); i < sec.data.length; i++) {
    const el = tb.querySelector(`[data-f="time"][data-i="${i}"]`);
    if (el) el.textContent = sec.data[i].time || '';
  }
}

// ============================================================
// RENDER — Sheet tab
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

// ---- AUTO PAGE-BREAK REFLOW ----
// Measures each schedule row's bottom position relative to the paper top.
// For rows that fall past a page boundary, inserts an auto page-break marker.
// Uses _reflowing to prevent infinite re-render loops.
function autoReflow() {
  if (_reflowing) return;
  const paper = document.getElementById('paper');
  if (!paper) return;

  const mmToPx  = 96 / 25.4; // CSS pixels per mm (logical, not physical)
  const pageHPx = (store.tweaks.paperSize === 'letter' ? 279.4 : 297) * mmToPx;
  const padBotPx = 16 * mmToPx;
  const paperTop = paper.getBoundingClientRect().top;

  const needed = []; // { sectionId, idx } breaks to insert

  state.sections.forEach(sec => {
    if (sec.type !== 'schedule') return;
    const secEl = document.querySelector(`#sectionsHost .section[data-id="${sec.id}"]`);
    if (!secEl) return;
    const secBody = secEl.querySelector('.section-body');
    if (!secBody) return;

    // Walk children in DOM order: alternate between .sched-cont-wrap and table elements.
    // .sched-cont-wrap adds screen height that doesn't exist in print (it becomes padding-top
    // at the top of the new print page). Track this as extraScreenH so we can compute
    // each row's logical print position.
    let extraScreenH = 0;

    Array.from(secBody.children).forEach(child => {
      if (child.classList.contains('sched-cont-wrap')) {
        extraScreenH += child.getBoundingClientRect().height;
        return;
      }
      if (child.tagName !== 'TABLE') return;

      Array.from(child.querySelectorAll('tbody tr')).forEach(tr => {
        if (tr.classList.contains('sched-page-footer')) return;
        const dataEl = tr.querySelector('[data-i]');
        if (!dataEl) return;
        const idx = +dataEl.dataset.i;
        if (idx === 0) return; // never break before the very first row

        // Logical bottom: screen position minus the extra height from cont-wrap divs
        const logicalBottom = tr.getBoundingClientRect().bottom - extraScreenH - paperTop;
        const pageNum  = Math.floor(logicalBottom / pageHPx);
        const pageBotY = (pageNum + 1) * pageHPx - padBotPx;

        if (logicalBottom > pageBotY) {
          // Skip if the user has explicitly pinned this row as no-break
          const pinned = state.noBreakPins && state.noBreakPins.some(p => p.sectionId === sec.id && p.idx === idx);
          if (!pinned) needed.push({ sectionId: sec.id, idx });
        }
      });
    });
  });

  // Deduplicate (keep only unique sectionId:idx pairs)
  const seen = new Set();
  const neededUniq = needed.filter(b => {
    const k = `${b.sectionId}:${b.idx}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // Compare with current auto-breaks
  const curAuto = state.pageBreaks
    .filter(b => b.auto && b.beforeRow)
    .map(b => `${b.beforeRow.sectionId}:${b.beforeRow.idx}`)
    .sort()
    .join(',');
  const wantAuto = neededUniq
    .map(b => `${b.sectionId}:${b.idx}`)
    .sort()
    .join(',');

  if (curAuto !== wantAuto) {
    _reflowing = true;
    state.pageBreaks = state.pageBreaks.filter(b => !b.auto);
    neededUniq.forEach(b =>
      state.pageBreaks.push({ beforeRow: { sectionId: b.sectionId, idx: b.idx }, auto: true })
    );
    renderSections();
    // Allow a second pass after layout settles, then push continuations to page boundaries
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _reflowing = false;
      adjustSectionBreakSpacing();
    }));
  }
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

// ---- SECTIONS ----

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

// Pushes after-break sections and schedule continuation pages to the correct
// visual page boundary on screen (print uses break-before: page natively).
//
// All break points are measured together in the reset state, then paddings are
// applied in visual order with a cumulative-shift tracker. This prevents a
// compounding bug where setting padding N shifts break N+1 past a page
// boundary, causing each subsequent margin to become ~one full page too tall.
function adjustSectionBreakSpacing() {
  const paper = document.getElementById('paper');
  if (!paper) return;
  const mmToPx      = 96 / 25.4;
  const pageH       = (store.tweaks.paperSize === 'letter' ? 279.4 : 297) * mmToPx;
  const pageSlot    = pageH + 20; // page height + 20px visual gap
  const topMarginPx = 14 * mmToPx; // matches .paper { padding-top: 14mm }

  // ── 1. Reset ALL dynamic paddings ──
  document.querySelectorAll('.section.after-break').forEach(s => s.style.paddingTop = '');
  document.querySelectorAll('.sched-cont-content').forEach(c => c.style.paddingTop = '');
  document.querySelectorAll('.pbreak-marker, .sched-cont-wrap .brk-bar').forEach(el => {
    el.style.transform = '';
    el.style.visibility = '';
  });

  // Force synchronous reflow so subsequent getBCR calls are accurate
  const paperTop = paper.getBoundingClientRect().top;

  // ── 2. Snapshot every break point BEFORE any padding is applied ──
  const sectionBreaks = Array.from(document.querySelectorAll('.section.after-break')).map(section => {
    const top = section.getBoundingClientRect().top - paperTop;
    const marker = section.previousElementSibling?.classList.contains('pbreak-slot')
      ? section.previousElementSibling.querySelector('.pbreak-marker')
      : null;
    return {
      el: section,
      kind: 'section',
      refTop: top,
      contentTop: top,
      marker,
      markerTop: marker ? marker.getBoundingClientRect().top - paperTop : null,
      applyPadding: px => { section.style.paddingTop = px > 0 ? `${px}px` : ''; },
    };
  });

  const scheduleBreaks = Array.from(document.querySelectorAll('.sched-cont-content')).map(content => {
    const bar    = content.closest('.sched-cont-wrap')?.querySelector('.brk-bar');
    const refTop = bar
      ? bar.getBoundingClientRect().top - paperTop
      : content.getBoundingClientRect().top - paperTop;
    return {
      el: content,
      kind: 'schedule',
      refTop,
      contentTop: content.getBoundingClientRect().top - paperTop,
      marker: bar,
      markerTop: bar ? bar.getBoundingClientRect().top - paperTop : null,
      applyPadding: px => { content.style.paddingTop = px > 0 ? `${px}px` : ''; },
    };
  });

  const snapshots = [...sectionBreaks, ...scheduleBreaks]
    .map(snapshot => ({
      ...snapshot,
      targetPage: Math.ceil(snapshot.refTop / pageSlot),
    }))
    .sort((a, b) => a.refTop - b.refTop);
  const scheduleMarkerPages = new Set(
    snapshots
      .filter(snapshot => snapshot.kind === 'schedule' && snapshot.marker)
      .map(snapshot => snapshot.targetPage)
  );

  // ── 3. Apply padding in page order, compensating for earlier shifts ──
  let shift = 0; // running total of padding added by previous continuations
  snapshots.forEach(({ kind, targetPage, contentTop, marker, markerTop, applyPadding }) => {
    const actualTop     = contentTop + shift;                     // true current position
    const needed        = targetPage * pageSlot + topMarginPx - actualTop;
    const padding       = needed > 0 ? Math.round(needed) : 0;
    if (marker && markerTop != null) {
      const duplicateSectionMarker = kind === 'section' && scheduleMarkerPages.has(targetPage);
      marker.style.visibility = duplicateSectionMarker ? 'hidden' : '';
      const markerH = marker.getBoundingClientRect().height;
      const pageGapTop = targetPage * pageSlot - 20;
      const markerTargetTop = pageGapTop + ((20 - markerH) / 2);
      const markerActualTop = markerTop + shift;
      marker.style.transform = `translateY(${Math.round(markerTargetTop - markerActualTop)}px)`;
    }
    applyPadding(padding);
    shift += padding;
  });
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

function newDay() {
  const choice = prompt('New day:\n  1 = Blank day\n  2 = Duplicate current day (schedule cleared)\n  3 = Duplicate current day (full copy)', '2');
  if (!choice) return;
  let d;
  if (choice === '1') d = BLANK_DAY();
  else if (choice === '2' || choice === '3') {
    d = JSON.parse(JSON.stringify(state));
    d.id = uid();
    d.sections = d.sections.map(s => ({ ...s, id: uid(), data: Array.isArray(s.data) ? s.data.map(r => ({...r})) : {...s.data} }));
    d.pageBreaks = [];
    if (d.meta) d.meta.headerNote = '';
    if (choice === '2') {
      // clear schedule rows but keep everything else
      d.sections.forEach(s => { if (s.type === 'schedule') s.data = []; });
      if (d.meta) {
        d.meta.date = '';
        d.meta.day = String((parseInt(state.meta?.day) || 0) + 1 || '');
      }
    }
  } else return;
  store.days.push(d);
  store.currentDayId = d.id;
  state = currentDay();
  save(); renderSheet(); renderDaySwitcher();
}

function deleteDay() {
  if (store.days.length <= 1) { alert('Can\'t delete the last day.'); return; }
  const label = (state.meta?.date || '').trim() || `Day ${state.meta?.day || ''}`;
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
  const i = store.days.findIndex(d => d.id === store.currentDayId);
  store.days.splice(i, 1);
  store.currentDayId = store.days[Math.max(0, i - 1)].id;
  state = currentDay();
  save(); renderSheet(); renderDaySwitcher();
}

function renameDay() {
  const cur = state.meta?.date || '';
  const next = prompt('Day label (date or short name):', cur);
  if (next == null) return;
  state.meta.date = next;
  save(); renderSheet(); renderDaySwitcher();
}

// ============================================================
// INTAKE TAB
// ============================================================

let intakeDraft = null; // parsed JSON awaiting verify

function initIntake() {
  const btn = document.getElementById('intakeInterpret');
  btn.addEventListener('click', runIntake);
  document.getElementById('intakeCancel').addEventListener('click', resetIntake);
  document.getElementById('intakePublish').addEventListener('click', publishIntake);
  document.getElementById('intakeRetry').addEventListener('click', runIntake);
  initApiKey();
}

// ---- Claude API key handling ----
const API_KEY_STORAGE = 'callsheet.claudeApiKey';
const API_MODEL_STORAGE = 'callsheet.claudeModel';

function getApiKey() { try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; } }
function getApiModel() { try { return localStorage.getItem(API_MODEL_STORAGE) || 'claude-sonnet-4-5'; } catch { return 'claude-sonnet-4-5'; } }

function initApiKey() {
  const input  = document.getElementById('apiKeyInput');
  const select = document.getElementById('apiKeyModel');
  const save   = document.getElementById('apiKeySave');
  const clear  = document.getElementById('apiKeyClear');
  if (!input) return;

  // hydrate
  const existing = getApiKey();
  if (existing) input.value = existing;
  select.value = getApiModel();
  refreshApiKeyStatus();

  save.addEventListener('click', () => {
    const v = input.value.trim();
    if (v) localStorage.setItem(API_KEY_STORAGE, v);
    else   localStorage.removeItem(API_KEY_STORAGE);
    localStorage.setItem(API_MODEL_STORAGE, select.value);
    refreshApiKeyStatus();
    save.textContent = 'Saved ✓';
    setTimeout(() => save.textContent = 'Save', 1200);
  });
  clear.addEventListener('click', () => {
    input.value = '';
    localStorage.removeItem(API_KEY_STORAGE);
    refreshApiKeyStatus();
  });
  select.addEventListener('change', () => {
    localStorage.setItem(API_MODEL_STORAGE, select.value);
    refreshApiKeyStatus();
  });
}

function refreshApiKeyStatus() {
  const pill = document.getElementById('apiKeyStatus');
  const hint = document.getElementById('intakeHint');
  if (!pill) return;
  const key = getApiKey();
  if (key) {
    pill.textContent = 'using ' + getApiModel().replace('claude-', '');
    pill.classList.add('active');
    hint.textContent = 'Using your API key · ' + getApiModel() + ' · up to 8k output tokens';
  } else {
    pill.textContent = 'built-in';
    pill.classList.remove('active');
    hint.textContent = 'Uses built-in Claude Haiku · output capped at ~1024 tokens';
  }
}

async function completeWithClaude(userContent) {
  const key = getApiKey();
  if (key) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: getApiModel(),
        max_tokens: 8000,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch {}
      throw new Error(`Claude API ${res.status}: ${detail || res.statusText}`);
    }
    const json = await res.json();
    return (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }
  // fall back to built-in helper (design environment)
  if (!window.claude?.complete) {
    throw new Error('No API key set and built-in Claude helper is not available. Save an API key in the panel below.');
  }
  return await window.claude.complete({
    messages: [{ role: 'user', content: userContent }],
  });
}

const INTAKE_SYSTEM = `You convert raw production text (messages, emails, notes; may be mixed English/Japanese) into a compact JSON call-sheet object. Keep output SHORT — omit any key whose value is empty. Use this shape:

{ "meta": { "company"?, "address"?, "project"?, "client"?, "mainLocation"?, "date"?, "day"?, "shootCall"?, "emergency"?, "weatherCallout"?, "headerNote"?, "sunrise"?, "sunset"? },
  "sections": [
    { "type": "schedule", "title": "...", "data": [ { "type": "row", "time": "...", "dur": "...", "task": "...", "loc": "...", "cast": "...", "note": "..." }, { "type": "span", "time": "...", "text": "..." } ] },
    { "type": "contacts", "title": "...", "data": [ { "role": "...", "name": "...", "phone": "..." } ] },
    { "type": "equipment", "title": "...", "data": [ { "text": "...", "done": false } ] },
    { "type": "hospital", "title": "...", "data": { "name": "...", "addr": "...", "phone": "...", "hours": "...", "dist": "..." } },
    { "type": "basecamp", "title": "...", "data": { "name": "...", "addr": "...", "parking": "...", "restroom": "...", "catering": "..." } },
    { "type": "notes", "title": "Notes", "data": { "text": "..." } }
  ]
}

Rules: only include sections that have content. Inside each section, only include fields that are present. Anything that does not fit goes into a notes section. Return ONLY the JSON object — no markdown, no prose, no commentary.`;

// Attempt to repair JSON that was truncated mid-output (Haiku 1024-token cap).
// Strategy: close any open string, then close arrays/objects in reverse-stack order.
function tryRepairJSON(s) {
  s = s.trim();
  // strip trailing comma / dangling key
  s = s.replace(/,\s*$/, '');
  const stack = [];
  let inStr = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  if (inStr) s += '"';
  // if we ended inside an incomplete key-value (e.g. "key": with no value)
  s = s.replace(/,?\s*"[^"]*"\s*:\s*$/, '');
  s = s.replace(/,\s*$/, '');
  while (stack.length) {
    const o = stack.pop();
    s += (o === '{' ? '}' : ']');
  }
  return s;
}

async function runIntake() {
  const txt = document.getElementById('intakeInput').value.trim();
  if (!txt) { alert('Paste some text first.'); return; }
  setIntakeStep('loading');
  try {
    const raw = await completeWithClaude(
      `${INTAKE_SYSTEM}\n\n--- INPUT START ---\n${txt}\n--- INPUT END ---`
    );
    const clean = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    let parsed, repairedNote = '';
    try {
      parsed = JSON.parse(clean);
    } catch (e1) {
      const repaired = tryRepairJSON(clean);
      try {
        parsed = JSON.parse(repaired);
        repairedNote = 'Output was truncated — some trailing content may be missing. Review carefully before publishing.';
      } catch (e2) {
        throw new Error('Could not parse model output. The response was likely truncated (Claude Haiku has a 1024-token output cap). Try pasting a smaller chunk, or break the input into parts. Original parse error: ' + e1.message);
      }
    }
    intakeDraft = parsed;
    renderIntakePreview(repairedNote);
    setIntakeStep('verify');
  } catch (e) {
    document.getElementById('intakeError').textContent = e.message || String(e);
    setIntakeStep('error');
  }
}

function setIntakeStep(step) {
  ['input','loading','verify','error'].forEach(s =>
    document.getElementById('intake-' + s).style.display = (s === step ? '' : 'none'));
}

function resetIntake() {
  intakeDraft = null;
  document.getElementById('intakeInput').value = '';
  setIntakeStep('input');
}

function renderIntakePreview(note = '') {
  const host = document.getElementById('intakePreview');
  host.innerHTML = '';
  if (note) {
    const n = document.createElement('div');
    n.style.cssText = 'background:#FFF3B0;border:1px solid #CBB04F;color:#5A4700;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;';
    n.textContent = note;
    host.appendChild(n);
  }

  // META
  const meta = intakeDraft.meta || {};
  const curMeta = state.meta;
  const metaTable = document.createElement('div');
  metaTable.className = 'preview-block';
  metaTable.innerHTML = `<h4>Header</h4><table class="pv"><tbody>${
    Object.keys(meta).map(k => {
      const v = meta[k] || '';
      const changed = (v || '') !== (curMeta[k] || '');
      return `<tr><td class="k">${esc(k)}</td><td class="v ${changed ? 'changed' : ''}" contenteditable="true" data-scope="meta" data-k="${esc(k)}">${esc(v)}</td></tr>`;
    }).join('')
  }</tbody></table>`;
  host.appendChild(metaTable);

  // SECTIONS
  (intakeDraft.sections || []).forEach((sec, si) => {
    const block = document.createElement('div');
    block.className = 'preview-block';
    block.innerHTML = `<h4>${esc(sec.title || sec.type)} <span class="tag">${esc(sec.type)}</span></h4>`;
    if (Array.isArray(sec.data)) {
      if (sec.data.length === 0) { block.innerHTML += '<p class="muted">(empty)</p>'; host.appendChild(block); return; }
      const cols = Object.keys(sec.data[0]);
      block.innerHTML += `<table class="pv"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
        sec.data.map((r, ri) => `<tr>${
          cols.map(c => `<td class="v" contenteditable="true" data-scope="sec.row" data-si="${si}" data-ri="${ri}" data-c="${esc(c)}">${esc(r[c] != null ? r[c] : '')}</td>`).join('')
        }</tr>`).join('')
      }</tbody></table>`;
    } else if (sec.data && typeof sec.data === 'object') {
      const cols = Object.keys(sec.data);
      block.innerHTML += `<table class="pv"><tbody>${
        cols.map(c => `<tr><td class="k">${esc(c)}</td><td class="v" contenteditable="true" data-scope="sec.obj" data-si="${si}" data-c="${esc(c)}">${esc(sec.data[c] || '')}</td></tr>`).join('')
      }</tbody></table>`;
    }
    host.appendChild(block);
  });

  // wire edits back into intakeDraft
  host.querySelectorAll('[data-scope]').forEach(el => {
    el.addEventListener('input', () => {
      const s = el.dataset.scope;
      if (s === 'meta') intakeDraft.meta[el.dataset.k] = el.textContent;
      if (s === 'sec.row') intakeDraft.sections[+el.dataset.si].data[+el.dataset.ri][el.dataset.c] = el.textContent;
      if (s === 'sec.obj') intakeDraft.sections[+el.dataset.si].data[el.dataset.c] = el.textContent;
    });
  });
}

function publishIntake() {
  if (!intakeDraft) return;
  // merge meta
  Object.assign(state.meta, intakeDraft.meta || {});
  // merge / replace sections: assign new uids and append to existing
  if (Array.isArray(intakeDraft.sections) && intakeDraft.sections.length) {
    const action = confirm('OK = Replace existing sections with interpreted ones.\nCancel = Append to existing sections.');
    const fresh = intakeDraft.sections.map(s => ({ ...s, id: uid() }));
    if (action) state.sections = fresh;
    else state.sections.push(...fresh);
  }
  save();
  switchTab('sheet');
  renderSheet();
  resetIntake();
}

// ============================================================
// CSV EXPORT / IMPORT
// ============================================================

function csvEscape(s) {
  s = s == null ? '' : String(s);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

function dayToCSVLines(day) {
  const lines = [];
  lines.push('# META'); lines.push('key,value');
  Object.entries(day.meta).forEach(([k,v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
  lines.push('');
  day.sections.forEach(sec => {
    lines.push(`# ${sec.type.toUpperCase()} · ${sec.title}`);
    if (Array.isArray(sec.data)) {
      if (sec.data.length === 0) { lines.push(''); return; }
      const cols = Object.keys(sec.data[0]);
      lines.push(cols.join(','));
      sec.data.forEach(r => lines.push(cols.map(c => csvEscape(r[c])).join(',')));
    } else if (sec.data && typeof sec.data === 'object') {
      lines.push('key,value');
      Object.entries(sec.data).forEach(([k,v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
    }
    lines.push('');
  });
  return lines;
}

function exportCSV() {
  // Ask scope: current day only, or all days concatenated
  let scope = 'current';
  if (store.days.length > 1) {
    const choice = confirm(
      `You have ${store.days.length} days.\n\n` +
      `OK = Export ALL days (one file, split by "# DAY" markers)\n` +
      `Cancel = Export current day only`
    );
    scope = choice ? 'all' : 'current';
  }

  const lines = [];
  const daysToExport = scope === 'all' ? store.days : [state];
  daysToExport.forEach((day, i) => {
    const label = (day.meta?.date || `Day ${day.meta?.day || (i+1)}`).trim();
    if (scope === 'all') {
      lines.push(`# DAY · ${label}`);
      lines.push('');
    }
    lines.push(...dayToCSVLines(day));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `call-sheet-${(state.meta.date || 'export').replace(/[^\w.-]/g,'_')}.csv`;
  a.click();
}

function importCSV() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.csv,text/csv';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const drafts = parseCSVtoDrafts(fr.result);
        if (drafts.length === 0) { alert('No content found in CSV.'); return; }

        if (drafts.length === 1) {
          // Single day — go through the verify/preview flow
          intakeDraft = drafts[0];
          renderIntakePreview();
          switchTab('intake');
          setIntakeStep('verify');
          return;
        }

        // Multi-day — create all days at once, after confirming
        const action = confirm(
          `This CSV contains ${drafts.length} days:\n\n` +
          drafts.map((d, i) => `  ${i+1}. ${d.meta?.date || d.meta?.day || '(untitled)'}`).join('\n') +
          `\n\nOK   = Replace all existing days with these\n` +
          `Cancel = Append these as new days (keep existing)`
        );

        const fresh = drafts.map(d => ({
          id: uid(),
          meta: d.meta || {},
          logos: DEFAULT_DAY().logos,
          pageBreaks: [],
          sections: (d.sections || []).map(s => ({ ...s, id: uid() })),
        }));

        if (action) {
          store.days = fresh;
        } else {
          store.days.push(...fresh);
        }
        store.currentDayId = fresh[0].id;
        state = currentDay();
        save();
        renderSheet();
        renderDaySwitcher();
        switchTab('sheet');
      } catch (e) {
        alert('CSV parse error: ' + e.message);
      }
    };
    fr.readAsText(f);
  };
  inp.click();
}

function parseCSV(txt) {
  // tolerant CSV parser — quoted strings, escaped quotes
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) {
      if (ch === '"' && txt[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch === '\r') {}
      else cur += ch;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function parseCSVtoDrafts(txt) {
  const rows = parseCSV(txt);
  const drafts = [];
  let draft = null;
  let mode = null, header = null, cur = null;

  const ensureDraft = () => {
    if (!draft) { draft = { meta: {}, sections: [] }; drafts.push(draft); }
    return draft;
  };

  for (const r of rows) {
    if (r.length === 1 && r[0] === '') { mode = null; continue; }
    const first = (r[0] || '').trim();

    // DAY separator — starts a new day draft
    if (first.startsWith('# DAY')) {
      draft = { meta: {}, sections: [] };
      drafts.push(draft);
      mode = null; header = null; cur = null;
      continue;
    }
    if (first.startsWith('# META')) { ensureDraft(); mode = 'meta'; continue; }
    if (first.startsWith('# ')) {
      // Only recognize known section types; treat anything else as a comment line.
      const body = first.slice(2).trimStart();
      const [typeRaw, ...titleParts] = body.split(' · ');
      const type = typeRaw.trim().toLowerCase();
      const VALID = ['schedule','contacts','equipment','hospital','basecamp','notes'];
      if (!VALID.includes(type)) {
        // comment — ignore but end any current section parse so stray keys don't
        // leak into the last section's data
        mode = null; cur = null; header = null;
        continue;
      }
      ensureDraft();
      const title = titleParts.join(' · ').trim();
      cur = { id: uid(), type, title, data: ['hospital','basecamp','notes'].includes(type) ? {} : [] };
      draft.sections.push(cur);
      mode = 'sec'; header = null; continue;
    }
    if (mode === 'meta') {
      if (r[0] === 'key' && r[1] === 'value') continue;
      ensureDraft().meta[r[0]] = r[1];
    } else if (mode === 'sec' && cur) {
      if (!header) { header = r; continue; }
      if (Array.isArray(cur.data)) {
        const obj = {};
        header.forEach((h, i) => obj[h] = r[i] || '');
        if (cur.type === 'equipment' && 'done' in obj) obj.done = obj.done === 'true';
        cur.data.push(obj);
      } else {
        cur.data[r[0]] = r[1];
      }
    }
  }
  return drafts;
}

// Legacy single-draft shim (still used by any callers)
function parseCSVtoDraft(txt) {
  const drafts = parseCSVtoDrafts(txt);
  return drafts[0] || { meta: {}, sections: [] };
}

// ============================================================
// TABS + CHROME
// ============================================================

function switchTab(tab) {
  // Panels are now always visible side-by-side; just trigger a sheet render if needed
  if (tab === 'sheet') renderSheet();
}

function initChrome() {
  document.getElementById('btnPrint').addEventListener('click', () => window.print());
  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Wipe ALL days and start fresh? (Cannot undo.)')) return;
    localStorage.removeItem(CS_KEY);
    store = DEFAULT_STORE(); state = currentDay();
    save(); renderSheet(); renderDaySwitcher();
  });
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnImportCSV').addEventListener('click', importCSV);
  const bDel = document.getElementById('btnDelDay'); if (bDel) bDel.addEventListener('click', deleteDay);
  const bDup = document.getElementById('btnDupDay'); if (bDup) bDup.addEventListener('click', newDay);

  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  // add section
  document.querySelectorAll('[data-new]').forEach(b => b.addEventListener('click', () => addSection(b.dataset.new)));

  // tweaks
  document.getElementById('btnTweaks').addEventListener('click', () =>
    document.body.classList.toggle('tweaks-open'));
  document.getElementById('tweaksClose').addEventListener('click', () =>
    document.body.classList.remove('tweaks-open'));
  document.querySelectorAll('[data-tweak]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.tweak;
      store.tweaks[k] = !store.tweaks[k];
      save(); applyTweaks();
    });
  });
  // page size buttons
  const bA4 = document.getElementById('btnSizeA4');
  const bLetter = document.getElementById('btnSizeLetter');
  if (bA4) bA4.addEventListener('click', () => { store.tweaks.paperSize = 'a4'; save(); applyTweaks(); });
  if (bLetter) bLetter.addEventListener('click', () => { store.tweaks.paperSize = 'letter'; save(); applyTweaks(); });

  // section spacing slider
  const gapSlider = document.getElementById('gapSlider');
  const gapVal = document.getElementById('gapVal');
  if (gapSlider) {
    const applyGap = () => {
      const v = gapSlider.value;
      document.getElementById('sectionsHost').style.setProperty('--section-gap', v + 'mm');
      document.documentElement.style.setProperty('--section-gap', v + 'mm');
      if (gapVal) gapVal.textContent = v + 'mm';
    };
    gapSlider.addEventListener('input', applyGap);
  }
}

// ---- BOOT ----
function boot() {
  document.body.classList.add('editing');
  initChrome();
  initIntake();
  renderDaySwitcher();
  renderSheet(); // renders header + sections + applies tweaks (incl. paper size)
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
