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
    const printPadPx = _pxForMM(14); // print override: padding-top: 14mm
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
export function recalculateAllPageBreaks() {
  if (_reflowing) return false;
  _mmCache = {}; // clear cache so zoom changes are picked up

  // Print paper uses padding: 14mm top, 16mm bottom, 12mm sides.
  const pageHPx  = _pxForMM(app.store.tweaks.paperSize === 'letter' ? 279.4 : 297);
  const padTopPx = _pxForMM(14);
  const padBotPx = _pxForMM(16);
  const contentH = pageHPx - padTopPx - padBotPx;
  const sectionMarginBotPx = _pxForMM(4); // print: sections-body > .section { margin-bottom: 4mm }

  const firstPaper = document.querySelector('.paper');
  if (!firstPaper) return false;

  // Header height is the same in screen and print
  let headerH = 0;
  firstPaper.querySelectorAll('.hd, .hd2').forEach(el => {
    headerH += el.getBoundingClientRect().height;
  });
  // Gap below header is 8mm
  const headerGapPx = _pxForMM(8);

  const page1Avail = contentH - headerH - headerGapPx;
  const pageNAvail = contentH;

  const secEls = Array.from(document.querySelectorAll('.section[data-id]'));
  if (!secEls.length) return false;

  // Gather current manual breaks
  const manualSectionBreaks = new Set(
    app.state.pageBreaks
      .filter(b => b.before && !b.auto)
      .map(b => b.before)
  );

  // Arrays to hold the new auto-breaks we calculate
  const neededSectionBreaks = [];

  let remaining = page1Avail;

  secEls.forEach((el, i) => {
    const id = el.dataset.id;
    const isSchedule = el.classList.contains('section--schedule');

    let isNewPage = false;
    if (i > 0 && manualSectionBreaks.has(id)) {
      remaining = pageNAvail;
      isNewPage = true;
    }

    if (isSchedule) {
      const h = _printHeight(el, sectionMarginBotPx);

      // If the schedule fits within a single page, treat it as an atomic block
      if (h <= pageNAvail) {
        if (i > 0 && !isNewPage && remaining - h < 0) {
          // Doesn't fit on current page — push to next page
          neededSectionBreaks.push(id);
          remaining = pageNAvail - h;
        } else {
          remaining -= h;
        }
      } else {
        // Schedule is larger than one page: it must start on the current page and
        // overflow into subsequent pages. Only push to next page if there's not
        // enough room to even begin it (min: section-head + table-head + one row ~40px).
        const secHead = el.querySelector('.section-head');
        const tableHead = el.querySelector('table thead');
        const secHeadH = secHead ? secHead.getBoundingClientRect().height : 0;
        const tableHeadH = tableHead ? tableHead.getBoundingClientRect().height : 0;
        const minH = secHeadH + tableHeadH + 40;

        if (i > 0 && !isNewPage && remaining < minH) {
          neededSectionBreaks.push(id);
          remaining = pageNAvail;
          isNewPage = true;
        }

        // The schedule consumes all of the current page's remaining space and
        // then continues across whole pages. Calculate how much is left on the
        // final page it occupies.
        const leftover = h - remaining;
        if (leftover > 0) {
          const lastPageOccupied = leftover % pageNAvail;
          remaining = lastPageOccupied > 0 ? pageNAvail - lastPageOccupied : pageNAvail;
        } else {
          remaining -= h;
        }
      }
    } else {
      // Non-schedule section: always treated as an atomic block
      const h = _printHeight(el, sectionMarginBotPx);
      if (i > 0 && !isNewPage && remaining - h < 0) {
        neededSectionBreaks.push(id);
        remaining = pageNAvail - h;
      } else {
        remaining -= h;
      }
    }
  });

  // Check if the calculated auto-breaks differ from current auto-breaks
  const curAutoSections = app.state.pageBreaks
    .filter(b => b.auto && b.before)
    .map(b => b.before).sort().join(',');
  const wantAutoSections = [...neededSectionBreaks].sort().join(',');

  if (curAutoSections !== wantAutoSections) {
    _reflowing = true;
    
    // Clear all auto breaks
    app.state.pageBreaks = app.state.pageBreaks.filter(b => !b.auto);

    // Add new auto section breaks
    neededSectionBreaks.forEach(secId => {
      app.state.pageBreaks.push({ before: secId, auto: true });
    });

    commit();
    _reflowing = false;
    return true;
  }

  return false;
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
  const topMarginPx = 14 * mmToPx;

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

export function runLayoutReflow() {
  if (_reflowing) return;

  _mmCache = {};

  const changed = recalculateAllPageBreaks();
  if (changed) return;

  adjustSectionBreakSpacing();
}
