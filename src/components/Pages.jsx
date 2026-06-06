import { Fragment } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { SheetHeader } from './SheetHeader.jsx';
import { Sections, addSection } from './Sections.jsx';
import { storeSignal } from '../signals.js';
import { save } from '../store.js';
import { runLayoutReflow } from '../render/reflow.js';

function splitIntoPages(sections, pageBreaks) {
  const breakBefore = new Set(pageBreaks.filter(b => b.before).map(b => b.before));
  const pages = [[]];
  for (const sec of sections) {
    if (breakBefore.has(sec.id)) pages.push([]);
    pages[pages.length - 1].push(sec);
  }
  return pages;
}

export function Pages() {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];

  useLayoutEffect(() => {
    requestAnimationFrame(runLayoutReflow);
  }, [store]);

  if (!state) return null;

  const { sections = [], pageBreaks = [] } = state;
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
        const isAutoBreak = nextFirstId ? pageBreaks.some(b => b.before === nextFirstId && b.auto) : false;

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
                {isAutoBreak ? (
                  <div class="pbreak-marker">
                    <span>PAGE BREAK (auto)</span>
                  </div>
                ) : (
                  <div class="pbreak-marker">
                    <span>PAGE BREAK</span>
                    <button class="pbreak-rm" onClick={() => removeBreak(nextFirstId)}>
                      ✕ remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </Fragment>
  );
}
