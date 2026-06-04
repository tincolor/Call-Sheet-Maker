import { app } from '../store.js';
import { renderHeader, renderLogos } from './header.js';
import { renderSections } from './sections.js';
import { renderDaySwitcher } from '../days.js';
import { isReflowing, autoReflow } from './reflow.js';

export function renderSheet() {
  renderHeader();
  renderLogos();
  renderSections();
  applyTweaks();
  renderDaySwitcher();
  // After layout settles, auto-calculate page breaks for schedule sections
  if (!isReflowing()) requestAnimationFrame(autoReflow);
}

export function applyTweaks() {
  document.body.classList.add('hide-jp'); // JP labels always hidden
  document.body.classList.toggle('hide-logo', !app.store.tweaks.showLogo);
  
  // paper size
  const isLetter = app.store.tweaks.paperSize === 'letter';
  document.body.classList.toggle('paper-letter', isLetter);
  const lbl = document.getElementById('paperSizeLabel');
  if (lbl) lbl.textContent = isLetter ? 'Letter' : 'A4';
  
  // update @page size for print
  let ps = document.getElementById('__pageSizeStyle');
  if (!ps) {
    ps = document.createElement('style');
    ps.id = '__pageSizeStyle';
    document.head.appendChild(ps);
  }
  ps.textContent = `@page { size: ${isLetter ? 'letter' : 'A4'}; margin: 0; }`;
  
  // size buttons
  const btnA4 = document.getElementById('btnSizeA4');
  const btnLetter = document.getElementById('btnSizeLetter');
  if (btnA4) btnA4.classList.toggle('active', !isLetter);
  if (btnLetter) btnLetter.classList.toggle('active', isLetter);
  
  // other toggles
  document.querySelectorAll('[data-tweak]').forEach(el => {
    const k = el.dataset.tweak;
    if (el.classList.contains('toggle')) el.classList.toggle('on', !!app.store.tweaks[k]);
  });
}
