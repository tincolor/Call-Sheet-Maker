import { app } from '../store.js';
import { isReflowing, runLayoutReflow } from './reflow.js';

export function renderSheet() {
  applyTweaks();
  // After layout settles, auto-calculate page breaks for schedule sections
  if (!isReflowing()) requestAnimationFrame(runLayoutReflow);
}

const ACCENT_COLOURS = {
  red:    '#B8402F',
  green:  '#77F44B',
  pink:   '#FF006E',
  purple: '#BF00FF',
  orange: '#FF6600',
};

// Colors where text on solid accent backgrounds should be black for contrast
const DARK_TEXT_ACCENTS = new Set(['green']);

export function applyTweaks() {
  document.body.classList.add('hide-jp'); // JP labels always hidden
  document.body.classList.toggle('hide-logo', !app.store.tweaks.showLogo);
  document.body.classList.toggle('dark-mode', !!app.store.tweaks.darkMode);

  const isLetter = app.store.tweaks.paperSize === 'letter';
  document.body.classList.toggle('paper-letter', isLetter);

  // Apply accent color
  const colorKey = app.store.tweaks.accentColor || 'red';
  const accent = ACCENT_COLOURS[colorKey] || ACCENT_COLOURS.red;
  const accentText = DARK_TEXT_ACCENTS.has(colorKey) ? '#000' : '#fff';
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-text', accentText);

  // update @page size for print
  let ps = document.getElementById('__pageSizeStyle');
  if (!ps) {
    ps = document.createElement('style');
    ps.id = '__pageSizeStyle';
    document.head.appendChild(ps);
  }
  ps.textContent = `@page { size: ${isLetter ? 'letter' : 'A4'}; margin: 0; }`;
}

export { ACCENT_COLOURS };
