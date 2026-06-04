import { useLayoutEffect } from 'preact/hooks';
import { storeSignal } from '../signals.js';
import { save } from '../store.js';
import { MULTILINE_META_KEYS } from '../constants.js';
import { esc, setEditableText, getEditableText, wireMultilineEditing, confirmDel } from '../utils.js';

export function Header() {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];

  useLayoutEffect(() => {
    if (!state || !state.meta) return;

    document.querySelectorAll('[data-k]').forEach(el => {
      const k = el.dataset.k;
      const v = state.meta[k];
      const multiline = MULTILINE_META_KEYS.has(k);

      // Only update DOM if the user is not currently editing the field
      if (document.activeElement !== el) {
        setEditableText(el, v ?? '', multiline);
        if (multiline) wireMultilineEditing(el);
      }

      if (el.dataset.wired) return;
      el.dataset.wired = '1';

      const commitChange = () => {
        state.meta[k] = getEditableText(el, multiline);
        save();
      };

      el.addEventListener('input', commitChange);
      el.addEventListener('blur', commitChange);
    });
  }, [state]);

  return null;
}

export function Logos() {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];
  if (!state || !state.logos) return null;

  const handleAction = (act, idx) => {
    if (act === 'remove') {
      if (!confirmDel('Remove this logo?')) return;
      state.logos.splice(idx, 1);
      save();
    } else if (act === 'upload' || act === 'replace') {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = () => {
          state.logos[idx].dataUrl = fr.result;
          save();
        };
        fr.readAsDataURL(f);
      };
      inp.click();
    }
  };

  const handleLabelChange = (idx, label) => {
    state.logos[idx].label = label;
    save();
  };

  const handleAdd = () => {
    state.logos.push({ label: '', dataUrl: '' });
    save();
  };

  return (
    <div style={{ display: 'contents' }}>
      {state.logos.map((logo, i) => (
        <div key={i} style={{ display: 'contents' }}>
          <div class="logo-item">
            {logo.dataUrl ? (
              <>
                <img src={logo.dataUrl} alt={logo.label} class="logo-img" />
                <div
                  class="logo-label"
                  contenteditable="true"
                  data-placeholder="Label"
                  onBlur={(e) => handleLabelChange(i, e.target.textContent)}
                >
                  {logo.label}
                </div>
                <div class="logo-ctrls">
                  <button onClick={() => handleAction('replace', i)} title="Replace image">⟳</button>
                  <button onClick={() => handleAction('remove', i)} title="Remove">×</button>
                </div>
              </>
            ) : (
              <>
                <button class="logo-upload" onClick={() => handleAction('upload', i)}>
                  + upload image
                </button>
                <div
                  class="logo-label"
                  contenteditable="true"
                  data-placeholder="Label"
                  onBlur={(e) => handleLabelChange(i, e.target.textContent)}
                >
                  {logo.label}
                </div>
                <div class="logo-ctrls">
                  <button onClick={() => handleAction('remove', i)} title="Remove">×</button>
                </div>
              </>
            )}
          </div>
          {i < state.logos.length - 1 && <div class="logo-rule" />}
        </div>
      ))}
      <button class="logo-add" onClick={handleAdd}>
        + Add logo
      </button>
    </div>
  );
}
