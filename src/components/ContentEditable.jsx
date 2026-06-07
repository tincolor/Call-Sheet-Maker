import { useRef, useLayoutEffect } from 'preact/hooks';
import { htmlToText, textToHTML } from '../utils.js';

export function ContentEditable({ value, onCommit, multiline, className, placeholder, tagName, onKeyDown }) {
  const ref = useRef(null);
  const focused = useRef(false);

  useLayoutEffect(() => {
    if (!focused.current && ref.current) {
      if (multiline) {
        const expectedHTML = textToHTML(value);
        if (ref.current.innerHTML !== expectedHTML) {
          ref.current.innerHTML = expectedHTML;
        }
      } else {
        const expectedText = value ?? '';
        if (ref.current.textContent !== expectedText) {
          ref.current.textContent = expectedText;
        }
      }
    }
  }, [value, multiline]);

  const handleKeydown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;

    if (multiline && e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      
      onCommit(htmlToText(ref.current.innerHTML));
    }
  };

  const handleInput = () => {
    if (!ref.current) return;
    const txt = multiline ? htmlToText(ref.current.innerHTML) : ref.current.textContent;
    onCommit(txt);
  };

  const handleBlur = () => {
    focused.current = false;
    if (!ref.current) return;
    const txt = multiline ? htmlToText(ref.current.innerHTML) : ref.current.textContent;
    onCommit(txt);
  };

  const Tag = tagName || (multiline ? 'div' : 'span');

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      class={className}
      data-placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeydown}
    />
  );
}
