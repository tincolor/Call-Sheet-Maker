import { useEffect, useRef, useState } from 'preact/hooks';
import { save } from '../store.js';
import { storeSignal } from '../signals.js';
import { uid } from '../utils.js';
import { BLANK_DAY } from '../data.js';

export function DaySwitcher() {
  const store = storeSignal.value;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  if (!store || !store.days) return null;

  const handleSwitch = (id) => {
    store.currentDayId = id;
    save();
  };

  const addDay = (kind) => {
    setMenuOpen(false);
    let d;
    if (kind === 'blank') {
      d = BLANK_DAY();
    } else {
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
      if (kind === 'dup-clear') {
        d.sections.forEach(s => {
          if (s.type === 'schedule') s.data = [];
        });
        if (d.meta) {
          d.meta.date = '';
          d.meta.day = String((parseInt(state.meta?.day) || 0) + 1 || '');
        }
      }
    }
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
      <div class="day-add-wrap" ref={menuRef}>
        <button class="day-btn day-add" title="Add a new day" onClick={() => setMenuOpen(o => !o)}>
          +
        </button>
        {menuOpen && (
          <div class="day-add-menu">
            <button onClick={() => addDay('dup-clear')}>
              <b>Next day</b>
              <span>Duplicate current day, schedule cleared</span>
            </button>
            <button onClick={() => addDay('dup-full')}>
              <b>Duplicate day</b>
              <span>Full copy of the current day</span>
            </button>
            <button onClick={() => addDay('blank')}>
              <b>Blank day</b>
              <span>Start from an empty template</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
