import { app, save } from './store.js';
import { confirmPopover } from './utils.js';

export async function deleteDay(anchor) {
  if (app.store.days.length <= 1) { alert("Can't delete the last day."); return; }
  const label = (app.state.meta?.date || '').trim() || `Day ${app.state.meta?.day || ''}`;
  if (!(await confirmPopover(anchor, `Delete "${label}"? This cannot be undone.`, { confirmText: 'Delete' }))) return;
  const i = app.store.days.findIndex(d => d.id === app.store.currentDayId);
  app.store.days.splice(i, 1);
  app.store.currentDayId = app.store.days[Math.max(0, i - 1)].id;
  save();
}
