import { app } from '../store.js';
import { autoBreaksSignal, scheduleOverflowSignal } from '../signals.js';

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

// Returns the section's height as it would appear in print.
// Screen layout is now aligned to print (margin-bottom: 4mm on both), so
// getBoundingClientRect().height is accurate — except for schedule sections
// that have manual row breaks, where adjustSectionBreakSpacing() inflates
// .sched-cont-content with large screen-only padding-top values.
function _printHeight(el) {
  let h = el.getBoundingClientRect().height;
  el.querySelectorAll('.sched-cont-content').forEach(cont => {
    const screenPad = parseFloat(cont.style.paddingTop) || 0;
    const printPadPx = _pxForMM(14); // print override: padding-top: 14mm
    h -= Math.max(0, screenPad - printPadPx);
  });
  el.querySelectorAll('.sched-cont-wrap .brk-bar').forEach(bar => {
    h -= bar.getBoundingClientRect().height;
  });
  return h;
}

let _reflowTimer = null;

// Debounced entry point — call this from components instead of autoReflowSections directly.
export function scheduleReflow() {
  clearTimeout(_reflowTimer);
  _reflowTimer = setTimeout(() => requestAnimationFrame(autoReflowSections), 150);
}

// Calculates which sections need auto page breaks and updates autoBreaksSignal and
// scheduleOverflowSignal. Never mutates app.state — all output is transient.
//
// Algorithm:
//   - Walk sections in DOM order.
//   - Manual breaks (from state.pageBreaks) reset available space for a new page.
//   - Non-schedule sections that would overflow → auto break.
//   - Schedule section → never auto-break before it; measure overflow instead.
export function autoReflowSections() {
  _mmCache = {}; // clear so zoom changes are picked up

  const paperSize = app.store?.tweaks?.paperSize;
  if (!paperSize) return;

  const paperHPx  = _pxForMM(paperSize === 'letter' ? 279.4 : 297);
  const padTopPx  = _pxForMM(14); // print padding-top
  const padBotPx  = _pxForMM(16); // print padding-bottom
  const contentH  = paperHPx - padTopPx - padBotPx;

  const firstPaper = document.querySelector('.paper');
  if (!firstPaper) return;

  // Header occupies the same height on screen and print (.hd / .hd2 have no screen-only sizing).
  let headerH = 0;
  firstPaper.querySelectorAll('.hd, .hd2').forEach(el => {
    headerH += el.getBoundingClientRect().height;
  });

  const page1Avail = contentH - headerH;
  const pageNAvail = contentH;

  const secEls = Array.from(document.querySelectorAll('.section[data-id]'));
  if (!secEls.length) {
    autoBreaksSignal.value = [];
    scheduleOverflowSignal.value = null;
    return;
  }

  const sectionMarginPx = _pxForMM(4); // margin-bottom: 4mm on every section (screen + print)

  const manualBreakIds = new Set(
    (app.state.pageBreaks || []).filter(b => b.before).map(b => b.before)
  );

  const autoBreaks = [];
  let scheduleOverflow = null;
  let remaining = page1Avail;

  secEls.forEach((el, i) => {
    const id = el.dataset.id;

    if (manualBreakIds.has(id)) {
      // Forced new page — reset available space
      remaining = pageNAvail;
    }

    const h = _printHeight(el) + sectionMarginPx;
    const isSchedule = el.classList.contains('section--schedule');

    if (isSchedule && h > pageNAvail) {
      // Schedule is longer than a full page — auto-breaking won't help since it won't
      // fit anywhere. Leave it in place and show the overflow indicator so the user
      // can manually add a row break.
      scheduleOverflow = { sectionId: id, overflowPx: h - remaining };
      remaining -= h;
    } else if (i > 0 && remaining < h) {
      // Section doesn't fit on the current page — auto-break before it.
      // Applies equally to schedule (when it fits on a fresh page) and all other sections.
      autoBreaks.push(id);
      remaining = pageNAvail - h;
    } else {
      remaining -= h;
    }
  });

  autoBreaksSignal.value = autoBreaks;
  scheduleOverflowSignal.value = scheduleOverflow;

  // After updating page groupings, re-run visual spacing for screen layout.
  requestAnimationFrame(adjustSectionBreakSpacing);
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
