import { Fragment } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { SheetHeader } from './SheetHeader.jsx';
import { Sections, addSection } from './Sections.jsx';
import { storeSignal, autoBreaksSignal } from '../signals.js';
import { save } from '../store.js';
import { scheduleReflow, adjustSectionBreakSpacing } from '../render/reflow.js';

function splitIntoPages(sections, pageBreaks) {
  const breakBefore = new Set([
    ...pageBreaks.filter(b => b.before).map(b => b.before),  // manual breaks
    ...autoBreaksSignal.value,                                 // auto breaks (transient)
  ]);
  const pages = [[]];
  for (const sec of sections) {
    if (breakBefore.has(sec.id)) pages.push([]);
    pages[pages.length - 1].push(sec);
  }
  return pages;
}

export function Pages() {
  const store = storeSignal.value;
  const autoBreaks = autoBreaksSignal.value; // subscribe so re-render fires when auto breaks change
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];

  useLayoutEffect(() => {
    scheduleReflow();
  }, [store]);

  if (!state) return null;

  const { sections = [], pageBreaks = [] } = state;
  const manualBreakIds = new Set(pageBreaks.filter(b => b.before).map(b => b.before));
  const pageGroups = splitIntoPages(sections, pageBreaks);

  let offset = 0;
  const pageOffsets = pageGroups.map(group => {
    const o = offset;
    offset += group.length;
    return o;
  });

  const removeBreak = (sectionId) => {
    state.pageBreaks = state.pageBreaks.filter(b => b.before !== sectionId);
    save();
  };

  return (
    <Fragment>
      {pageGroups.map((pageSections, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === pageGroups.length - 1;
        const nextFirstId = !isLast ? pageGroups[pageIdx + 1]?.[0]?.id : null;
        const nextBreakIsManual = nextFirstId && manualBreakIds.has(nextFirstId);

        return (
          <div class="paper" id={isFirst ? 'paper' : undefined} key={`page-${pageIdx}`}>
            {isFirst && <SheetHeader />}
            <Sections
              sections={pageSections}
              pageBreaks={pageBreaks}
              startIdx={pageOffsets[pageIdx]}
            />
            {isLast && (
              <div class="add-sec">
                <div class="add-sec-title">Add section</div>
                <div class="add-sec-buttons">
                  <button onClick={() => addSection('schedule')}>+ Schedule</button>
                  <button onClick={() => addSection('contacts')}>+ Contacts</button>
                  <button onClick={() => addSection('equipment')}>+ Equipment</button>
                  <button onClick={() => addSection('hospital')}>+ Hospital</button>
                  <button onClick={() => addSection('basecamp')}>+ Parking / Basecamp</button>
                  <button onClick={() => addSection('notes')}>+ Notes</button>
                </div>
              </div>
            )}
            {!isLast && nextFirstId && (
              <div class="page-break-ctrl">
                {nextBreakIsManual
                  ? <button class="page-break-rm" onClick={() => removeBreak(nextFirstId)}>✕ remove page break</button>
                  : <span class="page-break-auto-label">auto page break</span>
                }
              </div>
            )}
          </div>
        );
      })}
    </Fragment>
  );
}
