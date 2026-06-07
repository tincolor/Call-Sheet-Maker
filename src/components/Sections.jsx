import { Fragment } from 'preact';
import { useRef } from 'preact/hooks';
import { ContentEditable } from './ContentEditable.jsx';
import { app, save } from '../store.js';
import { storeSignal } from '../signals.js';
import { uid, confirmDel } from '../utils.js';
import { drag } from '../render/drag.js';
import { Schedule } from './Schedule.jsx';
import { Contacts } from './Contacts.jsx';
import { Equipment } from './Equipment.jsx';
import { KV } from './KV.jsx';
import { Notes } from './Notes.jsx';

export function Sections({ sections = [], pageBreaks = [], startIdx = 0, showBreakSlots = true }) {
  if (!sections.length) return null;

  return (
    <div class="sections-body">
      {sections.map((sec, localIdx) => (
        <Fragment key={sec.id}>
          <Section sec={sec} idx={startIdx + localIdx} />
          {showBreakSlots && localIdx < sections.length - 1 && (
            <PageBreakSlot before={sections[localIdx + 1].id} pageBreaks={pageBreaks} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function PageBreakSlot({ before, pageBreaks = [] }) {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];
  if (!state) return null;

  const has = pageBreaks.some(p => p.before === before && !p.auto);

  const handleAdd = () => {
    state.pageBreaks.push({ before });
    save();
  };

  const handleRemove = () => {
    state.pageBreaks = state.pageBreaks.filter(p => p.before !== before);
    save();
  };

  return (
    <div class={`pbreak-slot ${has ? 'is-break' : ''}`}>
      {has ? (
        <div class="pbreak-marker">
          <span>PAGE BREAK</span>
          <button class="pbreak-rm" onClick={handleRemove}>
            ✕ remove
          </button>
        </div>
      ) : (
        <button class="pbreak-add" title="Insert page break" onClick={handleAdd}>
          ＋ insert page break
        </button>
      )}
    </div>
  );
}

export function Section({
  sec,
  idx,
  scheduleStart = 0,
  scheduleEnd = null,
  scheduleContinuation = false,
  scheduleShowAdd = true,
}) {
  const store = storeSignal.value;
  const state = store?.days?.find(d => d.id === store.currentDayId) || store?.days[0];
  if (!state) return null;

  const trRef = useRef(null);

  const handleMouseDown = () => {
    if (trRef.current) trRef.current.draggable = true;
  };

  const handleDragStart = (e) => {
    if (!trRef.current.draggable) {
      e.preventDefault();
      return;
    }
    drag.current = { type: 'section', id: sec.id };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sec.id);
    trRef.current.classList.add('dragging');
  };

  const handleDragEnd = () => {
    if (trRef.current) {
      trRef.current.draggable = false;
      trRef.current.classList.remove('dragging');
    }
    drag.current = null;
    document.querySelectorAll('.section.drag-over').forEach(s => s.classList.remove('drag-over'));
  };

  const handleDragOver = (e) => {
    if (drag.current?.type !== 'section' || drag.current.id === sec.id) return;
    e.preventDefault();
    document.querySelectorAll('.section.drag-over').forEach(s => s.classList.remove('drag-over'));
    trRef.current.classList.add('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (trRef.current) trRef.current.classList.remove('drag-over');
    if (!drag.current || drag.current.type !== 'section') return;
    const fromIdx = state.sections.findIndex(s => s.id === drag.current.id);
    const toIdx = state.sections.findIndex(s => s.id === sec.id);
    drag.current = null;
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = state.sections.splice(fromIdx, 1);
    state.sections.splice(toIdx, 0, moved);
    save();
  };

  const handleTitleChange = (val) => {
    sec.title = val;
    save();
  };

  const handleSectionAction = (act) => {
    const i = state.sections.findIndex(s => s.id === sec.id);
    if (i < 0) return;
    if (act === 'up' && i > 0) {
      const [s] = state.sections.splice(i, 1);
      state.sections.splice(i - 1, 0, s);
    } else if (act === 'down' && i < state.sections.length - 1) {
      const [s] = state.sections.splice(i, 1);
      state.sections.splice(i + 1, 0, s);
    } else if (act === 'del') {
      if (!confirmDel('Delete this section?')) return;
      state.sections.splice(i, 1);
      state.pageBreaks = state.pageBreaks.filter(p => p.before !== sec.id);
    }
    save();
  };

  const nth = String(idx + 1).padStart(2, '0');

  let hasRowBreaks = false;
  if (sec.type === 'schedule') {
    hasRowBreaks = state.pageBreaks.some(b => b.beforeRow && b.beforeRow.sectionId === sec.id);
  }

  return (
    <div
      ref={trRef}
      class={`section section--${sec.type} ${hasRowBreaks ? 'has-row-break' : ''}`}
      data-id={sec.id}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!scheduleContinuation && (
        <div class="section-head">
          <h3>
            <span class="num">{nth}</span>
            <ContentEditable
              className="title"
              placeholder="Section title"
              value={sec.title}
              onCommit={handleTitleChange}
            />
          </h3>
          <div class="sec-ctrls">
            <button class="drag-handle sec-drag-handle" title="Drag to reorder section" onMouseDown={handleMouseDown}>⠿</button>
            <button onClick={() => handleSectionAction('up')} title="Move up">↑</button>
            <button onClick={() => handleSectionAction('down')} title="Move down">↓</button>
            <button onClick={() => handleSectionAction('del')} title="Delete section">✕</button>
          </div>
        </div>
      )}
      <div class="section-body">
        {sec.type === 'schedule' && (
          <Schedule
            sec={sec}
            rowStart={scheduleStart}
            rowEnd={scheduleEnd}
            continuation={scheduleContinuation}
            showAddControls={scheduleShowAdd}
          />
        )}
        {sec.type === 'contacts' && <Contacts sec={sec} />}
        {sec.type === 'equipment' && <Equipment sec={sec} />}
        {sec.type === 'hospital' && (
          <KV
            sec={sec}
            fields={[
              ['name', 'Name'],
              ['addr', 'Address'],
              ['phone', 'Phone'],
              ['hours', 'Hours'],
              ['dist', 'Dist.'],
            ]}
          />
        )}
        {sec.type === 'basecamp' && (
          <KV
            sec={sec}
            fields={[
              ['name', 'Basecamp'],
              ['addr', 'Address'],
              ['parking', 'Parking'],
              ['restroom', 'Restroom'],
              ['catering', 'Catering'],
            ]}
          />
        )}
        {sec.type === 'notes' && <Notes sec={sec} />}
      </div>
    </div>
  );
}

export function addSection(type) {
  const blank = { id: uid(), type, title: type[0].toUpperCase() + type.slice(1) };
  if (type === 'schedule')  blank.data = [];
  if (type === 'contacts')  blank.data = [];
  if (type === 'equipment') blank.data = [];
  if (type === 'hospital')  blank.data = { name:'', addr:'', phone:'', hours:'', dist:'' };
  if (type === 'basecamp')  blank.data = { name:'', addr:'', parking:'', restroom:'', catering:'' };
  if (type === 'notes')     blank.data = { text:'' };
  app.state.sections.push(blank);
  save();
}
