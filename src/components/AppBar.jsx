import { storeSignal, saveStatusSignal } from '../signals.js';
import { app, save } from '../store.js';
import { CS_KEY } from '../constants.js';
import { DEFAULT_STORE } from '../data.js';
import { renderSheet } from '../render/sheet.js';
import { deleteDay } from '../days.js';
import { exportCSV, importCSV } from '../csv.js';
import { DaySwitcher } from './DaySwitcher.jsx';

export function AppBar() {
  const store = storeSignal.value;
  const saveStatus = saveStatusSignal.value;
  if (!store) return null;

  const isLetter = store.tweaks?.paperSize === 'letter';

  const handleReset = () => {
    if (!confirm('Wipe ALL days and start fresh? (Cannot undo.)')) return;
    localStorage.removeItem(CS_KEY);
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
      <button title="Delete current day" onClick={deleteDay}>Delete Day</button>
      <button title="Import CSV into current day" onClick={importCSV}>Import CSV</button>
      <button title="Export current day as CSV" onClick={exportCSV}>Export CSV</button>
      <button title="Tweaks" onClick={() => document.body.classList.toggle('tweaks-open')}>Tweaks</button>
      <button title="Wipe all days" onClick={handleReset}>Reset All</button>
      <button class="primary" title="Print or save as PDF (Cmd/Ctrl+P)" onClick={() => window.print()}>Print / PDF</button>
    </div>
  );
}
