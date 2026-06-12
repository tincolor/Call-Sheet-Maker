import { CS_KEY, CS_KEY_V1, MULTILINE_META_KEYS } from './constants.js';
import { uid, htmlToText } from './utils.js';
import { DEFAULT_STORE, SCHED_COLUMNS } from './data.js';
import { storeSignal, saveStatusSignal, commit } from './signals.js';
import { logoBbc, logoSa } from './logos.js';

export const app = {
  get store() {
    return storeSignal.value;
  },
  set store(val) {
    storeSignal.value = val;
  },
  get state() {
    return storeSignal.value?.days.find(d => d.id === storeSignal.value.currentDayId)
        || storeSignal.value?.days[0];
  },
};

// Guarantees a schedule section has a valid column model: "time" first,
// sane labels, widths that sum to 100, and an autoTime flag. Tolerates
// columns from old saves, CSV imports, and Claude output.
const DEFAULT_COL_WIDTHS = { time: 9, task: 18, loc: 24, cast: 15, note: 34 };

export function ensureScheduleColumns(sec) {
  if (sec?.type !== 'schedule') return;
  if (!Array.isArray(sec.columns) || !sec.columns.length) sec.columns = SCHED_COLUMNS();
  sec.columns = sec.columns
    .filter(c => c && typeof c === 'object' && c.key)
    .map(c => ({
      key: String(c.key),
      label: c.label != null ? htmlToText(String(c.label)) : '',
      width: Number(c.width) > 0 ? Number(c.width) : 0,
    }));
  const ti = sec.columns.findIndex(c => c.key === 'time');
  if (ti > 0) sec.columns.unshift(sec.columns.splice(ti, 1)[0]);
  else if (ti < 0) sec.columns.unshift({ key: 'time', label: 'Time', width: 0 });
  sec.columns.forEach(c => { if (!c.width) c.width = DEFAULT_COL_WIDTHS[c.key] || 0; });
  const unsized = sec.columns.filter(c => !c.width);
  if (unsized.length) {
    const used = sec.columns.reduce((s, c) => s + c.width, 0);
    const share = used < 100 ? (100 - used) / unsized.length : 12;
    unsized.forEach(c => { c.width = share; });
  }
  const total = sec.columns.reduce((s, c) => s + c.width, 0);
  if (total > 0 && Math.abs(total - 100) > 0.5) {
    sec.columns.forEach(c => { c.width = (c.width * 100) / total; });
  }
  if (typeof sec.autoTime !== 'boolean') sec.autoTime = true;
}

export function normalizeDay(day) {
  normalizeMultilineFields(day);
  (day?.sections || []).forEach(ensureScheduleColumns);
}

export function normalizeMultilineFields(day) {
  if (!day?.meta) return;
  if (!('headerNote' in day.meta)) day.meta.headerNote = '';
  normalizeCrewRoles(day);
  for (const key of MULTILINE_META_KEYS) {
    if (key in day.meta) day.meta[key] = htmlToText(day.meta[key]);
  }
  (day.sections || []).forEach(sec => {
    if (sec.type === 'notes' && sec.data && typeof sec.data === 'object') {
      sec.data.text = htmlToText(sec.data.text);
    }
  });
}

export function normalizeCrewRoles(day) {
  if (!day?.meta) return;
  const legacyRoles = [
    ['Producer', day.meta['crew.lp']],
    ['US Producer', day.meta['crew.usprod']],
    ['Director', day.meta['crew.director']],
    ['DOP', day.meta['crew.dop']],
  ];

  if (!Array.isArray(day.meta.crewRoles)) {
    day.meta.crewRoles = legacyRoles.map(([role, names]) => ({
      id: uid(),
      role,
      names: htmlToText(names || ''),
    }));
    return;
  }

  day.meta.crewRoles = day.meta.crewRoles.map(item => ({
    id: item.id || uid(),
    role: htmlToText(item.role || ''),
    names: htmlToText(item.names || ''),
  }));
}

export function fixupLogos(day) {
  if (day.logos) {
    if (day.logos[0]?.label === 'BBC StoryWorks' && !day.logos[0].dataUrl) day.logos[0].dataUrl = logoBbc;
    if (day.logos[1]?.label === 'Street Attack' && !day.logos[1].dataUrl) day.logos[1].dataUrl = logoSa;
  }
  if (!day.pageBreaks) day.pageBreaks = [];
  normalizeDay(day);
}

export function load() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_STORE();
    const raw = localStorage.getItem(CS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.days && s.currentDayId) {
        s.days.forEach(fixupLogos);
        if (!s.tweaks) s.tweaks = { showLogo: true, paperSize: 'a4', accentColor: 'red', darkMode: false, showJp: false };
        if (!('paperSize' in s.tweaks)) s.tweaks.paperSize = 'a4';
        if (!('accentColor' in s.tweaks)) s.tweaks.accentColor = 'red';
        if (!('darkMode' in s.tweaks)) s.tweaks.darkMode = false;
        if (!('showJp' in s.tweaks)) s.tweaks.showJp = false;
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
export function save() {
  clearTimeout(saveTimer);
  setStatus('saving…');
  commit();
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(CS_KEY, JSON.stringify(app.store));
      setStatus('saved · ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    } catch (e) {
      console.warn('save failed', e);
      setStatus('⚠ not saved — storage full (large logos?)');
    }
  }, 250);
}

export function setStatus(t) {
  saveStatusSignal.value = t;
}
