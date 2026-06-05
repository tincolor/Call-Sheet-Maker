# Preact Migration Plan

## Goal

Replace the current pattern of setting `innerHTML` + manually wiring event
listeners with declarative Preact JSX components. The single-file build output
(`Call Sheet Maker.html`) must be preserved throughout.

---

## Current Pain Points

Every render function follows the same pattern:

```js
host.innerHTML = `<div>...</div>`;  // rebuild entire subtree
host.querySelectorAll('[data-f]').forEach(el => el.addEventListener('input', ...)); // re-wire all listeners
```

Problems this causes:
- Every mutation triggers a full subtree rebuild (keyboard focus is lost, scroll
  position resets)
- Event listener wiring is manual and easy to forget or duplicate
- Template literal HTML is hard to read and has no IDE support
- `renderSections()` is called at the bottom of nearly every mutation — a global
  re-render as a substitute for data binding

---

## Constraints

1. **Single-file build** — `vite-plugin-singlefile` must keep producing a
   self-contained `Call Sheet Maker.html`. Preact and its plugins are compatible.
2. **reflow.js** — `autoReflow` and `adjustSectionBreakSpacing` depend on real
   DOM measurements (`getBoundingClientRect`). They must run after paint, so they
   stay as imperative utilities called from `useLayoutEffect`.
3. **`contenteditable` fields** — React/Preact re-renders overwrite DOM content
   and destroy cursor position. A shared `<ContentEditable>` component is
   required that skips DOM writes while the field is focused.
4. **Existing data model and localStorage keys** — zero changes to the stored
   JSON shape or `CS_KEY`.

---

## Architecture Decisions

### 1. State: Preact Signals

Replace the current render-function-call chain with a single reactive store
signal. All existing mutation code can stay as-is; add a shallow copy of the
root object after each mutation to notify subscribers.

```js
// src/signals.js
import { signal, computed } from '@preact/signals';
import { load } from './store.js';

export const storeSignal = signal(load());

// call after any mutation instead of renderSections() / renderSheet()
export function commit() {
  storeSignal.value = { ...storeSignal.value };
}

export const currentDay = computed(() => {
  const s = storeSignal.value;
  return s.days.find(d => d.id === s.currentDayId) || s.days[0];
});
```

`save()` in `store.js` gains a call to `commit()`. The many
`save(); renderSections();` call sites become just `save()`.

### 2. Shared `<ContentEditable>` component

Every `contenteditable` span/div throughout the app uses the same pattern.
A single shared component handles it correctly:

```jsx
// src/components/ContentEditable.jsx
export function ContentEditable({ value, onCommit, multiline, className, placeholder }) {
  const ref = useRef(null);
  const focused = useRef(false);

  useLayoutEffect(() => {
    if (!focused.current && ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value ?? '';
    }
  }, [value]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      class={className}
      data-placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={e => { focused.current = false; onCommit(e.target.textContent); }}
      onInput={e => onCommit(e.target.textContent)}
    />
  );
}
```

For multiline (notes, company name, address) `innerHTML` must be used with
`dangerouslySetInnerHTML` for the initial render and `blur`-only commits —
the same approach as the existing `wireMultilineEditing` / `getEditableText`
helpers.

### 3. Mounting strategy: incremental islands

Rather than rewriting everything at once, Preact components are mounted into
existing DOM slots. `index.html` stays structurally unchanged until the final
phase.

Each "island" is mounted with:

```js
import { render } from 'preact';
render(<Sections />, document.getElementById('sectionsHost'));
```

Leaf components are migrated first; the orchestration layer (`Sections`,
`Sheet`) follows once the leaves are stable.

### 4. reflow.js stays imperative

The page-break measurement logic is inherently side-effectful DOM work.
It does not need to become "reactive." Instead the `<Sections>` component
calls it from `useLayoutEffect`:

```jsx
useLayoutEffect(() => {
  adjustSectionBreakSpacing();
  if (!isReflowing()) autoReflow();
}, [sections, pageBreaks]);
```

---

## Target Component Tree

```
<App>                        ← mounts at document.body (Phase 6, optional)
  <AppBar>                   ← appbar buttons, DaySwitcher
    <DaySwitcher />
  </AppBar>
  <Workspace>
    <IntakeSidebar />        ← Phase 5
    <SheetMain>
      <Paper>
        <Header />           ← Phase 4  (data-k fields + logos)
        <Sections />         ← Phase 2  (mounts at #sectionsHost)
          <PageBreakSlot />
          <Section>
            <Contacts />     ← Phase 1a
            <Schedule />     ← Phase 1b
            <Equipment />    ← Phase 1a
            <KV />           ← Phase 1a
            <Notes />        ← Phase 1a
          </Section>
          <PageBreakSlot />
        </Sections>
        <AddSection />       ← Phase 2
      </Paper>
    </SheetMain>
  </Workspace>
  <TweaksPanel />            ← Phase 5
</App>
```

