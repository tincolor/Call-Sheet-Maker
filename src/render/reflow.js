import { app } from '../store.js';
import { renderSections } from './sections.js';

let _reflowing = false;

export const isReflowing = () => _reflowing;

export function autoReflow() {
  if (_reflowing) return;
  const paper = document.getElementById('paper');
  if (!paper) return;

  const mmToPx  = 96 / 25.4; // CSS pixels per mm (logical, not physical)
  const pageHPx = (app.store.tweaks.paperSize === 'letter' ? 279.4 : 297) * mmToPx;
  const padBotPx = 16 * mmToPx;
  const paperTop = paper.getBoundingClientRect().top;

  const needed = []; // { sectionId, idx } breaks to insert

  app.state.sections.forEach(sec => {
    if (sec.type !== 'schedule') return;
    const secEl = document.querySelector(`#sectionsHost .section[data-id="${sec.id}"]`);
    if (!secEl) return;
    const secBody = secEl.querySelector('.section-body');
    if (!secBody) return;

    // Walk children in DOM order: alternate between .sched-cont-wrap and table elements.
    // .sched-cont-wrap adds screen height that doesn't exist in print (it becomes padding-top
    // at the top of the new print page). Track this as extraScreenH so we can compute
    // each row's logical print position.
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
        if (idx === 0) return; // never break before the very first row

        // Logical bottom: screen position minus the extra height from cont-wrap divs
        const logicalBottom = tr.getBoundingClientRect().bottom - extraScreenH - paperTop;
        const pageNum  = Math.floor(logicalBottom / pageHPx);
        const pageBotY = (pageNum + 1) * pageHPx - padBotPx;

        if (logicalBottom > pageBotY) {
          // Skip if the user has explicitly pinned this row as no-break
          const pinned = app.state.noBreakPins && app.state.noBreakPins.some(p => p.sectionId === sec.id && p.idx === idx);
          if (!pinned) needed.push({ sectionId: sec.id, idx });
        }
      });
    });
  });

  // Deduplicate (keep only unique sectionId:idx pairs)
  const seen = new Set();
  const neededUniq = needed.filter(b => {
    const k = `${b.sectionId}:${b.idx}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // Compare with current auto-breaks
  const curAuto = app.state.pageBreaks
    .filter(b => b.auto && b.beforeRow)
    .map(b => `${b.beforeRow.sectionId}:${b.beforeRow.idx}`)
    .sort()
    .join(',');
  const wantAuto = neededUniq
    .map(b => `${b.sectionId}:${b.idx}`)
    .sort()
    .join(',');

  if (curAuto !== wantAuto) {
    _reflowing = true;
    app.state.pageBreaks = app.state.pageBreaks.filter(b => !b.auto);
    neededUniq.forEach(b =>
      app.state.pageBreaks.push({ beforeRow: { sectionId: b.sectionId, idx: b.idx }, auto: true })
    );
    renderSections();
    // Allow a second pass after layout settles, then push continuations to page boundaries
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _reflowing = false;
      adjustSectionBreakSpacing();
    }));
  }
}

// Pushes after-break sections and schedule continuation pages to the correct
// visual page boundary on screen (print uses break-before: page natively).
//
// All break points are measured together in the reset state, then paddings are
// applied in visual order with a cumulative-shift tracker. This prevents a
// compounding bug where setting padding N shifts break N+1 past a page
// boundary, causing each subsequent margin to become ~one full page too tall.
export function adjustSectionBreakSpacing() {
  const paper = document.getElementById('paper');
  if (!paper) return;
  const mmToPx      = 96 / 25.4;
  const pageH       = (app.store.tweaks.paperSize === 'letter' ? 279.4 : 297) * mmToPx;
  const pageSlot    = pageH + 20; // page height + 20px visual gap
  const topMarginPx = 26 * mmToPx; // screen preview: paper top padding + printable inset

  // ── 1. Reset ALL dynamic paddings ──
  document.querySelectorAll('.section.after-break').forEach(s => s.style.paddingTop = '');
  document.querySelectorAll('.sched-cont-content').forEach(c => c.style.paddingTop = '');
  document.querySelectorAll('.pbreak-marker, .sched-cont-wrap .brk-bar').forEach(el => {
    el.style.transform = '';
    el.style.visibility = '';
  });

  // Force synchronous reflow so subsequent getBCR calls are accurate
  const paperTop = paper.getBoundingClientRect().top;

  // ── 2. Snapshot every break point BEFORE any padding is applied ──
  const sectionBreaks = Array.from(document.querySelectorAll('.section.after-break')).map(section => {
    const top = section.getBoundingClientRect().top - paperTop;
    const content = section.querySelector('.section-head') || section;
    const marker = section.previousElementSibling?.classList.contains('pbreak-slot')
      ? section.previousElementSibling.querySelector('.pbreak-marker')
      : null;
    return {
      el: section,
      kind: 'section',
      refTop: top,
      getContentTop: () => content.getBoundingClientRect().top - paperTop,
      marker,
      getMarkerTop: () => marker ? marker.getBoundingClientRect().top - paperTop : null,
      applyPadding: px => { section.style.paddingTop = px > 0 ? `${px}px` : ''; },
    };
  });

  const scheduleBreaks = Array.from(document.querySelectorAll('.sched-cont-content')).map(content => {
    const bar    = content.closest('.sched-cont-wrap')?.querySelector('.brk-bar');
    const refTop = bar
      ? bar.getBoundingClientRect().top - paperTop
      : content.getBoundingClientRect().top - paperTop;
    return {
      el: content,
      kind: 'schedule',
      refTop,
      getContentTop: () => content.getBoundingClientRect().top - paperTop,
      marker: bar,
      getMarkerTop: () => bar ? bar.getBoundingClientRect().top - paperTop : null,
      applyPadding: px => { content.style.paddingTop = px > 0 ? `${px}px` : ''; },
    };
  });

  const snapshots = [...sectionBreaks, ...scheduleBreaks]
    .sort((a, b) => a.refTop - b.refTop);
  let nextTargetPage = 1;
  snapshots.forEach(snapshot => {
    snapshot.targetPage = Math.max(Math.ceil(snapshot.refTop / pageSlot), nextTargetPage);
    nextTargetPage = snapshot.targetPage + 1;
  });
  const scheduleMarkerPages = new Set(
    snapshots
      .filter(snapshot => snapshot.kind === 'schedule' && snapshot.marker)
      .map(snapshot => snapshot.targetPage)
  );

  // ── 3. Apply padding in page order using live positions ──
  snapshots.forEach(({ kind, targetPage, getContentTop, marker, getMarkerTop, applyPadding }) => {
    const actualTop     = getContentTop();                         // reflects prior padding
    const needed        = targetPage * pageSlot + topMarginPx - actualTop;
    const padding       = needed > 0 ? Math.round(needed) : 0;
    const markerTop     = getMarkerTop();
    if (marker && markerTop != null) {
      const duplicateSectionMarker = kind === 'section' && scheduleMarkerPages.has(targetPage);
      marker.style.visibility = duplicateSectionMarker ? 'hidden' : '';
      const markerH = marker.getBoundingClientRect().height;
      const pageGapTop = targetPage * pageSlot - 20;
      const markerTargetTop = pageGapTop + ((20 - markerH) / 2);
      marker.style.transform = `translateY(${Math.round(markerTargetTop - markerTop)}px)`;
    }
    applyPadding(padding);
  });
}
