import { render } from 'preact';
import { Pages } from './components/Pages.jsx';
import { DaySwitcher } from './components/DaySwitcher.jsx';
import { load, app } from './store.js';
import { initChrome } from './chrome.js';
import { initIntake } from './intake.js';
import { renderSheet } from './render/sheet.js';

export function boot() {
  document.body.classList.add('editing');
  app.store = load();
  initChrome();
  initIntake();
  renderSheet();

  const daySwitcher = document.getElementById('daySwitcher');
  if (daySwitcher) render(<DaySwitcher />, daySwitcher);

  const pagesRoot = document.getElementById('pagesRoot');
  if (pagesRoot) render(<Pages />, pagesRoot);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
