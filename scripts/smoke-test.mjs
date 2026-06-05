import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { parseCSVtoDrafts } from '../src/csv.js';

// Mock minimal browser globals for Node.js import execution compatibility
globalThis.window = {
  __LOGO_BBC: '',
  __LOGO_SA: '',
};
globalThis.document = {
  readyState: 'complete',
  addEventListener: () => {},
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(path) {
  return readFile(path, 'utf8');
}

function checkSyntax(path) {
  const result = spawnSync('node', ['--check', path], { encoding: 'utf8' });
  assert(result.status === 0, `${path} has a syntax error:\n${result.stderr || result.stdout}`);
}

const index = await read('index.html');
const styles = await read('styles.css');
const release = await read('Call Sheet Maker.html');
const mainJs = await read('src/main.jsx');

assert(index.includes('<link rel="stylesheet" href="styles.css" />'), 'index.html must load styles.css');
assert(index.includes('<script type="module" src="/src/main.jsx"></script>'), 'index.html must load src/main.jsx');
assert(styles.includes('.paper'), 'styles.css should contain sheet styles');

// Verify that the release build has inlined CSS and JS
assert(release.includes('Street Attack Japan K.K.'), 'Call Sheet Maker.html should contain default data');
assert(release.includes('class:`paper`') || release.includes('class:"paper"'), 'Call Sheet Maker.html should contain sheet template structure');



// Test CSV parser behavior
const drafts = parseCSVtoDrafts(`# DAY · 2026.04.30 (THU)
# META
key,value
project,"A, B"
date,2026.04.30 (THU)

# SCHEDULE · Schedule
type,time,dur,task,loc,cast,note
row,07:00,1h,LOAD IN,Studio,,Crew call
span,12:00,1h,LUNCH,,,
`);

assert(drafts.length === 1, 'CSV parser should return one day');
assert(drafts[0].meta.project === 'A, B', 'CSV parser should preserve quoted commas');
assert(drafts[0].sections[0].data.length === 2, 'CSV parser should import schedule rows');

console.log('Smoke test passed.');
