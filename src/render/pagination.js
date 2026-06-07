const PAGE_MM = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

const PRINT_PADDING_MM = { top: 14, bottom: 16 };
const DEFAULT_ROW_HEIGHT = 40;

export function pxForMM(mm) {
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;top:-9999px;height:${mm}mm;visibility:hidden;pointer-events:none`;
  document.body.appendChild(el);
  const px = el.getBoundingClientRect().height;
  document.body.removeChild(el);
  return px;
}

export function measureDayLayout(state, paperSize = 'a4') {
  const root = document.querySelector('.pagination-measure');
  const paper = root?.querySelector('.paper');
  if (!root || !paper || !state) return null;

  const page = PAGE_MM[paperSize] || PAGE_MM.a4;
  const contentHeight =
    pxForMM(page.h) - pxForMM(PRINT_PADDING_MM.top) - pxForMM(PRINT_PADDING_MM.bottom);

  const headerHeight = Array.from(root.querySelectorAll('.measure-header .hd, .measure-header .hd2'))
    .reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
  const headerGap = pxForMM(8);

  const sections = {};
  root.querySelectorAll('.measure-sections .section[data-id]').forEach(sectionEl => {
    const id = sectionEl.dataset.id;
    const section = state.sections.find(sec => sec.id === id);
    if (!section) return;

    const rowEls = Array.from(sectionEl.querySelectorAll('tr[data-row-idx]'));
    const rowHeights = rowEls.map(row => ({
      idx: Number(row.dataset.rowIdx),
      height: row.getBoundingClientRect().height || DEFAULT_ROW_HEIGHT,
    }));
    const rowTotal = rowHeights.reduce((sum, row) => sum + row.height, 0);
    const addRowEl = sectionEl.querySelector('.add-row');
    const addControlsHeight = addRowEl ? addRowEl.getBoundingClientRect().height : 0;
    const tableHeadEl = sectionEl.querySelector('table.sched thead');
    const tableHeadHeight = tableHeadEl ? tableHeadEl.getBoundingClientRect().height : 0;
    const sectionHeadEl = sectionEl.querySelector('.section-head');
    const sectionHeadHeight = sectionHeadEl ? sectionHeadEl.getBoundingClientRect().height : 0;
    const continuationEl = root.querySelector(`.measure-continuation[data-section-id="${id}"]`);
    const continuationHeight = continuationEl ? continuationEl.getBoundingClientRect().height : 0;
    const fullHeight = sectionEl.getBoundingClientRect().height;

    sections[id] = {
      fullHeight,
      sectionHeadHeight,
      tableHeadHeight,
      rows: rowHeights,
      addControlsHeight,
      firstScheduleBase: Math.max(0, fullHeight - rowTotal - addControlsHeight),
      continuationBase: continuationHeight,
    };
  });

  return {
    contentHeight,
    page1Available: Math.max(0, contentHeight - headerHeight - headerGap),
    pageAvailable: contentHeight,
    sections,
  };
}

export function paginateDay(state, measurements) {
  if (!state || !measurements) return { pages: [{ items: [], breakBefore: null }] };

  const manualSectionBreaks = new Set(
    (state.pageBreaks || []).filter(b => b.before && !b.auto).map(b => b.before)
  );
  const manualRowBreaks = new Map();
  (state.pageBreaks || []).forEach(b => {
    if (!b.beforeRow) return;
    const rows = manualRowBreaks.get(b.beforeRow.sectionId) || new Set();
    rows.add(b.beforeRow.idx);
    manualRowBreaks.set(b.beforeRow.sectionId, rows);
  });

  const pages = [{ items: [], breakBefore: null }];
  let pageIdx = 0;
  let remaining = measurements.page1Available;

  const currentPage = () => pages[pageIdx];
  const hasContent = () => currentPage().items.length > 0;
  const nextPage = (breakBefore) => {
    pages.push({ items: [], breakBefore });
    pageIdx += 1;
    remaining = measurements.pageAvailable;
  };

  const addItem = (item, height) => {
    currentPage().items.push(item);
    remaining -= height;
  };

  (state.sections || []).forEach((section, sectionIndex) => {
    const m = measurements.sections[section.id];
    if (!m) return;

    if (sectionIndex > 0 && manualSectionBreaks.has(section.id) && hasContent()) {
      nextPage({ type: 'section', mode: 'manual', before: section.id });
    }

    if (section.type !== 'schedule') {
      if (hasContent() && m.fullHeight > remaining) {
        nextPage({ type: 'section', mode: 'auto', before: section.id });
      }
      addItem({ type: 'section', section, sectionIndex }, m.fullHeight);
      return;
    }

    paginateScheduleSection({
      section,
      sectionIndex,
      measurements: m,
      rowBreaks: manualRowBreaks.get(section.id) || new Set(),
      remainingRef: () => remaining,
      hasContent,
      addItem,
      nextPage,
    });
  });

  return { pages };
}

function paginateScheduleSection({
  section,
  sectionIndex,
  measurements,
  rowBreaks,
  remainingRef,
  hasContent,
  addItem,
  nextPage,
}) {
  const rows = section.data || [];
  const rowHeights = new Map(measurements.rows.map(row => [row.idx, row.height]));

  if (!rows.length) {
    const height = measurements.firstScheduleBase + measurements.addControlsHeight;
    if (hasContent() && height > remainingRef()) {
      nextPage({ type: 'section', mode: 'auto', before: section.id });
    }
    addItem({
      type: 'schedule',
      section,
      sectionIndex,
      start: 0,
      end: 0,
      continued: false,
      isFinal: true,
    }, height);
    return;
  }

  let rowIdx = 0;
  let continued = false;

  while (rowIdx < rows.length) {
    const base = continued ? measurements.continuationBase : measurements.firstScheduleBase;
    const firstRowHeight = rowHeights.get(rowIdx) || DEFAULT_ROW_HEIGHT;

    if (hasContent() && base + firstRowHeight > remainingRef()) {
      nextPage({
        type: continued ? 'schedule-row' : 'section',
        mode: 'auto',
        before: section.id,
        beforeRow: continued ? { sectionId: section.id, idx: rowIdx } : null,
      });
    }

    const start = rowIdx;
    let height = base;

    while (rowIdx < rows.length) {
      if (rowIdx > start && rowBreaks.has(rowIdx)) break;

      const rowHeight = rowHeights.get(rowIdx) || DEFAULT_ROW_HEIGHT;
      const finalControls = rowIdx === rows.length - 1 ? measurements.addControlsHeight : 0;
      const wouldOverflow = height + rowHeight + finalControls > remainingRef();

      if (rowIdx > start && wouldOverflow) break;
      height += rowHeight;
      rowIdx += 1;
    }

    const isFinal = rowIdx >= rows.length;
    if (isFinal) height += measurements.addControlsHeight;

    addItem({
      type: 'schedule',
      section,
      sectionIndex,
      start,
      end: rowIdx,
      continued,
      isFinal,
    }, height);

    if (!isFinal) {
      const manual = rowBreaks.has(rowIdx);
      nextPage({
        type: 'schedule-row',
        mode: manual ? 'manual' : 'auto',
        before: section.id,
        beforeRow: { sectionId: section.id, idx: rowIdx },
      });
      continued = true;
    }
  }
}
