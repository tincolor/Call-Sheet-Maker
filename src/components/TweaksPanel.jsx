import { storeSignal } from '../signals.js';
import { app, save } from '../store.js';
import { applyTweaks, ACCENT_COLOURS } from '../render/sheet.js';

const COLOUR_LABELS = {
  red:    'Red',
  green:  'Neon Green',
  pink:   'Neon Pink',
  purple: 'Neon Purple',
  orange: 'Neon Orange',
};

export function TweaksPanel() {
  const store = storeSignal.value;
  if (!store) return <div class="tweaks"></div>;

  const isLetter = store.tweaks?.paperSize === 'letter';
  const showLogo = !!store.tweaks?.showLogo;
  const accentColor = store.tweaks?.accentColor || 'red';
  const darkMode = !!store.tweaks?.darkMode;

  const setPaperSize = (size) => {
    app.store.tweaks.paperSize = size;
    save(); applyTweaks();
  };

  const toggleLogo = () => {
    app.store.tweaks.showLogo = !app.store.tweaks.showLogo;
    save(); applyTweaks();
  };

  const toggleDarkMode = () => {
    app.store.tweaks.darkMode = !app.store.tweaks.darkMode;
    save(); applyTweaks();
  };

  const setAccent = (color) => {
    app.store.tweaks.accentColor = color;
    save(); applyTweaks();
  };

  return (
    <div class="tweaks">
      <h4>Options <button class="close" onClick={() => document.body.classList.remove('tweaks-open')}>×</button></h4>
      <div class="row">
        <label>Dark mode</label>
        <button class={`toggle${darkMode ? ' on' : ''}`} onClick={toggleDarkMode}></button>
      </div>
      <div class="row">
        <label>Page size</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            class={`size-btn${!isLetter ? ' active' : ''}`}
            title="A4 (210×297mm)"
            onClick={() => setPaperSize('a4')}
          >A4</button>
          <button
            class={`size-btn${isLetter ? ' active' : ''}`}
            title="US Letter (8.5×11in)"
            onClick={() => setPaperSize('letter')}
          >Letter</button>
        </div>
      </div>
      <div class="row">
        <label>Logo slot</label>
        <button class={`toggle${showLogo ? ' on' : ''}`} onClick={toggleLogo}></button>
      </div>
      <div class="row">
        <label>Color</label>
        <div class="color-swatches">
          {Object.entries(ACCENT_COLOURS).map(([key, hex]) => (
            <button
              key={key}
              class={`color-swatch${accentColor === key ? ' active' : ''}`}
              style={{ background: hex }}
              title={COLOUR_LABELS[key]}
              onClick={() => setAccent(key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
