import { useRef } from 'preact/hooks';
import { ContentEditable } from './ContentEditable.jsx';
import { save } from '../store.js';
import { storeSignal } from '../signals.js';
import { confirmDel } from '../utils.js';
import { recalculateScheduleTimes, togglePageBreakRow } from '../render/schedule.js';
import { drag } from '../render/drag.js';

export function Schedule({ sec }) {
  const store = storeSignal.value;

  const pageBreaks = store?.days?.find(d => d.id === store.currentDayId)?.pageBreaks || [];
  
  const brkIdxs = pageBreaks
    .filter(b => b.beforeRow && b.beforeRow.sectionId === sec.id)
    .map(b => b.beforeRow.idx)
    .sort((a, b) => a - b);

  const segs = [];
  let from = 0;
  for (const bi of brkIdxs) {
    segs.push({ rows: sec.data.slice(from, bi), start: from });
    from = bi;
  }
  segs.push({ rows: sec.data.slice(from), start: from });

  const handleCellChange = (gi, field, val) => {
    sec.data[gi][field] = val;
    if (field === 'time' || field === 'dur') {
      recalculateScheduleTimes(sec, gi + 1);
    }
    save();
  };

  const handleRowAction = (act, gi) => {
    if (act === 'up' && gi > 0) {
      const [r] = sec.data.splice(gi, 1);
      sec.data.splice(gi - 1, 0, r);
      recalculateScheduleTimes(sec, gi);
    } else if (act === 'down' && gi < sec.data.length - 1) {
      const [r] = sec.data.splice(gi, 1);
      sec.data.splice(gi + 1, 0, r);
      recalculateScheduleTimes(sec, gi);
    } else if (act === 'del') {
      if (!confirmDel('Delete row?')) return;
      sec.data.splice(gi, 1);
      let day = store.days.find(d => d.id === store.currentDayId) || store.days[0];
      day.pageBreaks = day.pageBreaks.filter(p => !(p.beforeRow && p.beforeRow.sectionId === sec.id && p.beforeRow.idx === gi));
      recalculateScheduleTimes(sec, gi);
    } else if (act === 'brk') {
      togglePageBreakRow(sec.id, gi);
    }
    save();
  };

  const handleAddRow = () => {
    sec.data.push({ type: 'row', time: '', dur: '', task: '', loc: '', cast: '', note: '' });
    recalculateScheduleTimes(sec, sec.data.length - 1);
    save();
  };

  const handleAddSpan = () => {
    sec.data.push({ type: 'span', time: '', dur: '', text: '' });
    recalculateScheduleTimes(sec, sec.data.length - 1);
    save();
  };

  const handleRemoveBreak = (breakRowIdx) => {
    let day = store.days.find(d => d.id === store.currentDayId) || store.days[0];
    day.pageBreaks = day.pageBreaks.filter(b =>
      !(b.beforeRow && b.beforeRow.sectionId === sec.id && b.beforeRow.idx === breakRowIdx)
    );
    save();
  };

  return (
    <div>
      {segs.map((seg, segIdx) => {
        const isLast = segIdx === segs.length - 1;
        const breakRowIdx = seg.start;

        return (
          <div key={segIdx}>
            {segIdx > 0 && (
              <div class="sched-cont-wrap">
                <div class="brk-bar">
                  <span>Page Break</span>
                  <button class="brk-remove" onClick={() => handleRemoveBreak(breakRowIdx)}>
                    Remove
                  </button>
                </div>
                <div class="sched-cont-content">
                  <div class="sched-cont-title">{sec.title}</div>
                  <div class="sched-cont-subtitle">Continued from previous page.</div>
                </div>
              </div>
            )}
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
              <tbody>
                {seg.rows.map((r, li) => {
                  const gi = seg.start + li;
                  return (
                    <ScheduleRow
                      key={gi}
                      row={r}
                      gi={gi}
                      sec={sec}
                      handleCellChange={handleCellChange}
                      handleRowAction={handleRowAction}
                    />
                  );
                })}
                {!isLast && (
                  <tr class="sched-page-footer">
                    <td colspan="5">Continued on next page.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
      <div class="add-row">
        <button onClick={handleAddRow}>+ Add row</button>
        <button onClick={handleAddSpan}>+ Add spanning row (travel / wrap)</button>
      </div>
    </div>
  );
}

function ScheduleRow({ row, gi, sec, handleCellChange, handleRowAction }) {
  const trRef = useRef(null);

  const handleMouseDown = () => {
    if (trRef.current) trRef.current.draggable = true;
  };

  const handleDragStart = (e) => {
    if (!trRef.current.draggable) {
      e.preventDefault();
      return;
    }
    drag.current = { type: 'row', secId: sec.id, idx: gi };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(gi));
    trRef.current.classList.add('dragging');
  };

  const handleDragEnd = () => {
    if (trRef.current) {
      trRef.current.draggable = false;
      trRef.current.classList.remove('dragging');
    }
    document.querySelectorAll('tr.drag-over').forEach(r => r.classList.remove('drag-over'));
  };

  const handleDragOver = (e) => {
    if (drag.current?.type !== 'row' || drag.current.secId !== sec.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('tr.drag-over').forEach(r => r.classList.remove('drag-over'));
    trRef.current.classList.add('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (trRef.current) trRef.current.classList.remove('drag-over');
    if (!drag.current || drag.current.type !== 'row' || drag.current.secId !== sec.id) return;
    const f2 = drag.current.idx;
    const t2 = gi;
    drag.current = null;
    if (f2 === t2) return;

    const [mv] = sec.data.splice(f2, 1);
    sec.data.splice(t2, 0, mv);
    recalculateScheduleTimes(sec, Math.min(f2, t2));
    save();
  };

  const rc = (
    <div class="row-controls">
      <button class="drag-handle row-drag-handle" title="Drag to reorder" onMouseDown={handleMouseDown}>⠿</button>
      <button onClick={() => handleRowAction('up', gi)}>↑</button>
      <button onClick={() => handleRowAction('down', gi)}>↓</button>
      <button onClick={() => handleRowAction('brk', gi)} title="Page break before">⤓</button>
      <button onClick={() => handleRowAction('del', gi)}>×</button>
    </div>
  );

  if (row.type === 'span') {
    return (
      <tr
        ref={trRef}
        class="span"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <td class="time">
          {rc}
          <ContentEditable
            className=""
            placeholder="00:00"
            value={row.time}
            onCommit={(val) => handleCellChange(gi, 'time', val)}
          />
          <ContentEditable
            className="dur"
            placeholder="dur"
            value={row.dur}
            onCommit={(val) => handleCellChange(gi, 'dur', val)}
          />
        </td>
        <td class="spanned" colspan="4">
          <ContentEditable
            tagName="b"
            className=""
            placeholder="Travel / wrap description"
            value={row.text}
            onCommit={(val) => handleCellChange(gi, 'text', val)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr
      ref={trRef}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <td class="time">
        {rc}
        <ContentEditable
          className=""
          placeholder="00:00"
          value={row.time}
          onCommit={(val) => handleCellChange(gi, 'time', val)}
        />
        <ContentEditable
          className="dur"
          placeholder="dur"
          value={row.dur}
          onCommit={(val) => handleCellChange(gi, 'dur', val)}
        />
      </td>
      <td class="task">
        <ContentEditable
          className=""
          placeholder="Task"
          value={row.task}
          onCommit={(val) => handleCellChange(gi, 'task', val)}
        />
      </td>
      <td class="loc">
        <ContentEditable
          className=""
          placeholder="Location / address"
          value={row.loc}
          onCommit={(val) => handleCellChange(gi, 'loc', val)}
        />
      </td>
      <td class="cast">
        <ContentEditable
          className=""
          placeholder="Cast / extras"
          value={row.cast}
          onCommit={(val) => handleCellChange(gi, 'cast', val)}
        />
      </td>
      <td class="note">
        <ContentEditable
          className=""
          placeholder="Notes"
          value={row.note}
          onCommit={(val) => handleCellChange(gi, 'note', val)}
        />
      </td>
    </tr>
  );
}
