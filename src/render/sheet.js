import { app } from '../store.js';
import { autoReflowSections } from './reflow.js';

export function renderSheet() {
  applyTweaks();
  requestAnimationFrame(autoReflowSections);
}

export function applyTweaks() {
  document.body.classList.add('hide-jp'); // JP labels always hidden
  document.body.classList.toggle('hide-logo', !app.store.tweaks.showLogo);

  const isLetter = app.store.tweaks.paperSize === 'letter';
  document.body.classList.toggle('paper-letter', isLetter);

  // update @page size for print
  let ps = document.getElementById('__pageSizeStyle');
  if (!ps) {
    ps = document.createElement('style');
    ps.id = '__pageSizeStyle';
    document.head.appendChild(ps);
  }
  ps.textContent = `@page { size: ${isLetter ? 'letter' : 'A4'}; margin: 0; }`;
}
