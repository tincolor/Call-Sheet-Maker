// ============================================================
// STATE & STORAGE MODULE
// ============================================================

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

// ---- multi-day modifications ----
function newDay() {
  // Option: duplicate current day or create a blank one
  const choice = confirm('OK = Duplicate current day\nCancel = Create blank day');
  const d = choice ? JSON.parse(JSON.stringify(state)) : BLANK_DAY();
  d.id = uid();
  // Assign fresh UIDs to sections to avoid duplicates in DOM
  d.sections.forEach(s => s.id = uid());
  if (choice) {
    // increment day counter & clear date
    const dNum = Number(d.meta.day);
    if (!Number.isNaN(dNum)) d.meta.day = String(dNum + 1);
    d.meta.date = '';
  }
  store.days.push(d);
  store.currentDayId = d.id;
  state = currentDay();
  save();
  renderDaySwitcher();
  renderSheet();
}

function deleteDay() {
  if (store.days.length <= 1) {
    alert('Cannot delete the only day.');
    return;
  }
  const label = (state.meta.date || `Day ${state.meta.day || ''}`).trim();
  if (!confirm(`Delete ${label || 'this day'}? (Cannot undo.)`)) return;

  const idx = store.days.findIndex(d => d.id === state.id);
  store.days.splice(idx, 1);
  // switch to another day
  store.currentDayId = store.days[Math.max(0, idx - 1)].id;
  state = currentDay();
  save();
  renderSheet();
  renderDaySwitcher();
}

function renameDay() {
  const label = (state.meta.date || `Day ${state.meta.day || ''}`).trim();
  const res = prompt('Enter a date or day label for this tab:', label);
  if (res === null) return;
  state.meta.date = res;
  save();
  renderDaySwitcher();
  // Update header field visually
  const dateEl = document.querySelector('[data-k="date"]');
  if (dateEl) dateEl.textContent = res;
}
