import { ContentEditable } from './ContentEditable.jsx';
import { save } from '../store.js';
import { storeSignal } from '../signals.js';
import { confirmDel } from '../utils.js';

export function Contacts({ sec }) {
  // Subscribe to storeSignal updates to trigger re-renders
  const store = storeSignal.value;

  const handleFieldChange = (idx, field, val) => {
    sec.data[idx][field] = val;
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
      if (!confirmDel('Delete contact?')) return;
      sec.data.splice(idx, 1);
    }
    save();
  };

  const handleAdd = () => {
    sec.data.push({ role: '', name: '', phone: '' });
    save();
  };

  return (
    <div>
      <div class="crew-grid-wrap">
        <div class="crew-grid">
          {sec.data.map((c, i) => (
            <div key={i} class="crew-row" data-i={i}>
              <span class="crew-ctrls">
                <button type="button" onClick={() => handleAction('up', i)} title="Move up">↑</button>
                <button type="button" onClick={() => handleAction('down', i)} title="Move down">↓</button>
                <button type="button" class="rm" onClick={() => handleAction('del', i)} title="Delete">×</button>
              </span>
              <ContentEditable
                className="role"
                placeholder="Role"
                value={c.role}
                onCommit={(val) => handleFieldChange(i, 'role', val)}
              />
              <ContentEditable
                className="name"
                placeholder="Name"
                value={c.name}
                onCommit={(val) => handleFieldChange(i, 'name', val)}
              />
              <ContentEditable
                className="phone"
                placeholder="Phone / email"
                value={c.phone}
                onCommit={(val) => handleFieldChange(i, 'phone', val)}
              />
            </div>
          ))}
        </div>
      </div>
      <div class="add-row">
        <button type="button" onClick={handleAdd}>+ Add contact</button>
      </div>
    </div>
  );
}
