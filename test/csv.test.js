// Spec for the custom CSV-ish import format (src/csv.js).
// The format is RFC-4180 rows with structural `# META`, `# DAY · …` and
// `# SECTIONTYPE · Title` header lines.

import { describe, test, expect } from 'bun:test';
import { parseCSV, parseCSVtoDrafts } from '../src/csv.js';

describe('parseCSV (low-level rows)', () => {
  test('splits rows and columns', () => {
    expect(parseCSV('a,b\nc,d\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  test('preserves commas inside quotes', () => {
    expect(parseCSV('"a, b",c\n')).toEqual([['a, b', 'c']]);
  });

  test('unescapes doubled quotes', () => {
    expect(parseCSV('"she said ""hi""",x\n')).toEqual([['she said "hi"', 'x']]);
  });

  test('handles a final row with no trailing newline', () => {
    expect(parseCSV('a,b')).toEqual([['a', 'b']]);
  });
});

describe('parseCSVtoDrafts', () => {
  const sample = `# DAY · 2026.04.30 (THU)
# META
key,value
project,"A, B"
date,2026.04.30 (THU)

# SCHEDULE · Schedule
type,time,dur,task,loc,cast,note
row,07:00,1h,LOAD IN,Studio,,Crew call
span,12:00,1h,LUNCH,,,

# EQUIPMENT · Gear
text,done
Camera,true
Tripod,false

# HOSPITAL · Nearest ER
key,value
name,St. Mary
phone,555-1234
`;

  test('returns one day for a single # DAY block', () => {
    const drafts = parseCSVtoDrafts(sample);
    expect(drafts.length).toBe(1);
  });

  test('parses meta and preserves quoted commas', () => {
    const [d] = parseCSVtoDrafts(sample);
    expect(d.meta.project).toBe('A, B');
    expect(d.meta.date).toBe('2026.04.30 (THU)');
  });

  test('imports schedule rows as array data', () => {
    const [d] = parseCSVtoDrafts(sample);
    const sched = d.sections.find(s => s.type === 'schedule');
    expect(sched.title).toBe('Schedule');
    expect(sched.data.length).toBe(2);
    expect(sched.data[1].type).toBe('span');
  });

  test('coerces equipment "done" to a boolean', () => {
    const [d] = parseCSVtoDrafts(sample);
    const eq = d.sections.find(s => s.type === 'equipment');
    expect(eq.data[0].done).toBe(true);
    expect(eq.data[1].done).toBe(false);
  });

  test('parses key/value sections (hospital) as an object', () => {
    const [d] = parseCSVtoDrafts(sample);
    const hosp = d.sections.find(s => s.type === 'hospital');
    expect(Array.isArray(hosp.data)).toBe(false);
    expect(hosp.data.name).toBe('St. Mary');
    expect(hosp.data.phone).toBe('555-1234');
  });

  test('splits multiple # DAY blocks into separate drafts', () => {
    const two = sample + `
# DAY · 2026.05.01 (FRI)
# META
key,value
project,Day Two
`;
    const drafts = parseCSVtoDrafts(two);
    expect(drafts.length).toBe(2);
    expect(drafts[1].meta.project).toBe('Day Two');
  });

  test('ignores unknown # headers instead of treating them as sections', () => {
    const withComment = `# META
key,value
project,X

# RANDOM NOTE · ignore me
this,that

# NOTES · Real
key,value
text,hello
`;
    const [d] = parseCSVtoDrafts(withComment);
    const types = d.sections.map(s => s.type);
    expect(types).toEqual(['notes']);
    expect(d.sections[0].data.text).toBe('hello');
  });
});
