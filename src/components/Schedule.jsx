import { ContentEditable } from './ContentEditable.jsx';
import { save } from '../store.js';
import { storeSignal } from '../signals.js';
import { uid, confirmDel } from '../utils.js';
import { recalculateScheduleTimes, togglePageBreakRow } from '../render/schedule.js';
import { SCHED_COLUMNS } from '../data.js';

const STANDARD_COL_CLASSES = ['time', 'task', 'loc', 'cast', 'note'];

export function getScheduleColumns(sec) {
  return Array.isArray(sec.columns) && sec.columns.length ? sec.columns : SCHED_COLUMNS();
}

function colClass(col) {
  return STANDARD_COL_CLASSES.includes(col.key) ? col.key : 'custom';
}

// Shared by Schedule and the pagination MeasureLayer so measured header
// heights always match the rendered ones.
export function SchedHead({ sec, interactive = false }) {
  const cols = getScheduleColumns(sec);

  const handleLabelChange = (col, val) => {
    col.label = val;
    save();
  };

  const addColAfter = (i) => {
    const w = 12;
    cols.forEach(c => { c.width = (c.width * (100 - w)) / 100; });
    cols.splice(i + 1, 0, { key: 'col_' + uid(), label: '', width: w });
    sec.columns = cols;
    save();
  };

  const removeCol = async (i, anchor) => {
    const col = cols[i];
    if (col.key === 'time') return;
    if (!(await confirmDel(`Remove column "${col.label || 'Untitled'}" and its contents?`, anchor))) return;
    cols.splice(i, 1);
    const total = cols.reduce((s, c) => s + c.width, 0);
    cols.forEach(c => { c.width = (c.width * 100) / total; });
    sec.data.forEach(r => { if (r.type !== 'span') delete r[col.key]; });
    sec.columns = cols;
    save();
  };

  const startResize = (e, i) => {
    e.preventDefault();
    const th = e.currentTarget.closest('th');
    const table = th.closest('table');
    const ths = Array.from(table.querySelectorAll('thead th'));
    const tableW = table.getBoundingClientRect().width;
    const startX = e.clientX;
    const a = cols[i], b = cols[i + 1];
    const aw = a.width, bw = b.width;
    const pair = aw + bw;
    const clampA = (w) => Math.min(Math.max(w, 5), pair - 5);
    const handle = e.currentTarget;
    handle.classList.add('active');
    const move = (ev) => {
      const na = clampA(aw + ((ev.clientX - startX) / tableW) * 100);
      if (ths[i]) ths[i].style.width = na + '%';
      if (ths[i + 1]) ths[i + 1].style.width = (pair - na) + '%';
    };
    const up = (ev) => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      handle.classList.remove('active');
      a.width = clampA(aw + ((ev.clientX - startX) / tableW) * 100);
      b.width = pair - a.width;
      save();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  return (
    <thead>
      <tr>
        {cols.map((col, i) => (
          <th class={colClass(col)} style={{ width: col.width + '%' }} key={col.key}>
            {interactive ? (
              <ContentEditable
                className="col-label"
                placeholder="Column"
                value={col.label}
                onCommit={(val) => handleLabelChange(col, val)}
              />
            ) : (
              col.label
            )}
            {interactive && (
              <span class="col-controls">
                <button title="Add column to the right" onClick={() => addColAfter(i)}>+</button>
                {col.key !== 'time' && (
                  <button title="Remove column" onClick={(e) => removeCol(i, e.currentTarget)}>×</button>
                )}
              </span>
            )}
            {interactive && i < cols.length - 1 && (
              <span class="col-resizer" onPointerDown={(e) => startResize(e, i)} />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Schedule({
  sec,
  rowStart = 0,
  rowEnd = null,
  continuation = false,
  showAddControls = true,
}) {
  const store = storeSignal.value;
  const cols = getScheduleColumns(sec);
  const end = rowEnd == null ? sec.data.length : rowEnd;
  const rows = sec.data.slice(rowStart, end);
  const auto = sec.autoTime !== false;

  const handleCellChange = (gi, field, val) => {
    sec.data[gi][field] = val;
    if (field === 'time' || field === 'dur') {
      recalculateScheduleTimes(sec, gi + 1);
    }
    save();
  };

  const handleRowAction = async (act, gi, anchor) => {
    if (act === 'up' && gi > 0) {
      const [r] = sec.data.splice(gi, 1);
      sec.data.splice(gi - 1, 0, r);
      recalculateScheduleTimes(sec, gi);
    } else if (act === 'down' && gi < sec.data.length - 1) {
      const [r] = sec.data.splice(gi, 1);
      sec.data.splice(gi + 1, 0, r);
      recalculateScheduleTimes(sec, gi);
    } else if (act === 'del') {
      if (!(await confirmDel('Delete row?', anchor))) return;
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
    const row = { type: 'row', time: '', dur: '' };
    cols.forEach(c => { if (c.key !== 'time') row[c.key] = ''; });
    sec.data.push(row);
    recalculateScheduleTimes(sec, sec.data.length - 1);
    save();
  };

  const handleAddSpan = () => {
    sec.data.push({ type: 'span', time: '', dur: '', text: '' });
    recalculateScheduleTimes(sec, sec.data.length - 1);
    save();
  };

  const toggleAutoTime = () => {
    sec.autoTime = !auto;
    if (sec.autoTime) recalculateScheduleTimes(sec, 1);
    save();
  };

  return (
    <div class="sched-wrap">
      {!continuation && (
        <div class="sched-time-toggle">
          <button
            class={auto ? 'on' : ''}
            title={auto
              ? 'Times auto-calculate from the previous row’s time + duration. Click to enter times manually.'
              : 'Times are entered manually. Click to auto-calculate from durations.'}
            onClick={toggleAutoTime}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            {auto ? 'Time: Auto' : 'Time: Manual'}
          </button>
        </div>
      )}
      {continuation && (
        <div class="sched-cont-content">
          <div class="sched-cont-title">{sec.title}</div>
          <div class="sched-cont-subtitle">Continued from previous page.</div>
        </div>
      )}
      <table class="sched">
        <SchedHead sec={sec} interactive={true} />
        <tbody>
          {rows.map((r, li) => {
            const gi = rowStart + li;
            return (
              <ScheduleRow
                key={gi}
                row={r}
                gi={gi}
                cols={cols}
                handleCellChange={handleCellChange}
                handleRowAction={handleRowAction}
              />
            );
          })}
        </tbody>
      </table>
      {!showAddControls && (
        <div class="sched-cont-footer">Continued on next page.</div>
      )}
      {showAddControls && (
        <div class="add-row">
          <button onClick={handleAddRow}>+ Add row</button>
          <button onClick={handleAddSpan}>+ Add spanning row (travel / wrap)</button>
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ row, gi, cols, handleCellChange, handleRowAction }) {
  const rc = (
    <div class="row-controls">
      <button onClick={() => handleRowAction('up', gi)}>↑</button>
      <button onClick={() => handleRowAction('down', gi)}>↓</button>
      <button onClick={() => handleRowAction('brk', gi)} title="Page break before">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m16 16-4 4-4-4"/>
          <path d="M3 12h18"/>
          <path d="m8 8 4-4 4 4"/>
        </svg>
      </button>
      <button onClick={(e) => handleRowAction('del', gi, e.currentTarget)}>×</button>
    </div>
  );

  const timeCell = (
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
  );

  if (row.type === 'span') {
    return (
      <tr class="span" data-row-idx={gi}>
        {timeCell}
        <td class="spanned" colspan={cols.length - 1}>
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
    <tr data-row-idx={gi}>
      {timeCell}
      {cols.slice(1).map(col => (
        <td class={colClass(col)} key={col.key}>
          <ContentEditable
            className=""
            placeholder={col.label || 'Value'}
            value={row[col.key]}
            onCommit={(val) => handleCellChange(gi, col.key, val)}
          />
        </td>
      ))}
    </tr>
  );
}
