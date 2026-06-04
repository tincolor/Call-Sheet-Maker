import { app } from '../store.js';
import { commit } from '../signals.js';

let _reflowing = false;

export const isReflowing = () => _reflowing;

// Measures a CSS length in actual browser pixels, correctly handling zoom/DPI.
let _mmCache = {};
function _pxForMM(mm) {
  if (_mmCache[mm] !== undefined) return _mmCache[mm];
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;top:-9999px;height:${mm}mm;visibility:hidden;pointer-events:none`;
  document.body.appendChild(el);
  const px = el.getBoundingClientRect().height;
  document.body.removeChild(el);
  return (_mmCache[mm] = px);
}

// Returns the approximate PRINT height of a section element.
// Print CSS differs from screen in three ways we must correct for:
//   1. Sections lose their screen-only padding-top: 8px
//   2. Sections gain print margin-bottom: 4mm
//   3. Schedule continuations lose their large screen-only padding-top
//      (adjustSectionBreakSpacing inflates them; print uses break-before:page instead)
function _printHeight(el, printMarginBotPx) {
  let h = el.getBoundingClientRect().height;
  h -= 8;                   // remove screen-only padding-top: 8px
  h += printMarginBotPx;    // add print margin-bottom: 4mm

  // Strip schedule continuation screen-only spacing
  el.querySelectorAll('.sched-cont-content').forEach(cont => {
    const screenPad = parseFloat(cont.style.paddingTop) || 0;
    const printPadPx = _pxForMM(12); // print override: padding-top: 12mm
    h -= Math.max(0, screenPad - printPadPx);
  });
  el.querySelectorAll('.sched-cont-wrap .brk-bar').forEach(bar => {
    h -= bar.getBoundingClientRect().height;
  });
  return h;
}

// Measures rendered section print-heights and inserts auto breaks wherever
// sections would overflow a page.  Uses print CSS values for padding/spacing
// rather than screen values, since the two differ significantly.
export function autoReflowSections() {
  if (_reflowing) return;
  _mmCache = {}; // clear cache so zoom changes are picked up

  // Print paper uses padding: 12mm (all sides), not the screen 14/12/16mm.
  const pageHPx  = _pxForMM(app.store.tweaks.paperSize === 'letter' ? 279.4 : 297);
  const padPx    = _pxForMM(12); // print padding: equal on all sides
  const contentH = pageHPx - padPx - padPx;
  const sectionMarginBotPx = _pxForMM(4); // print: sections-body > .section { margin-bottom: 4mm }

  const firstPaper = document.querySelector('.paper');
  if (!firstPaper) return;

  // Header height is the same in screen and print
  let headerH = 0;
  firstPaper.querySelectorAll('.hd, .hd2').forEach(el => {
    headerH += el.getBoundingClientRect().height;
  });
  // No sections-body margin-top in print (that is screen-only via .hd2 ~ .sections-body)
  const headerGapPx = 0;

  const page1Avail = contentH - headerH - headerGapPx;
  const pageNAvail = contentH;

  const secEls = Array.from(document.querySelectorAll('.section[data-id]'));
  if (!secEls.length) return;

  const neededBreaks = [];
  let remaining = page1Avail;

  secEls.forEach((el, i) => {
    const h = _printHeight(el, sectionMarginBotPx);
    if (i > 0 && remaining - h < 0) {
      neededBreaks.push(el.dataset.id);
      remaining = pageNAvail - h;
    } else {
      remaining -= h;
    }
  });

  const curAuto = app.state.pageBreaks
    .filter(b => b.auto && b.before)
    .map(b => b.before).sort().join(',');
  const wantAuto = [...neededBreaks].sort().join(',');

  if (curAuto !== wantAuto) {
    _reflowing = true;
    app.state.pageBreaks = app.state.pageBreaks.filter(b => !(b.auto && b.before));
    neededBreaks.forEach(id => app.state.pageBreaks.push({ before: id, auto: true }));
    commit();
    requestAnimationFrame(() => {
      _reflowing = false;
      requestAnimationFrame(adjustSectionBreakSpacing);
    });
  }
}

export function autoReflow() {
  if (_reflowing) return;

  const mmToPx  = 96 / 25.4;
  const pageHPx = (app.store.tweaks.paperSize === 'letter' ? 279.4 : 297) * mmToPx;
  const padBotPx = 16 * mmToPx;

  const needed = [];

  app.state.sections.forEach(sec => {
    if (sec.type !== 'schedule') return;
    const secEl = document.querySelector(`.section[data-id="${sec.id}"]`);
    if (!secEl) return;
    const secBody = secEl.querySelector('.section-body');
    if (!secBody) return;

    const paperEl = secEl.closest('.paper');
    if (!paperEl) return;
    const paperTop = paperEl.getBoundingClientRect().top;

    let extraScreenH = 0;

    Array.from(secBody.children).forEach(child => {
      if (child.classList.contains('sched-cont-wrap')) {
        extraScreenH += child.getBoundingClientRect().height;
        return;
      }
      if (child.tagName !== 'TABLE') return;

      Array.from(child.querySelectorAll('tbody tr')).forEach(tr => {
        if (tr.classList.contains('sched-page-footer')) return;
        const dataEl = tr.querySelector('[data-i]');
        if (!dataEl) return;
        const idx = +dataEl.dataset.i;
        if (idx === 0) return;

        const logicalBottom = tr.getBoundingClientRect().bottom - extraScreenH - paperTop;
        const pageNum  = Math.floor(logicalBottom / pageHPx);
        const pageBotY = (pageNum + 1) * pageHPx - padBotPx;

        if (logicalBottom > pageBotY) {
          const pinned = app.state.noBreakPins && app.state.noBreakPins.some(p => p.sectionId === sec.id && p.idx === idx);
          if (!pinned) needed.push({ sectionId: sec.id, idx });
        }
      });
    });
  });

  const seen = new Set();
  const neededUniq = needed.filter(b => {
    const k = `${b.sectionId}:${b.idx}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  const curAuto = app.state.pageBreaks
    .filter(b => b.auto && b.beforeRow)
    .map(b => `${b.beforeRow.sectionId}:${b.beforeRow.idx}`)
    .sort().join(',');
  const wantAuto = neededUniq
    .map(b => `${b.sectionId}:${b.idx}`)
    .sort().join(',');

  if (curAuto !== wantAuto) {
    _reflowing = true;
    app.state.pageBreaks = app.state.pageBreaks.filter(b => !b.auto);
    neededUniq.forEach(b =>
      app.state.pageBreaks.push({ beforeRow: { sectionId: b.sectionId, idx: b.idx }, auto: true })
    );
    commit();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _reflowing = false;
      adjustSectionBreakSpacing();
    }));
  }
}

