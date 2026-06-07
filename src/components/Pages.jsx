import { Fragment } from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';
import { SheetHeader } from './SheetHeader.jsx';
import { Sections, Section, PageBreakSlot, addSection } from './Sections.jsx';
import { storeSignal } from '../signals.js';
import { save } from '../store.js';
import { measureDayLayout, paginateDay } from '../render/pagination.js';

function fallbackPagination(state) {
  return {
    pages: [{
      items: (state.sections || []).map((section, sectionIndex) => ({
        type: section.type === 'schedule' ? 'schedule' : 'section',
        section,
        sectionIndex,
        start: 0,
        end: section.type === 'schedule' ? section.data.length : null,
        continued: false,
        isFinal: true,
      })),
      breakBefore: null,
    }],
  };
}

function AddSectionPanel() {
  return (
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
  );
}

function MeasureLayer({ state }) {
  return (
    <div class="pagination-measure" aria-hidden="true">
      <div class="paper">
        <div class="measure-header">
          <SheetHeader />
        </div>
        <div class="measure-sections">
          <Sections
            sections={state.sections || []}
            pageBreaks={state.pageBreaks || []}
            showBreakSlots={false}
          />
        </div>
        <div class="measure-probes">
          {(state.sections || []).filter(sec => sec.type === 'schedule').map(sec => (
            <div class="section section--schedule measure-continuation" data-section-id={sec.id} key={sec.id}>
              <div class="section-body">
                <div>
                  <div class="sched-cont-content">
                    <div class="sched-cont-title">{sec.title}</div>
                    <div class="sched-cont-subtitle">Continued from previous page.</div>
                  </div>
                  <table class="sched">
                    <thead>
                      <tr>
                        <th class="time">Time</th>
                        <th class="task">Task</th>
                        <th class="loc">Location</th>
                        <th class="cast">Cast / Extras</th>
                        <th class="note">Notes</th>
                      </tr>
                    </thead>
                    <tbody />
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageBreakControl({ breakBefore, state }) {
  if (!breakBefore) return null;

  const isManual = breakBefore.mode === 'manual';
  const removeBreak = () => {
    if (breakBefore.beforeRow) {
      state.pageBreaks = state.pageBreaks.filter(b =>
        !(b.beforeRow
          && b.beforeRow.sectionId === breakBefore.beforeRow.sectionId
          && b.beforeRow.idx === breakBefore.beforeRow.idx)
      );
    } else if (breakBefore.before) {
      state.pageBreaks = state.pageBreaks.filter(b => b.before !== breakBefore.before);
    }
    save();
  };

  return (
    <div class="page-break-ctrl">
      <div class="pbreak-marker">
        <span>{isManual ? 'PAGE BREAK' : 'PAGE BREAK (auto)'}</span>
        {isManual && (
          <button class="pbreak-rm" onClick={removeBreak}>
            ✕ remove
          </button>
        )}
      </div>
    </div>
  );
}

function pageBreakTarget(item) {
  if (!item || item.continued) return null;
  return item.section?.id || null;
}

function PageItems({ items, pageBreaks }) {
  return (
    <div class="sections-body">
      {items.map((item, idx) => {
        const nextTarget = pageBreakTarget(items[idx + 1]);
        const key = item.type === 'schedule'
          ? `${item.section.id}-${item.start}-${item.end}-${item.continued ? 'cont' : 'first'}`
          : item.section.id;

        return (
          <Fragment key={key}>
            <Section
              sec={item.section}
              idx={item.sectionIndex}
              scheduleStart={item.start || 0}
              scheduleEnd={item.end}
              scheduleContinuation={Boolean(item.continued)}
              scheduleShowAdd={item.type !== 'schedule' || item.isFinal}
            />
            {nextTarget && (
              <PageBreakSlot before={nextTarget} pageBreaks={pageBreaks} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export function Pages() {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];
  const [pagination, setPagination] = useState(null);

  useLayoutEffect(() => {
    if (!state) return undefined;
    const raf = requestAnimationFrame(() => {
      const measurements = measureDayLayout(state, store?.tweaks?.paperSize || 'a4');
      if (measurements) setPagination(paginateDay(state, measurements));
    });
    return () => cancelAnimationFrame(raf);
  }, [store, state]);

  if (!state) return null;

  const pageModel = pagination || fallbackPagination(state);
  const pages = pageModel.pages.length ? pageModel.pages : fallbackPagination(state).pages;

  return (
    <Fragment>
      <MeasureLayer state={state} />
      {pages.map((page, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === pages.length - 1;
        const nextBreak = pages[pageIdx + 1]?.breakBefore || null;

        return (
          <div class="paper" id={isFirst ? 'paper' : undefined} key={`page-${pageIdx}`}>
            {isFirst && <SheetHeader />}
            <PageItems items={page.items} pageBreaks={state.pageBreaks || []} />
            {isLast && <AddSectionPanel />}
            {!isLast && <PageBreakControl breakBefore={nextBreak} state={state} />}
          </div>
        );
      })}
    </Fragment>
  );
}
