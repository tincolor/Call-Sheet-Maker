import { app } from '../store.js';
import { parseTimeValue, formatTimeValue, parseDurationValue } from '../utils.js';

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

export function togglePageBreakRow(sectionId, idx) {
  const ex = app.state.pageBreaks.findIndex(p => p.beforeRow && p.beforeRow.sectionId === sectionId && p.beforeRow.idx === idx);
  if (ex >= 0) app.state.pageBreaks.splice(ex, 1);
  else app.state.pageBreaks.push({ beforeRow: { sectionId, idx } });
}
