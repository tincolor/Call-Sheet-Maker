# Call Sheet Maker

Standalone browser app for building printable production call sheets.

## Development Workflow

- Run `bun run dev` to start the local Vite development server with Hot Module Replacement (HMR).
- Edit modular files in `src/`, as well as `index.html`, `styles.css`, and `logos.inline.js`.
- Run `bun run check` to execute smoke tests on the CSV parser and verify structure.
- Run `bun run build` to compile, inline all resources, and generate the standalone, portable `exports/Call Sheet Maker.html`.

`exports/Call Sheet Maker.html` is the release artifact. Avoid editing it directly because it is overwritten during builds.
