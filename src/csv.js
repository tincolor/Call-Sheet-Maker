import { app, save, normalizeMultilineFields } from './store.js';
import { confirmPopover, uid } from './utils.js';
import { renderSheet } from './render/sheet.js';

export function csvEscape(s) {
  s = s == null ? '' : String(s);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function dayToCSVLines(day) {
  const lines = [];
  lines.push('# META'); lines.push('key,value');
  Object.entries(day.meta).forEach(([k, v]) => {
    if (k === 'crewRoles' || k.startsWith('crew.')) return;
    lines.push(`${csvEscape(k)},${csvEscape(v)}`);
  });
  // one line per crew role: crewRole,"Role: Names"
  (Array.isArray(day.meta.crewRoles) ? day.meta.crewRoles : []).forEach(({ role, names }) => {
    lines.push(`crewRole,${csvEscape(`${role || ''}: ${names || ''}`)}`);
  });
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
      Object.entries(sec.data).forEach(([k, v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
    }
    lines.push('');
  });
  return lines;
}

export async function exportCSV(anchor) {
  // Ask scope: current day only, or all days concatenated
  let scope = 'current';
  if (app.store.days.length > 1) {
    const choice = await confirmPopover(
      anchor,
      `You have ${app.store.days.length} days.\n\n` +
      `Export all days as one file, split by "# DAY" markers?`,
      { confirmText: 'All days', cancelText: 'Current day' }
    );
    scope = choice ? 'all' : 'current';
  }

  const lines = [];
  const daysToExport = scope === 'all' ? app.store.days : [app.state];
  daysToExport.forEach((day, i) => {
    const label = (day.meta?.date || `Day ${day.meta?.day || (i + 1)}`).trim();
    if (scope === 'all') {
      lines.push(`# DAY · ${label}`);
      lines.push('');
    }
    lines.push(...dayToCSVLines(day));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `call-sheet-${(app.state.meta.date || 'export').replace(/[^\w.-]/g, '_')}.csv`;
  a.click();
}

export function importCSV(anchor) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.csv,text/csv';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const drafts = parseCSVtoDrafts(fr.result);
        if (drafts.length === 0) { alert('No content found in CSV.'); return; }

        const dayLabel = drafts.length === 1
          ? (drafts[0].meta?.date || drafts[0].meta?.day || 'this day')
          : `${drafts.length} days`;

        const replace = await confirmPopover(
          anchor,
          drafts.length === 1
            ? `Import "${dayLabel}" from CSV?`
            : `This CSV contains ${drafts.length} days:\n\n` +
              drafts.map((d, i) => `  ${i + 1}. ${d.meta?.date || d.meta?.day || '(untitled)'}`).join('\n') +
              '\n\nHow would you like to import?',
          { confirmText: 'Replace current day', cancelText: 'Add as new day' }
        );

        const fresh = drafts.map(d => ({
          id: uid(),
          meta: d.meta || {},
          logos: (app.state?.logos || []).map(l => ({ ...l })),
          pageBreaks: [],
          sections: (d.sections || []).map(s => ({ ...s, id: uid() })),
        }));
        fresh.forEach(normalizeMultilineFields);

        if (replace) {
          // Overwrite the current day in-place
          const cur = app.state;
          cur.meta = fresh[0].meta;
          cur.sections = fresh[0].sections;
          cur.pageBreaks = [];
          // If multi-day, append the remaining days as new
          if (fresh.length > 1) {
            app.store.days.push(...fresh.slice(1));
          }
        } else {
          // Add all imported days as new days, switch to the first
          app.store.days.push(...fresh);
          app.store.currentDayId = fresh[0].id;
        }
        save();
        renderSheet();
      } catch (e) {
        alert('CSV parse error: ' + e.message);
      }
    };
    fr.readAsText(f);
  };
  inp.click();
}

export function parseCSV(txt) {
  // tolerant CSV parser — quoted strings, escaped quotes
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) {
      if (ch === '"' && txt[i + 1] === '"') { cur += '"'; i++; }
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

export function parseCSVtoDrafts(txt) {
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
      const VALID = ['schedule', 'contacts', 'equipment', 'hospital', 'basecamp', 'notes'];
      if (!VALID.includes(type)) {
        // comment — ignore but end any current section parse so stray keys don't
        // leak into the last section's data
        mode = null; cur = null; header = null;
        continue;
      }
      ensureDraft();
      const title = titleParts.join(' · ').trim();
      cur = { id: uid(), type, title, data: ['hospital', 'basecamp', 'notes'].includes(type) ? {} : [] };
      draft.sections.push(cur);
      mode = 'sec'; header = null; continue;
    }
    if (mode === 'meta') {
      if (r[0] === 'key' && r[1] === 'value') continue;
      const d = ensureDraft();
      if (r[0] === 'crewRole') {
        // crewRole,"Role: Names" — repeatable, order preserved
        const [role, ...rest] = String(r[1] || '').split(':');
        if (!Array.isArray(d.meta.crewRoles)) d.meta.crewRoles = [];
        d.meta.crewRoles.push({ id: uid(), role: role.trim(), names: rest.join(':').trim() });
      } else if (r[0] === 'crewRoles') {
        // legacy broken exports serialized the array as "[object Object],…" — drop it
        // so normalizeCrewRoles can rebuild from the crew.* keys instead
      } else {
        d.meta[r[0]] = r[1];
      }
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
