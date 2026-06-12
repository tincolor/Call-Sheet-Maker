import { storeSignal, saveStatusSignal, prelimSignal } from '../signals.js';
import { app, save } from '../store.js';
import { CS_KEY } from '../constants.js';
import { DEFAULT_STORE } from '../data.js';
import { renderSheet } from '../render/sheet.js';
import { deleteDay } from '../days.js';
import { exportCSV, importCSV } from '../csv.js';
import { DaySwitcher } from './DaySwitcher.jsx';
import { confirmPopover } from '../utils.js';
import { setIntakeMemory } from '../intake.js';

export function AppBar() {
  const store = storeSignal.value;
  const saveStatus = saveStatusSignal.value;
  if (!store) return null;

  const isLetter = store.tweaks?.paperSize === 'letter';
  const isPrelim = prelimSignal.value;

  const togglePrelim = () => {
    prelimSignal.value = !isPrelim;
    document.body.classList.toggle('prelim', !isPrelim);
  };

  const handleReset = async (anchor) => {
    if (!(await confirmPopover(anchor, 'Wipe ALL days and start fresh? This cannot be undone.', { confirmText: 'Reset all' }))) return;
    localStorage.removeItem(CS_KEY);
    setIntakeMemory('');
    app.store = DEFAULT_STORE();
    save(); renderSheet();
  };

  return (
    <div class="appbar">
      <div class="appbar-left">
        <div class="brand">
          Call Sheet
          <span class="sub">
            <span>{isLetter ? 'Letter' : 'A4'}</span>
            {' · '}
            <span class="status">{saveStatus}</span>
          </span>
        </div>
      </div>
      <div class="day-switcher">
        <DaySwitcher />
      </div>
      <div class="spacer"></div>
      <button title="Delete current day" onClick={(e) => deleteDay(e.currentTarget)}>Delete Day</button>
      <button title="Import call sheets from a CSV file" onClick={(e) => importCSV(e.currentTarget)}>Import CSV</button>
      <button title="Export call sheet as CSV (current or all days)" onClick={(e) => exportCSV(e.currentTarget)}>Export CSV</button>
      <button title="Options" onClick={() => document.body.classList.toggle('tweaks-open')}>Options</button>
      <button title="Wipe all days" onClick={(e) => handleReset(e.currentTarget)}>Reset All</button>
      <button title="How to use this app" onClick={() => document.body.classList.toggle('how-to-use-open')}>How To Use</button>
      <button
        title="Toggle PRELIM watermark on each page"
        class={isPrelim ? 'active' : ''}
        onClick={togglePrelim}
      >Prelim</button>
      <button class="primary" title="Print or save as PDF (Cmd/Ctrl+P)" onClick={() => window.print()}>Print / PDF</button>
    </div>
  );
}
