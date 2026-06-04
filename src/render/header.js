import { app, save } from '../store.js';
import { MULTILINE_META_KEYS } from '../constants.js';
import { esc, setEditableText, getEditableText, wireMultilineEditing, confirmDel } from '../utils.js';

export function renderHeader() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    const v = app.state.meta[k];
    const multiline = MULTILINE_META_KEYS.has(k);
    setEditableText(el, v ?? '', multiline);
    if (multiline) wireMultilineEditing(el);
    if (el.dataset.wired) return;
    el.dataset.wired = '1';
    const commit = () => {
      app.state.meta[k] = getEditableText(el, multiline);
      save();
    };
    el.addEventListener('input', commit);
    el.addEventListener('blur',  commit);
  });
}

export function renderLogos() {
  const wrap = document.getElementById('logoSlot');
  if (!wrap) return;
  wrap.innerHTML = '';
  app.state.logos.forEach((logo, i) => {
    const box = document.createElement('div');
    box.className = 'logo-item';
    if (logo.dataUrl) {
      box.innerHTML = `
        <img src="${esc(logo.dataUrl)}" alt="${esc(logo.label)}" class="logo-img" />
        <div class="logo-label" contenteditable="true" data-placeholder="Label">${esc(logo.label)}</div>
        <div class="logo-ctrls">
          <button data-act="replace" data-i="${i}" title="Replace image">⟳</button>
          <button data-act="remove"  data-i="${i}" title="Remove">×</button>
        </div>
      `;
    } else {
      box.innerHTML = `
        <button class="logo-upload" data-act="upload" data-i="${i}">+ upload image</button>
        <div class="logo-label" contenteditable="true" data-placeholder="Label">${esc(logo.label)}</div>
        <div class="logo-ctrls">
          <button data-act="remove" data-i="${i}" title="Remove">×</button>
        </div>
      `;
    }
    wrap.appendChild(box);
    if (i < app.state.logos.length - 1) {
      const rule = document.createElement('div');
      rule.className = 'logo-rule';
      wrap.appendChild(rule);
    }
  });

  // add logo button
  const add = document.createElement('button');
  add.className = 'logo-add';
  add.textContent = '+ Add logo';
  add.addEventListener('click', () => {
    app.state.logos.push({ label: '', dataUrl: '' });
    save(); renderLogos();
  });
  wrap.appendChild(add);

  wrap.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', e => handleLogoAction(btn.dataset.act, +btn.dataset.i));
  });
  wrap.querySelectorAll('.logo-label').forEach((el, i) => {
    el.addEventListener('blur', () => {
      app.state.logos[i].label = el.textContent;
      save();
    });
  });
}

export function handleLogoAction(act, i) {
  if (act === 'remove') {
    if (!confirmDel('Remove this logo?')) return;
    app.state.logos.splice(i, 1);
    save(); renderLogos();
    return;
  }
  if (act === 'upload' || act === 'replace') {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { app.state.logos[i].dataUrl = fr.result; save(); renderLogos(); };
      fr.readAsDataURL(f);
    };
    inp.click();
  }
}
