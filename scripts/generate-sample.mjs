#!/usr/bin/env bun
/**
 * Generates a synthetic call sheet CSV using OpenRouter + deepseek-v4-flash.
 * Run from the project root: bun run scripts/generate-sample.mjs
 * Reads OPENROUTER_API_KEY from .env (Bun loads it automatically).
 *
 * Output: sample-data/<slug>-<timestamp>.csv
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');
const OUT    = join(ROOT, 'sample-data');
const FORMAT = join(ROOT, 'CALL_SHEET_DATA_FORMAT.md');

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENROUTER_API_KEY in environment / .env');
  process.exit(1);
}

const formatDoc = readFileSync(FORMAT, 'utf8');

// ─── CSV helpers (mirrors src/csv.js, browser-free) ────────────────────────

function csvEscape(s) {
  s = s == null ? '' : String(s);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dayToCSVLines(day) {
  const lines = [];
  lines.push('# META');
  lines.push('key,value');
  Object.entries(day.meta).forEach(([k, v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
  lines.push('');

  day.sections.forEach(sec => {
    lines.push(`# ${sec.type.toUpperCase()} · ${sec.title}`);
    if (Array.isArray(sec.data)) {
      if (sec.data.length === 0) { lines.push(''); return; }
      const cols = Object.keys(sec.data[0]);
      lines.push(cols.join(','));
      sec.data.forEach(r => lines.push(cols.map(c => csvEscape(r[c])).join(',')));
    } else if (sec.data && typeof sec.data === 'object') {
      lines.push('key,value');
      Object.entries(sec.data).forEach(([k, v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
    }
    lines.push('');
  });

  return lines;
}

// ─── Extract JSON from model output (handles markdown fences) ───────────────

function extractJSON(text) {
  // Try fenced code block first: ```json ... ``` or ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try bare JSON object
  const bare = text.match(/(\{[\s\S]*\})/);
  if (bare) return bare[1].trim();
  throw new Error('No JSON found in model response');
}

// ─── Call OpenRouter ─────────────────────────────────────────────────────────

const SYSTEM = `You are a production coordinator who writes realistic film and commercial call sheets.
Your task: generate one complete call sheet day as a JSON object that strictly follows the provided data format spec.

Rules:
- Return ONLY valid JSON — no markdown, no prose, no explanation.
- The JSON must be a single object representing one day (not an array, not wrapped).
- Every field is a string unless the spec says otherwise (equipment "done" is boolean).
- Make the content realistic: real-sounding names, plausible locations, coherent schedule times.
- The schedule must start and end on the same day; times must progress forward.
- Include between 4 and 12 schedule rows (mix of row and span types).
- Include at least 2 contacts sections; include hospital, basecamp, equipment, and notes sections.
- Generate an id for each section as a short random string like "s1", "s2", etc.
- Set "pageBreaks": [] always.`;

const USER = `Here is the data format specification:

${formatDoc}

---

Generate a single call sheet day JSON. Be creative with the scenario — pick an interesting industry, location, and crew. Do not copy the example from the spec; invent something different.`;

console.log('Calling deepseek/deepseek-v4-flash via OpenRouter…');

const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://github.com/local/call-sheet-maker',
    'X-Title': 'Call Sheet Maker',
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-v4-flash',
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user',   content: USER },
    ],
    temperature: 1.0,
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error(`OpenRouter error ${res.status}:`, err);
  process.exit(1);
}

const payload = await res.json();
const raw = payload.choices?.[0]?.message?.content;
if (!raw) {
  console.error('Empty response from model:', JSON.stringify(payload, null, 2));
  process.exit(1);
}

// ─── Parse & validate ────────────────────────────────────────────────────────

let day;
try {
  day = JSON.parse(extractJSON(raw));
} catch (e) {
  console.error('Failed to parse JSON from model output:', e.message);
  console.error('Raw output:\n', raw);
  process.exit(1);
}

if (!day.meta || !Array.isArray(day.sections)) {
  console.error('Invalid day structure — missing meta or sections');
  console.error(JSON.stringify(day, null, 2));
  process.exit(1);
}

// ─── Convert to CSV & save ───────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true });

const csv = dayToCSVLines(day).join('\n');

const slug = (day.meta.project || 'sample')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40);
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const filename = `${slug}-${ts}.csv`;
const outPath  = join(OUT, filename);

writeFileSync(outPath, csv, 'utf8');

console.log(`✓ Saved: sample-data/${filename}`);
console.log(`  Project : ${day.meta.project || '(no project)'}`);
console.log(`  Date    : ${day.meta.date    || '(no date)'}`);
console.log(`  Location: ${day.meta.mainLocation || '(no location)'}`);
console.log(`  Sections: ${day.sections.map(s => s.type).join(', ')}`);
console.log(`  Schedule: ${day.sections.find(s => s.type === 'schedule')?.data?.length ?? 0} rows`);
