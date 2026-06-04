# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-06-04 | Agent | logos.inline.js was not inlined by Vite singlefile | Add `type="module"` to the script tag in index.html so Vite can process it as an ES module |
| 2026-06-04 | User/Agent | logos.inline.js created loading and tree-shaking issues | Move logo base64 declarations directly to `src/logos.js` and delete `logos.inline.js` |

## User Preferences
- Prefers modular ES codebase with HMR (Vite) while retaining portable standalone HTML artifact as distribution output.

## Patterns That Work
- Splitting monolithic JavaScript files into focused ES modules.
- Using a centralized `app` state singleton with getters for shorthand state access (`app.state`) to prevent syncing bugs.
- Mocking minimal DOM globals in Node.js test environments (`smoke-test.mjs`) to test module parsing safely.
- Renaming entry points containing JSX syntax to `.jsx` so Rolldown/Vite parses them correctly.
- Using `useLayoutEffect` to trigger imperative DOM reflow side-effects (`adjustSectionBreakSpacing`) after Preact renders.
- Using Preact's `<Fragment>` to map items in loops, ensuring DOM tree queries like `previousElementSibling` continue to resolve correct siblings.

## Patterns That Don't Work
- Leaving raw non-module scripts like `<script src="logos.inline.js"></script>` in Vite projects if they must be inlined; Vite won't bundle them without `type="module"`.
- Calling Node `--check` syntax checks on `.jsx` files as Node does not natively support JSX.
- Using `div style={{ display: 'contents' }}` as a JSX list loop wrapper when DOM methods like `previousElementSibling` are used to target adjacent elements; the div is still present in the DOM tree and interrupts sibling lookups.

## Domain Notes
- Call Sheet Maker is a standalone browser app for production call sheets
- The distribution artifact is `Call Sheet Maker.html` — a single self-contained HTML file
- The app uses `localStorage` for persistence, multi-day support, Claude API for intake parsing
- `logos` are base64 export constants in `src/logos.js` — treated as a blob, not logic
- `store` = persisted JSON object (days[], currentDayId, tweaks); `state` = shorthand for the current day (a computed reference into store.days)

