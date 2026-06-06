import { app } from '../store.js';
import { isReflowing, runLayoutReflow } from './reflow.js';

export function renderSheet() {
  applyTweaks();
  // After layout settles, auto-calculate page breaks for schedule sections
  if (!isReflowing()) requestAnimationFrame(runLayoutReflow);
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
