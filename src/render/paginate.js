// Pure pagination algorithm — no DOM, no signals, no app state.
//
// Given a flat list of measured sections (in document order), the set of
// manual page breaks, and how much vertical space each page offers, decide:
//   - which sections need an AUTO page break before them, and
//   - whether a schedule section is taller than a full page (overflow).
//
// Keeping this pure makes the behavior testable in isolation: feed in
// synthetic heights, assert the resulting breaks. The DOM-measurement half
// (reading getBoundingClientRect, paper padding, etc.) lives in reflow.js and
// is the only part that needs a browser.
//
// @param {Array<{id: string, height: number, isSchedule: boolean}>} sections
//        Sections in document order. `height` is the section's PRINT height
//        in px, INCLUDING its bottom margin.
// @param {Set<string>|Iterable<string>} manualBreakIds
//        Section IDs that the user has placed a manual page break before.
// @param {number} page1Avail  Usable height on page 1 (after header + gap).
// @param {number} pageNAvail  Usable height on every subsequent page.
// @returns {{ autoBreaks: string[], scheduleOverflow: {sectionId: string, overflowPx: number}|null }}
export function computePageBreaks(sections, manualBreakIds, page1Avail, pageNAvail) {
  const manual = manualBreakIds instanceof Set ? manualBreakIds : new Set(manualBreakIds);

  const autoBreaks = [];
  let scheduleOverflow = null;
  let remaining = page1Avail;

  sections.forEach((sec, i) => {
    if (manual.has(sec.id)) {
      // Forced new page — reset the budget regardless of what fit before.
      remaining = pageNAvail;
    }

    const h = sec.height;

    if (sec.isSchedule && h > pageNAvail) {
      // A schedule taller than a whole page can't be auto-placed anywhere.
      // Leave it where it is and report the overflow so the UI can show an
      // indicator inviting a manual row break. overflowPx is measured from
      // the current page's remaining space.
      scheduleOverflow = { sectionId: sec.id, overflowPx: h - remaining };
      remaining -= h;
    } else if (i > 0 && remaining < h) {
      // Doesn't fit on the current page — break before it and start fresh.
      // Applies to every section type, schedule included (when it fits on a
      // page of its own).
      autoBreaks.push(sec.id);
      remaining = pageNAvail - h;
    } else {
      remaining -= h;
    }
  });

  return { autoBreaks, scheduleOverflow };
}
