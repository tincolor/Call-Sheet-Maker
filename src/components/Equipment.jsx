import { ContentEditable } from './ContentEditable.jsx';
import { save } from '../store.js';
import { storeSignal } from '../signals.js';
import { confirmDel } from '../utils.js';

export function Equipment({ sec }) {
  // Subscribe to storeSignal updates to trigger re-renders
  const store = storeSignal.value;

  const handleFieldChange = (idx, text) => {
    sec.data[idx].text = text;
    save();
  };

  const handleToggle = (idx) => {
    sec.data[idx].done = !sec.data[idx].done;
    save();
  };

  const handleAction = (act, idx) => {
    if (act === 'up' && idx > 0) {
      const [r] = sec.data.splice(idx, 1);
      sec.data.splice(idx - 1, 0, r);
    } else if (act === 'down' && idx < sec.data.length - 1) {
      const [r] = sec.data.splice(idx, 1);
      sec.data.splice(idx + 1, 0, r);
    } else if (act === 'del') {
      if (!confirmDel('Delete item?')) return;
      sec.data.splice(idx, 1);
    }
    save();
  };

  const handleAdd = () => {
    sec.data.push({ text: '', done: false });
    save();
  };

  return (
    <div>
      <div class="equip-list">
        {sec.data.map((item, i) => (
          <div key={i} class={`chk ${item.done ? 'done' : ''}`} data-i={i}>
            <span class="box" onClick={() => handleToggle(i)} />
            <ContentEditable
              className="txt"
              placeholder="Item"
              value={item.text}
              onCommit={(val) => handleFieldChange(i, val)}
            />
            <span class="row-ctrls">
              <button type="button" onClick={() => handleAction('up', i)} title="Move up">↑</button>
              <button type="button" onClick={() => handleAction('down', i)} title="Move down">↓</button>
              <button type="button" class="rm" onClick={() => handleAction('del', i)} title="Delete">×</button>
            </span>
          </div>
        ))}
      </div>
      <div class="add-row">
        <button type="button" onClick={handleAdd}>+ Add item</button>
      </div>
    </div>
  );
}