---

## Migration Phases

### Phase 0 — Setup (~30 min)

**What:** Wire Preact into the build; nothing visible changes.

1. `bun add preact @preact/signals`
2. `bun add -D @preact/preset-vite`
3. Update `vite.config.js`:
   ```js
   import preact from '@preact/preset-vite';
   export default defineConfig({
     plugins: [preact(), viteSingleFile({ removeViteModuleLoader: true })],
     ...
   });
   ```
4. Create `src/signals.js` with `storeSignal`, `commit()`, `currentDay`.
5. Update `save()` in `store.js` to call `commit()` after the debounce fires.
6. Verify `bun run build` still produces a valid single-file HTML.

**Risk:** Low. The existing render functions still run; Preact is just available.

---

### Phase 1a — Leaf section renderers (~2–3 hours)

**What:** Convert the four simplest section body renderers to Preact components.
Each is mounted by `renderSection()` in `sections.js` (no change to sections.js
itself yet).

**Files to convert:**
- `src/render/kv.js` → `src/components/KV.jsx`
- `src/render/notes.js` → `src/components/Notes.jsx`
- `src/render/contacts.js` → `src/components/Contacts.jsx`
- `src/render/equipment.js` → `src/components/Equipment.jsx`

**`renderSection()` change for each:** instead of calling e.g.
`renderContacts(sec, body)`, call `render(<Contacts sec={sec} />, body)`.

**`Contacts` example sketch:**
```jsx
function Contacts({ sec }) {
  const rows = useSignal(sec.data);  // or read from currentDay signal

  return (
    <div>
      <div class="crew-grid-wrap">
        <div class="crew-grid">
          {rows.value.map((c, i) => (
            <ContactRow key={c.id ?? i} contact={c} index={i} sec={sec} />
          ))}
        </div>
      </div>
      <div class="add-row">
        <button onClick={() => { sec.data.push({role:'',name:'',phone:''}); save(); }}>
          + Add contact
        </button>
      </div>
    </div>
  );
}
```

**Acceptance:** All four section types editable, rows reorderable, saved to
localStorage, single-file build passes.

---

### Phase 1b — Schedule component (~4–6 hours)

**What:** Convert `renderSchedule` to `<Schedule>`. This is the largest and most
complex renderer (215 lines), but it is self-contained.

**Key sub-components:**
- `<ScheduleTable seg={seg} sec={sec} />` — one table segment
- `<ScheduleRow row={r} globalIdx={gi} sec={sec} />` — one `<tr>`
- `<SegmentContinuation ... />` — the "Continued from previous page" block

**Drag-and-drop:** Use `useRef` for the drag handle mouse-down, same HTML5
drag events. The `drag` object in `render/drag.js` stays as-is (shared mutable
singleton, no need to reactify it).

**Page-break row buttons:** `togglePageBreakRow` still lives in `schedule.js`
(pure logic, no DOM); call it from the button's `onClick`, then `save()`.

**Acceptance:** Schedule rows editable, time auto-calculation works, row
drag-and-drop works, row-level page breaks work.

---

### Phase 2 — Sections orchestration (~3–4 hours)

**What:** Replace `renderSections()` entirely. Mount `<Sections>` at
`#sectionsHost`. Wire `autoReflow` via `useLayoutEffect`.

**Deletes:** `src/render/sections.js` (replaced by `src/components/Sections.jsx`
and `src/components/Section.jsx`). `src/render/sheet.js` call to
`renderSections()` is removed.

**`<Sections>` sketch:**
```jsx
function Sections() {
  const day = currentDay.value;
  const { sections, pageBreaks } = day;

  useLayoutEffect(() => {
    adjustSectionBreakSpacing();
    if (!isReflowing()) requestAnimationFrame(autoReflow);
  });

  return (
    <div>
      <PageBreakSlot before={sections[0]?.id ?? '__end__'} />
      {sections.map((sec, idx) => (
        <>
          <Section key={sec.id} sec={sec} idx={idx} />
          <PageBreakSlot before={sections[idx + 1]?.id ?? '__end__'} />
        </>
      ))}
    </div>
  );
}
```

**`<AddSection>` buttons:** These live in the static `index.html` currently.
Either wire them via `initChrome()` as before (no change) or move them into
`<Sections>` — both work.

**Acceptance:** Sections add/delete/reorder, page breaks insert/remove, auto
page-break reflow continues to work correctly.

