import { render } from 'preact';
import { Pages } from './components/Pages.jsx';
import { AppBar } from './components/AppBar.jsx';
import { TweaksPanel } from './components/TweaksPanel.jsx';
import { IntakeSidebar } from './components/IntakeSidebar.jsx';
import { HowToUsePanel } from './components/HowToUsePanel.jsx';
import { load, app } from './store.js';
import { renderSheet } from './render/sheet.js';

export function boot() {
  document.body.classList.add('editing');
  app.store = load();
  renderSheet();

  const appBarRoot = document.getElementById('appBarRoot');
  if (appBarRoot) render(<AppBar />, appBarRoot);

  const tweaksPanelRoot = document.getElementById('tweaksPanelRoot');
  if (tweaksPanelRoot) render(<TweaksPanel />, tweaksPanelRoot);

  const howToUseRoot = document.getElementById('howToUseRoot');
  if (howToUseRoot) render(<HowToUsePanel />, howToUseRoot);

  const intakeSidebarRoot = document.getElementById('intakeSidebarRoot');
  if (intakeSidebarRoot) render(<IntakeSidebar />, intakeSidebarRoot);

  const pagesRoot = document.getElementById('pagesRoot');
  if (pagesRoot) render(<Pages />, pagesRoot);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
