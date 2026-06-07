// Spec for the pure auto-pagination algorithm (src/render/paginate.js).
// Each case states an expected behavior — edit these first when the algorithm
// changes. No DOM here; the DOM-measurement half lives in reflow.js.

import { describe, test, expect } from 'bun:test';
import { computePageBreaks } from '../src/render/paginate.js';

// Synthetic page dimensions — round numbers so cases read clearly.
const PAGE1 = 800; // usable height on page 1 (after header + gap)
const PAGEN = 1000; // usable height on every later page

const sec = (id, height, isSchedule = false) => ({ id, height, isSchedule });
const run = (sections, manual = [], p1 = PAGE1, pn = PAGEN) =>
  computePageBreaks(sections, manual, p1, pn);

describe('basic packing', () => {
  test('empty input → no breaks, no overflow', () => {
    const r = run([]);
    expect(r.autoBreaks).toEqual([]);
    expect(r.scheduleOverflow).toBeNull();
  });

  test('single section stays on page 1 even if taller than the page', () => {
    // i === 0 never auto-breaks — there is no previous page to push from.
    const r = run([sec('a', PAGE1 + 500)]);
    expect(r.autoBreaks).toEqual([]);
    expect(r.scheduleOverflow).toBeNull();
  });

  test('sections that all fit on page 1 → no breaks', () => {
    const r = run([sec('a', 300), sec('b', 300), sec('c', 190)]); // 790 ≤ 800
    expect(r.autoBreaks).toEqual([]);
  });

  test('section that overflows page 1 → auto-break before it', () => {
    // a=500 leaves 300; b=400 doesn't fit → break before b.
    const r = run([sec('a', 500), sec('b', 400)]);
    expect(r.autoBreaks).toEqual(['b']);
  });
});

describe('boundary precision', () => {
  test('section that fits EXACTLY (remaining === height) → no break', () => {
    // remaining < h is the break condition, so equality must NOT break.
    const r = run([sec('a', 300), sec('b', 500)]); // 300 + 500 = 800 = PAGE1
    expect(r.autoBreaks).toEqual([]);
  });

  test('section 1px too tall → break', () => {
    const r = run([sec('a', 300), sec('b', 501)]); // 801 > 800
    expect(r.autoBreaks).toEqual(['b']);
  });

  test('later pages use pageNAvail, not page1Avail', () => {
    // a fills page 1 (800). b=950 fits on a pageN (1000) but not on a page1.
    const r = run([sec('a', 800), sec('b', 950)]);
    expect(r.autoBreaks).toEqual(['b']);
  });
});

describe('manual breaks', () => {
  test('manual break resets the budget to a full page', () => {
    // The manual break forces b onto its own page; c (650) then still fits
    // below b on page 2 (300 + 650 = 950 ≤ 1000) → no auto-break.
    const r = run([sec('a', 600), sec('b', 300), sec('c', 650)], ['b']);
    expect(r.autoBreaks).toEqual([]);
  });

  test('manual break is never reported as an auto-break', () => {
    const r = run([sec('a', 500), sec('b', 600)], ['b']);
    expect(r.autoBreaks).toEqual([]); // b would overflow too, but it's manual
  });

  test('auto-breaks still accumulate after a manual break', () => {
    // page1: a=800 (full). manual break before b resets to 1000.
    // b=600 → remaining 400. c=700 doesn't fit → auto-break before c.
    const r = run([sec('a', 800), sec('b', 600), sec('c', 700)], ['b']);
    expect(r.autoBreaks).toEqual(['c']);
  });
});

describe('schedules', () => {
  test('schedule that fits on a fresh page auto-breaks like any section', () => {
    // a fills page 1; schedule (900 ≤ 1000) doesn't fit after it → auto-break.
    const r = run([sec('a', 800), sec('s', 900, true)]);
    expect(r.autoBreaks).toEqual(['s']);
    expect(r.scheduleOverflow).toBeNull();
  });

  test('schedule taller than a full page → overflow, NOT an auto-break', () => {
    const r = run([sec('a', 200), sec('s', PAGEN + 300, true)]);
    expect(r.autoBreaks).toEqual([]);
    expect(r.scheduleOverflow.sectionId).toBe('s');
    // remaining after a(200) on page1(800) = 600; schedule height = 1300.
    expect(r.scheduleOverflow.overflowPx).toBe(1300 - 600);
  });

  test('section after an over-long schedule starts on a fresh page', () => {
    const r = run([sec('a', 200), sec('s', PAGEN + 300, true), sec('b', 100)]);
    expect(r.autoBreaks).toEqual(['b']);
    expect(r.scheduleOverflow.sectionId).toBe('s');
  });

  test('a single over-long schedule (first section) overflows in place', () => {
    const r = run([sec('s', PAGEN + 500, true)]);
    expect(r.autoBreaks).toEqual([]);
    expect(r.scheduleOverflow.sectionId).toBe('s');
  });
});

describe('realistic mix', () => {
  test('mixed document packs greedily across three pages', () => {
    const r = run([
      sec('intro', 300),    // p1: 300 / 800
      sec('sched', 450),    // p1: 750 / 800
      sec('contacts', 200), // 950 > 800 → break → p2: 200 / 1000
      sec('equip', 700),    // 900 / 1000
      sec('notes', 250),    // 1150 > 1000 → break → p3: 250 / 1000
    ]);
    expect(r.autoBreaks).toEqual(['contacts', 'notes']);
  });

  test('accepts an iterable (not just a Set) for manual breaks', () => {
    const r = run([sec('a', 800), sec('b', 600)], new Set(['b']));
    expect(r.autoBreaks).toEqual([]);
  });
});
