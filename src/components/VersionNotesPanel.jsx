import { useEffect } from 'preact/hooks';

const VERSIONS = [
  {
    version: '0.1',
    date: '2026-06-12',
    sections: [
      {
        label: 'New Features',
        items: [
          'Resizable schedule columns — drag the border between column headers to redistribute widths.',
          'Add and remove schedule columns — hover a column header to reveal a + / × pillbox.',
          'Per-section auto/manual time toggle — a clock pill in the left margin lets you switch a schedule section between auto-calculated and manually entered times.',
          'Flexible time input — the Time cell accepts 24h compact (1430), colon (14:30), and 12h formats (2:30 pm, 2:30pm, 2pm).',
          'Flexible duration input — bare numbers ≥ 9 are treated as minutes, ≤ 8 as hours; H:MM, and explicit h/m units (e.g. 1h30m, 45m) are also accepted.',
          'PRELIM watermark — a Prelim button in the toolbar overlays a diagonal semi-transparent watermark on every page for draft review.',
          'Privacy banner — a persistent accent-color notice below the toolbar confirms all data stays local.',
        ],
      },
      {
        label: 'Bug Fixes',
        items: [
          'Line breaks in schedule cells now persist across page reloads.',
          'Multi-line schedule rows correctly push downstream sections to the next page.',
          'Time and duration values now normalise to HH:MM / 1h30m immediately on blur, without requiring a page reload.',
          'The Time input no longer collapses to a single point when focused and empty.',
          'The Time / Duration placeholder text disappears on focus and reappears when the field is left empty.',
          'Column add/remove pillbox repositioned above the column header so it no longer covers the resize handle.',
          'Page break indicators (both auto and manual) were hidden by an overflow clip introduced with the watermark; clip removed.',
        ],
      },
      {
        label: 'Layout & Print',
        items: [
          'App header and footer are now pinned to the top and bottom of the viewport — the call sheet scrolls between them.',
          'Privacy banner and site footer are excluded from printed / PDF output.',
        ],
      },
    ],
  },
];

export function VersionNotesPanel() {
  const closePanel = () => document.body.classList.remove('version-notes-open');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div>
      <div class="version-notes-backdrop" onClick={closePanel} />
      <div class="version-notes-drawer">
        <div class="version-notes-hd">
          <h3>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Version Notes
          </h3>
          <button class="close-btn" onClick={closePanel} aria-label="Close panel">×</button>
        </div>
        <div class="version-notes-body">
          {VERSIONS.map(({ version, date, sections }) => (
            <div class="vn-version" key={version}>
              <div class="vn-version-hd">
                <span class="vn-version-tag">v{version}</span>
                <span class="vn-version-date">{date}</span>
              </div>
              {sections.map(({ label, items }) => (
                <div class="vn-section" key={label}>
                  <div class="vn-section-label">{label}</div>
                  <ul class="vn-list">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
