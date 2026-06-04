import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { buildSingleFile } from './build-single-file.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(path) {
  return readFile(path, 'utf8');
}

function checkSyntax(path) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  assert(result.status === 0, `${path} has a syntax error:\n${result.stderr || result.stdout}`);
}

function extractFunctionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Missing function ${name}`);
  let depth = 0;
  let seenBody = false;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') {
      depth++;
      seenBody = true;
    } else if (source[i] === '}') {
      depth--;
      if (seenBody && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

const index = await read('index.html');
const styles = await read('styles.css');
const logos = await read('logos.inline.js');
const parserContent = await read('src/parser.js');
const release = await read('Call Sheet Maker.html');

assert(index.includes('<link rel="stylesheet" href="styles.css" />'), 'index.html must load styles.css');
assert(index.includes('<script src="logos.inline.js"></script>'), 'index.html must load logos.inline.js');
assert(index.includes('<script src="src/utils.js"></script>'), 'index.html must load src/utils.js');
assert(index.includes('<script src="src/state.js"></script>'), 'index.html must load src/state.js');
assert(index.includes('<script src="src/parser.js"></script>'), 'index.html must load src/parser.js');
assert(index.includes('<script src="src/intake.js"></script>'), 'index.html must load src/intake.js');
assert(index.includes('<script src="src/reflow.js"></script>'), 'index.html must load src/reflow.js');
assert(index.includes('<script src="src/render.js"></script>'), 'index.html must load src/render.js');
assert(index.includes('<script src="app.js"></script>'), 'index.html must load app.js');
assert(styles.includes('.paper'), 'styles.css should contain sheet styles');
assert(logos.includes('window.__LOGO_BBC'), 'logos.inline.js should define built-in logos');
assert(parserContent.includes('function parseCSVtoDrafts'), 'parser.js should contain CSV import parser');
assert(release === await buildSingleFile(), 'Call Sheet Maker.html is out of date');

checkSyntax('src/utils.js');
checkSyntax('src/state.js');
checkSyntax('src/parser.js');
checkSyntax('src/intake.js');
checkSyntax('src/reflow.js');
checkSyntax('src/render.js');
checkSyntax('app.js');
checkSyntax('logos.inline.js');
checkSyntax('scripts/build-single-file.mjs');

const parserSource = [
  'const uid = () => "test-id";',
  extractFunctionSource(parserContent, 'parseCSV'),
  extractFunctionSource(parserContent, 'parseCSVtoDrafts'),
  'return parseCSVtoDrafts(input);',
].join('\n');
const parseCSVtoDrafts = new Function('input', parserSource);
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
