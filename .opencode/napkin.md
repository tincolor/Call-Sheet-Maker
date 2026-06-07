# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-06-04 | Agent | logos.inline.js was not inlined by Vite singlefile | Add `type="module"` to the script tag in index.html so Vite can process it as an ES module |
| 2026-06-04 | User/Agent | logos.inline.js created loading and tree-shaking issues | Move logo base64 declarations directly to `src/logos.js` and delete `logos.inline.js` |
| 2026-06-07 | Agent | reflow's `page1Avail` did NOT subtract the 8mm `.hd2 ~ .sections-body` margin → over-budgeted page 1 by ~31px (≈1 row). Confirmed in real Chrome: code said 610px, reality was 579px. | Subtract the header→body gap; measure it live from the DOM (`bodyEl.top - lastHeader.bottom`) rather than hardcoding 8mm so it can't drift from CSS. |
| 2026-06-07 | Agent | Napkin claimed "print paper padding is 12mm all sides". WRONG — `.paper` is `padding: 14mm 12mm 16mm` in BOTH screen and print (print block re-states the same). reflow uses 14mm top / 16mm bottom. | Don't trust the old "12mm all sides" note; the paper padding is 14/12/16 everywhere. |

## User Preferences
- Prefers modular ES codebase with HMR (Vite) while retaining portable standalone HTML artifact as distribution output.

## Patterns That Work
- Splitting monolithic JavaScript files into focused ES modules.
- Using a centralized `app` state singleton with getters for shorthand state access (`app.state`) to prevent syncing bugs.
- Tests run under `bun test` (`npm test` / `npm run check`). Suites live in `test/*.test.js` using `bun:test` (`describe`/`test`/`expect`). The old hand-rolled `scripts/smoke-test.mjs` was retired. Pure modules (paginate.js, csv.js) import cleanly under bun with NO DOM mocks because they only touch `document` inside functions, not at module top-level.
- Make layout logic testable by splitting the pure decision from the DOM measurement: `src/render/paginate.js` (`computePageBreaks`, no DOM) is unit-tested; `reflow.js` only measures sections into `{id,height,isSchedule}` and delegates. Bugs in the *inputs* (e.g. a wrong page1Avail) still need a browser check, not unit tests.
- Renaming entry points containing JSX syntax to `.jsx` so Rolldown/Vite parses them correctly.
- Using `useLayoutEffect` to trigger imperative DOM reflow side-effects (`adjustSectionBreakSpacing`) after Preact renders.
- Using Preact's `<Fragment>` to map items in loops, ensuring DOM tree queries like `previousElementSibling` continue to resolve correct siblings.
- Using `pandoc` to successfully convert `.docx` documents to clean markdown formatting.
- Keeping `intakeDraft` as a plain module-level variable (not a signal) works fine when step-signal changes trigger re-renders that read the draft; avoids signal overhead for a large mutable object.
- For imperative contenteditable preview tables, use `useEffect` on step + a `ref` to the host div — lets DOM-building stay imperative without fighting Preact's diffing.

## Patterns That Work (continued)
- Auto page breaks must be transient signals (`autoBreaksSignal`), never written to `state.pageBreaks`. The old approach persisted them with `auto: true` to localStorage and they went stale. The new approach: reflow writes to a signal; `Pages.jsx` merges signal + manual breaks at render time; localStorage only ever contains manual breaks.
- Screen/print CSS alignment: removing screen-only `section { padding-top: 8px }` and adding `section { margin-bottom: 4mm }` to screen (matching print) makes `getBoundingClientRect().height` accurate for print — no JS correction needed for those values.
- Schedule overflow indicator: use `position: absolute` inside a `position: relative` wrapper div, positioned via `useLayoutEffect` with `.closest('.section').getBoundingClientRect()` comparison. The `overflowPx` from the reflow signal drives the `top` value.

## Patterns That Don't Work
- Leaving raw non-module scripts like `<script src="logos.inline.js"></script>` in Vite projects if they must be inlined; Vite won't bundle them without `type="module"`.
- Calling Node `--check` syntax checks on `.jsx` files as Node does not natively support JSX.
- Using `div style={{ display: 'contents' }}` as a JSX list loop wrapper when DOM methods like `previousElementSibling` are used to target adjacent elements; the div is still present in the DOM tree and interrupts sibling lookups.
- Smoke-test string checks for Preact-compiled class attributes must use backtick form (`class:\`paper\``) not HTML form (`class="paper"`) — Vite/Rolldown emits template literals in the inlined bundle.
- Auto-detecting section page breaks via `getBoundingClientRect()` in screen mode: screen CSS (padding 14mm/16mm, 8mm sections-body margin-top, 8px section padding-top) differs from print CSS (padding 12mm all sides, no margins) by ~14mm per page, causing breaks to fire too early. Correcting for print values helped but was still inaccurate because schedule section screen heights are inflated by `adjustSectionBreakSpacing` continuation padding. Abandoned in favour of manual-only breaks for now.

## Architecture Notes
- The editor uses multiple `.paper` divs stacked in `.page-wrap` (flex-column, gap: 24px) to simulate a print-preview layout. `Pages.jsx` splits `state.sections` by manual `pageBreaks` entries (`{ before: sectionId }`) and renders each group as its own paper card. Manual breaks have no `auto` flag; future auto breaks should use `{ before: sectionId, auto: true }` so they can be filtered independently.
- `SheetHeader.jsx` is the JSX version of the editable call-sheet header (replaces the old static HTML). `Header.jsx` is kept only for its `Logos` component.
- Screen vs print CSS differences to remember: print paper padding is `12mm` all sides (not screen's `14mm top / 16mm bottom`); `.sections-body margin-top: 8mm` and `.section padding-top: 8px` are screen-only; print adds `.section margin-bottom: 4mm`.

## Domain Notes
- Call Sheet Maker is a standalone browser app for production call sheets
- The distribution artifact is `Call Sheet Maker.html` — a single self-contained HTML file
- The app uses `localStorage` for persistence, multi-day support, Claude API for intake parsing
- `logos` are base64 export constants in `src/logos.js` — treated as a blob, not logic
- `store` = persisted JSON object (days[], currentDayId, tweaks); `state` = shorthand for the current day (a computed reference into store.days)

