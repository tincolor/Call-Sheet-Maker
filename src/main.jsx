import { render } from 'preact';
import { Sections } from './components/Sections.jsx';
import { Header, Logos } from './components/Header.jsx';
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
  renderSheet(); // applies tweaks (incl. paper size) + reflow

  // Mount reactive Header metadata bindings
  const headerDummy = document.createElement('div');
  headerDummy.style.display = 'none';
  document.body.appendChild(headerDummy);
  render(<Header />, headerDummy);

  // Mount reactive Logos
  const logoSlot = document.getElementById('logoSlot');
  if (logoSlot) render(<Logos />, logoSlot);

  // Mount reactive DaySwitcher
  const daySwitcher = document.getElementById('daySwitcher');
  if (daySwitcher) render(<DaySwitcher />, daySwitcher);

  // Mount reactive Sections
  const host = document.getElementById('sectionsHost');
  if (host) render(<Sections />, host);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
