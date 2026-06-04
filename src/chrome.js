import { app, save } from './store.js';
import { CS_KEY } from './constants.js';
import { DEFAULT_STORE } from './data.js';
import { renderSheet, applyTweaks } from './render/sheet.js';
import { deleteDay } from './days.js';
import { exportCSV, importCSV } from './csv.js';
import { addSection } from './components/Sections.jsx';
import { initIntakeResize } from './intake.js';

export function initChrome() {
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) btnPrint.addEventListener('click', () => window.print());

  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (!confirm('Wipe ALL days and start fresh? (Cannot undo.)')) return;
      localStorage.removeItem(CS_KEY);
      app.store = DEFAULT_STORE();
      save(); renderSheet();
    });
  }

  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) btnExport.addEventListener('click', exportCSV);

  const btnImport = document.getElementById('btnImportCSV');
  if (btnImport) btnImport.addEventListener('click', importCSV);

  const bDel = document.getElementById('btnDelDay');
  if (bDel) bDel.addEventListener('click', deleteDay);

  // add section
  document.querySelectorAll('[data-new]').forEach(b => 
    b.addEventListener('click', () => addSection(b.dataset.new))
  );

  // tweaks
  const btnTweaks = document.getElementById('btnTweaks');
  if (btnTweaks) {
    btnTweaks.addEventListener('click', () =>
      document.body.classList.toggle('tweaks-open')
    );
  }
  const tweaksClose = document.getElementById('tweaksClose');
  if (tweaksClose) {
    tweaksClose.addEventListener('click', () =>
      document.body.classList.remove('tweaks-open')
    );
  }
  document.querySelectorAll('[data-tweak]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.tweak;
      app.store.tweaks[k] = !app.store.tweaks[k];
      save(); applyTweaks();
    });
  });

  // page size buttons
  const bA4 = document.getElementById('btnSizeA4');
  const bLetter = document.getElementById('btnSizeLetter');
  if (bA4) bA4.addEventListener('click', () => { app.store.tweaks.paperSize = 'a4'; save(); applyTweaks(); });
  if (bLetter) bLetter.addEventListener('click', () => { app.store.tweaks.paperSize = 'letter'; save(); applyTweaks(); });

  initIntakeResize();
}
