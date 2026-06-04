# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-06-04 | Agent | logos.inline.js was not inlined by Vite singlefile | Add `type="module"` to the script tag in index.html so Vite can process it as an ES module |

## User Preferences
- Prefers modular ES codebase with HMR (Vite) while retaining portable standalone HTML artifact as distribution output.

## Patterns That Work
- Splitting monolithic JavaScript files into focused ES modules.
- Using a centralized `app` state singleton with getters for shorthand state access (`app.state`) to prevent syncing bugs.
- Mocking minimal DOM globals in Node.js test environments (`smoke-test.mjs`) to test module parsing safely.

## Patterns That Don't Work
- Leaving raw non-module scripts like `<script src="logos.inline.js"></script>` in Vite projects if they must be inlined; Vite won't bundle them without `type="module"`.

## Domain Notes
- Call Sheet Maker is a standalone browser app for production call sheets
- The distribution artifact is `Call Sheet Maker.html` — a single self-contained HTML file
- The app uses `localStorage` for persistence, multi-day support, Claude API for intake parsing
- `logos.inline.js` is a 51KB data file that sets `window.__LOGO_BBC` and `window.__LOGO_SA` globals — treat it as a blob, not logic
- `store` = persisted JSON object (days[], currentDayId, tweaks); `state` = shorthand for the current day (a computed reference into store.days)

