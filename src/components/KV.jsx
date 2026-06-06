import { ContentEditable } from './ContentEditable.jsx';
import { save } from '../store.js';

export function KV({ sec, fields }) {
  return (
    <div class="kv-grid">
      {fields.map(([k, lbl]) => (
        <div key={k} style={{ display: 'contents' }}>
          <div class="k">{lbl}</div>
          <ContentEditable
            className="v"
            placeholder="—"
            value={sec.data[k]}
            onCommit={(val) => {
              sec.data[k] = val;
              save();
            }}
          />
        </div>
      ))}
    </div>
  );
}
