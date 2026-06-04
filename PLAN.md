# Vite + Module Refactor Plan

## Goal

Replace the single-file development workflow with Vite for hot reload and split
`app.js` (1,787 lines) into focused ES modules. The portable distribution
artifact (`Call Sheet Maker.html`) stays — `vite build` produces it.

---

## Current Structure

```
index.html          HTML shell
styles.css          38 KB styles
app.js              72 KB / 1,787 lines — everything in one file
logos.inline.js     51 KB base64 logo data, sets window.__LOGO_BBC / __LOGO_SA
scripts/
  build-single-file.mjs   inlines CSS+JS into one HTML
  smoke-test.mjs           checks build output + CSV parser unit test
Call Sheet Maker.html     distribution artifact (generated)
```

**Dev workflow today:** open `index.html` in a browser, manually refresh. Run
`npm run build` to regenerate the single-file output.

---

## Target Structure

```
src/
  main.js             entry point — imports everything, calls boot()
  constants.js        CS_KEY, MULTILINE_META_KEYS, etc.
  data.js             DEFAULT_DAY, BLANK_DAY, DEFAULT_STORE
  utils.js            pure helpers: uid, esc, htmlToText, time parsing, etc.
  store.js            app singleton (app.store / app.state), load(), save()
  days.js             day switching, newDay, deleteDay
  intake.js           Claude API integration + intake sidebar
  csv.js              CSV import/export
  chrome.js           app chrome wiring (initChrome, keyboard shortcuts)
  render/
    drag.js           shared drag state { current: null }
    header.js         renderHeader, renderLogos, handleLogoAction
    schedule.js       renderSchedule (185 lines, largest section renderer)
    contacts.js       renderContacts
    equipment.js      renderEquipment
    kv.js             renderKV (hospital / basecamp)
    notes.js          renderNotes
    reflow.js         autoReflow, adjustSectionBreakSpacing
    sections.js       renderSections, renderSection, pageBreakSlot, addSection
    sheet.js          renderSheet, applyTweaks (top-level render coordinator)
index.html            (unchanged HTML structure, new module script tag)
styles.css            (unchanged)
logos.inline.js       (unchanged)
vite.config.js        Vite config with vite-plugin-singlefile
package.json          updated scripts
scripts/
  post-build.mjs      renames dist/index.html → "Call Sheet Maker.html"
  smoke-test.mjs      updated to work with new structure
```

**Dev workflow after:** `npm run dev` → Vite dev server on localhost:5173 with
hot reload. `npm run build` → Vite bundles + inlines → single-file output.

---

## Key Design Decisions

### 1. Shared mutable state — `app` singleton

`app.js` uses two global mutable variables throughout:
- `store` — the full persisted JSON (days, tweaks, etc.)
- `state` — a shorthand alias for the current day (`store.days.find(...)`)

**Solution:** export a single `app` object from `src/store.js`:

```js
export const app = {
  store: null,   // set to load() output at boot time
  get state() {  // always returns current day — no reassignment needed
    return app.store?.days.find(d => d.id === app.store.currentDayId)
        || app.store?.days[0];
  },
};
```

Every module does `import { app } from './store.js'` and uses `app.store` /
`app.state`. The `state = currentDay()` reassignments that appear six times in
the original code are **removed** — the getter keeps `app.state` current
automatically.

### 2. Circular imports — safe because calls are runtime-only

`sections.js` imports `renderSchedule` from `schedule.js`. `schedule.js`
imports `renderSections` from `sections.js`. This is a circular import, but
safe in ES modules because:
- No cross-module code runs at module initialization time
- All cross-module function calls happen inside event handlers (post-DOMContentLoaded)
- ES modules use live bindings, so by the time any handler fires, both modules
  are fully loaded

### 3. Drag state — shared object

`_drag` is a single shared variable used in both `sections.js` (section
drag-and-drop) and `schedule.js` (row drag-and-drop).

**Solution:** `src/render/drag.js` exports `export const drag = { current: null }`.
Both modules import `drag` and use `drag.current`.

### 4. Reflow flag — module-local with getter

`_reflowing` is used only inside `render/reflow.js` and read once in
`render/sheet.js`.

**Solution:** `reflow.js` keeps `let _reflowing = false` internal and exports
`export const isReflowing = () => _reflowing`.

### 5. `logos.inline.js` — stays as a plain `<script>` tag

The file is a 51 KB data blob that sets two globals. It does not need to become
an ES module. It stays as `<script src="logos.inline.js"></script>` in
`index.html`, which Vite and vite-plugin-singlefile handle correctly.

### 6. Single-file build output

`vite-plugin-singlefile` inlines all CSS and JS into `dist/index.html`.
A tiny `scripts/post-build.mjs` moves that file to `Call Sheet Maker.html`.

The old `scripts/build-single-file.mjs` is deleted (replaced by Vite).

### 7. Smoke test — updated

`scripts/smoke-test.mjs` currently:
- Checks `index.html` for specific script tags
- Compares `Call Sheet Maker.html` to the built output
- Extracts `parseCSV` / `parseCSVtoDrafts` from `app.js` for unit testing

After refactor: the script tag checks point to `src/main.js`, the build
comparison uses the new pipeline, and the CSV parser test imports directly from
`src/csv.js`.

---

## Implementation Steps

1. **Install packages** — `npm install --save-dev vite vite-plugin-singlefile`
2. **Create `vite.config.js`** — minimal config
3. **Update `package.json` scripts** — add `dev`, update `build`, keep `check`
4. **Write `src/` modules** — in dependency order:
   - `constants.js`, `data.js`, `utils.js`
   - `store.js`
   - `render/drag.js`, `render/reflow.js`
   - `render/header.js`, `render/schedule.js`, `render/contacts.js`,
     `render/equipment.js`, `render/kv.js`, `render/notes.js`
   - `render/sections.js`, `render/sheet.js`
   - `days.js`, `intake.js`, `csv.js`
   - `chrome.js`, `main.js`
5. **Update `index.html`** — swap `<script src="app.js">` for
   `<script type="module" src="/src/main.js">`
6. **Create `scripts/post-build.mjs`** — rename build output
7. **Delete `scripts/build-single-file.mjs`** — replaced by Vite
8. **Update `scripts/smoke-test.mjs`** — update assertions for new structure
9. **Update `README.md`** — reflect new workflow
10. **Verify** — `npm run dev` works, `npm run build` produces valid single file

---

## What Does NOT Change

- `index.html` HTML structure (all markup stays)
- `styles.css` (zero changes)
- `logos.inline.js` (zero changes)
- `Call Sheet Maker.html` output format
- App behavior, data model, localStorage keys

---

## File Sizes After Split (estimated)

| File | Lines |
|------|-------|
| src/constants.js | ~15 |
| src/data.js | ~115 |
| src/utils.js | ~90 |
| src/store.js | ~70 |
| src/render/drag.js | ~3 |
| src/render/reflow.js | ~110 |
| src/render/header.js | ~100 |
| src/render/schedule.js | ~195 |
| src/render/contacts.js | ~40 |
| src/render/equipment.js | ~40 |
| src/render/kv.js | ~15 |
| src/render/notes.js | ~10 |
| src/render/sections.js | ~175 |
| src/render/sheet.js | ~45 |
| src/days.js | ~80 |
| src/intake.js | ~265 |
| src/csv.js | ~200 |
| src/chrome.js | ~60 |
| src/main.js | ~15 |
| **Total** | **~1,643** |

Roughly the same total lines, but any given module is under 200 lines and
focused on a single concern.