---

### Phase 3 — `save()` cleanup (~1 hour)

**What:** Remove all `renderSections()` and `renderSheet()` call sites now that
Preact handles re-renders reactively.

- All `save(); renderSections();` → `save();`
- All `save(); renderSheet();` → `save();`
- `renderSheet()` in `src/render/sheet.js` is reduced to just `applyTweaks()`
  (paper size, toggle states) — or `applyTweaks` is moved into a signal effect.

**Acceptance:** All mutations still persist and re-render. No orphan render calls.

---

### Phase 4 — Header and DaySwitcher (~2–3 hours)

**What:** Convert `renderHeader`, `renderLogos`, `renderDaySwitcher` to Preact
components mounted at their existing DOM slots.

- `<Header />` → renders the `[data-k]` contenteditable fields, replaces
  `renderHeader()`. Mounted inside `<Paper>` or hydrates existing elements
  via refs.
- `<Logos />` → replaces `renderLogos()`, mounted at `#logoSlot`.
- `<DaySwitcher />` → replaces `renderDaySwitcher()`, mounted at `#daySwitcher`.

**Note on header fields:** The `data-k` contenteditable divs currently live in
static HTML in `index.html`. Two options:
  - **Option A (lower risk):** Keep the static HTML, have `<Header>` only manage
    the _values_ by finding elements with `document.querySelector('[data-k]')`
    and setting refs. Avoids moving complex CSS-dependent HTML.
  - **Option B (cleaner):** Move the header HTML into `<Header>` JSX. Requires
    careful verification that print styles still apply.

**Recommendation:** Option A for Phase 4, defer Option B to Phase 6.

**Acceptance:** Header fields editable and saved. Logo upload/replace/remove
works. Day switcher switches days, adds days.

---

### Phase 5 — Intake sidebar (optional, ~3–4 hours)

**What:** Convert `initIntake`, `renderIntakePreview`, `setIntakeStep` to a
`<IntakeSidebar>` component.

The intake sidebar has complex multi-step UI state (input → loading → verify →
error). This maps naturally to a `step` signal.

**This phase is optional** — the intake sidebar is already reasonably maintainable
as imperative code (less repetition than the section renderers). Migrate it when
the section renderer experience confirms the approach.

---

### Phase 6 — Full app component (deferred)

**What:** Collapse `index.html` to a single `<div id="root"></div>` and render
`<App>` there. All HTML moves into JSX.

**Why defer:** The HTML in `index.html` has dense inline styles and is
entangled with print CSS selectors. Converting it correctly requires careful
visual regression testing. It's a cleanup task, not a pain-point fix.

---

## File Structure After Phase 4

```
src/
  components/
    ContentEditable.jsx      shared contenteditable wrapper
    Sections.jsx             orchestrates section list + page breaks
    Section.jsx              single section shell (head, body, drag)
    PageBreakSlot.jsx        insert/remove page break UI
    Contacts.jsx
    Schedule.jsx             + ScheduleTable.jsx, ScheduleRow.jsx
    Equipment.jsx
    KV.jsx
    Notes.jsx
    Header.jsx               data-k fields + header note
    Logos.jsx                logo upload / manage
    DaySwitcher.jsx
  signals.js                 storeSignal, commit(), currentDay
  render/
    drag.js                  (unchanged)
    reflow.js                (unchanged — called from useLayoutEffect)
    sheet.js                 reduced to applyTweaks()
  store.js                   (save() gains commit() call)
  days.js                    (renderDaySwitcher() calls replaced)
  chrome.js                  (unchanged)
  intake.js                  (unchanged until Phase 5)
  main.js                    boot mounts Preact islands
  ...
```

---

## Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| `contenteditable` cursor | High — naive re-render destroys cursor | `<ContentEditable>` component, skip DOM writes while focused |
| `reflow.js` timing | Medium — `useLayoutEffect` fires sync; `autoReflow` needs RAF | Keep RAF wrapper inside `useLayoutEffect` |
| Drag-and-drop | Low — HTML5 drag API is DOM events, not framework-managed | Keep `drag.js` singleton, attach handlers via `useRef` |
| Single-file build size | Low — Preact ~3KB gzipped | Verify build size before and after Phase 0 |
| Print CSS | Medium — class names and DOM structure must not change | Keep exact same class names in JSX; review print output after each phase |

---

## What Does NOT Change

- `styles.css` — zero changes
- `logos.inline.js` — zero changes
- `index.html` HTML structure (until Phase 6)
- localStorage keys and JSON data shape
- `reflow.js` logic
- `drag.js` singleton
- CSV import/export (`csv.js`)
- Claude intake logic (`intake.js` until Phase 5)