// Pushes schedule continuation pages to the correct visual page boundary on screen.
// Each .paper div is one page slot; continuations within a page are pushed to the
// next pageH+20px boundary measured from that paper's top.
export function adjustSectionBreakSpacing() {
  document.querySelectorAll('.paper').forEach(_adjustPaper);
}

function _adjustPaper(paper) {
  const mmToPx      = 96 / 25.4;
  const pageH       = (app.store.tweaks.paperSize === 'letter' ? 279.4 : 297) * mmToPx;
  const pageSlot    = pageH + 20;
  const topMarginPx = 26 * mmToPx;

  paper.querySelectorAll('.sched-cont-content').forEach(c => c.style.paddingTop = '');
  paper.querySelectorAll('.sched-cont-wrap .brk-bar').forEach(el => {
    el.style.transform = '';
    el.style.visibility = '';
  });

  const paperTop = paper.getBoundingClientRect().top;

  const schedBreaks = Array.from(paper.querySelectorAll('.sched-cont-content')).map(content => {
    const bar    = content.closest('.sched-cont-wrap')?.querySelector('.brk-bar');
    const refTop = bar
      ? bar.getBoundingClientRect().top - paperTop
      : content.getBoundingClientRect().top - paperTop;
    return {
      refTop,
      getContentTop: () => content.getBoundingClientRect().top - paperTop,
      marker: bar,
      getMarkerTop: () => bar ? bar.getBoundingClientRect().top - paperTop : null,
      applyPadding: px => { content.style.paddingTop = px > 0 ? `${px}px` : ''; },
    };
  });

  schedBreaks.sort((a, b) => a.refTop - b.refTop);

  let nextTargetPage = 1;
  schedBreaks.forEach(sb => {
    sb.targetPage = Math.max(Math.ceil(sb.refTop / pageSlot), nextTargetPage);
    nextTargetPage = sb.targetPage + 1;
  });

  schedBreaks.forEach(({ targetPage, getContentTop, marker, getMarkerTop, applyPadding }) => {
    const actualTop = getContentTop();
    const needed    = targetPage * pageSlot + topMarginPx - actualTop;
    const padding   = needed > 0 ? Math.round(needed) : 0;
    const markerTop = getMarkerTop();
    if (marker && markerTop != null) {
      const markerH        = marker.getBoundingClientRect().height;
      const pageGapTop     = targetPage * pageSlot - 20;
      const markerTargetTop = pageGapTop + ((20 - markerH) / 2);
      marker.style.transform = `translateY(${Math.round(markerTargetTop - markerTop)}px)`;
    }
    applyPadding(padding);
  });
}
