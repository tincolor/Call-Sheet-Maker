import { ContentEditable } from './ContentEditable.jsx';
import { save } from '../store.js';

export function Notes({ sec }) {
  return (
    <ContentEditable
      className="notes-block"
      placeholder="Notes…"
      multiline={true}
      value={sec.data.text}
      tagName="div"
      onCommit={(val) => {
        sec.data.text = val;
        save();
      }}
    />
  );
}
