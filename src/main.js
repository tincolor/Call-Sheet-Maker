import { load, app } from './store.js';
import { initChrome } from './chrome.js';
import { initIntake } from './intake.js';
import { renderDaySwitcher } from './days.js';
import { renderSheet } from './render/sheet.js';

export function boot() {
  document.body.classList.add('editing');
  app.store = load();
  initChrome();
  initIntake();
  renderDaySwitcher();
  renderSheet(); // renders header + sections + applies tweaks (incl. paper size)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
