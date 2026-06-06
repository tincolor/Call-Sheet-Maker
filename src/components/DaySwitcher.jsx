import { save } from '../store.js';
import { storeSignal } from '../signals.js';
import { uid } from '../utils.js';
import { BLANK_DAY } from '../data.js';

export function DaySwitcher() {
  const store = storeSignal.value;
  if (!store || !store.days) return null;

  const handleSwitch = (id) => {
    store.currentDayId = id;
    save();
  };

  const handleNewDay = () => {
    const choice = prompt('New day:\n  1 = Blank day\n  2 = Duplicate current day (schedule cleared)\n  3 = Duplicate current day (full copy)', '2');
    if (!choice) return;
    let d;
    if (choice === '1') {
      d = BLANK_DAY();
    } else if (choice === '2' || choice === '3') {
      const state = store.days.find(day => day.id === store.currentDayId) || store.days[0];
      d = JSON.parse(JSON.stringify(state));
      d.id = uid();
      d.sections = d.sections.map(s => ({
        ...s,
        id: uid(),
        data: Array.isArray(s.data) ? s.data.map(r => ({ ...r })) : { ...s.data }
      }));
      d.pageBreaks = [];
      if (d.meta) d.meta.headerNote = '';
      if (choice === '2') {
        d.sections.forEach(s => {
          if (s.type === 'schedule') s.data = [];
        });
        if (d.meta) {
          d.meta.date = '';
          d.meta.day = String((parseInt(state.meta?.day) || 0) + 1 || '');
        }
      }
    } else return;
    store.days.push(d);
    store.currentDayId = d.id;
    save();
  };

  return (
    <div style={{ display: 'contents' }}>
      {store.days.map((d, i) => {
        const isActive = d.id === store.currentDayId;
        const label = (d.meta?.date || '').trim() || `Day ${d.meta?.day || (i + 1)}`;
        const sub = d.meta?.day ? `Day ${d.meta.day}` : '';
        const showSub = sub && sub !== label;

        return (
          <button
            key={d.id}
            class={`day-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleSwitch(d.id)}
          >
            <span class="day-btn-top">{label}</span>
            {showSub && <span class="day-btn-sub">{sub}</span>}
          </button>
        );
      })}
      <button class="day-btn day-add" title="Add a new day" onClick={handleNewDay}>
        +
      </button>
    </div>
  );
}
