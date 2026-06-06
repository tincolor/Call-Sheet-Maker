import { storeSignal } from '../signals.js';
import { app, save } from '../store.js';
import { applyTweaks } from '../render/sheet.js';

export function TweaksPanel() {
  const store = storeSignal.value;
  if (!store) return <div class="tweaks"></div>;

  const isLetter = store.tweaks?.paperSize === 'letter';
  const showLogo = !!store.tweaks?.showLogo;

  const setPaperSize = (size) => {
    app.store.tweaks.paperSize = size;
    save(); applyTweaks();
  };

  const toggleLogo = () => {
    app.store.tweaks.showLogo = !app.store.tweaks.showLogo;
    save(); applyTweaks();
  };

  return (
    <div class="tweaks">
      <h4>Tweaks <button class="close" onClick={() => document.body.classList.remove('tweaks-open')}>×</button></h4>
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
    </div>
  );
}
