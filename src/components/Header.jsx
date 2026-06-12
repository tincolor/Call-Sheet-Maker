import { storeSignal } from '../signals.js';
import { save } from '../store.js';
import { confirmDel } from '../utils.js';

// Logos are stored as data URLs in localStorage (~5MB quota); cap the longest
// edge so a phone photo can't blow the budget. PNG preserves transparency.
function downscaleImage(dataUrl, maxEdge) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = maxEdge / Math.max(img.width, img.height);
      if (scale >= 1) { resolve(dataUrl); return; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function Logos() {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];
  if (!state || !state.logos) return null;

  const handleAction = async (act, idx, anchor) => {
    if (act === 'remove') {
      if (!(await confirmDel('Remove this logo?', anchor))) return;
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
          downscaleImage(fr.result, 1000).then(dataUrl => {
            state.logos[idx].dataUrl = dataUrl;
            save();
          });
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
                  <button onClick={(e) => handleAction('remove', i, e.currentTarget)} title="Remove">×</button>
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
                  <button onClick={(e) => handleAction('remove', i, e.currentTarget)} title="Remove">×</button>
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
