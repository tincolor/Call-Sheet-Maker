import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { parseCSVtoDrafts } from '../src/csv.js';
import { paginateDay } from '../src/render/pagination.js';

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
const release = await read('exports/Call Sheet Maker.html');
const mainJs = await read('src/main.jsx');

assert(index.includes('<link rel="stylesheet" href="styles.css" />'), 'index.html must load styles.css');
assert(index.includes('<script type="module" src="/src/main.jsx"></script>'), 'index.html must load src/main.jsx');
assert(styles.includes('.paper'), 'styles.css should contain sheet styles');

// Verify that the release build has inlined CSS and JS
assert(release.includes('Company Name'), 'exports/Call Sheet Maker.html should contain placeholder default data');
assert(release.includes('class:`paper`') || release.includes('class:"paper"'), 'exports/Call Sheet Maker.html should contain sheet template structure');



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

// Test derived pagination behavior
const secA = { id: 'a', type: 'contacts', title: 'A', data: [] };
const secB = { id: 'b', type: 'contacts', title: 'B', data: [] };
const sched = {
  id: 'sched',
  type: 'schedule',
  title: 'Schedule',
  data: [
    { type: 'row', time: '07:00' },
    { type: 'row', time: '08:00' },
    { type: 'row', time: '09:00' },
  ],
};

const baseMeasurements = {
  page1Available: 100,
  pageAvailable: 100,
  sections: {
    a: { fullHeight: 70 },
    b: { fullHeight: 60 },
    sched: {
      fullHeight: 150,
      firstScheduleBase: 20,
      continuationBase: 15,
      addControlsHeight: 0,
      rows: [
        { idx: 0, height: 35 },
        { idx: 1, height: 35 },
        { idx: 2, height: 35 },
      ],
    },
  },
};

let paged = paginateDay({ pageBreaks: [], sections: [secA, secB] }, baseMeasurements);
assert(paged.pages.length === 2, 'Non-schedule sections should flow to a new page when they overflow');
assert(paged.pages[1].breakBefore.mode === 'auto', 'Overflow page break should be derived as auto');

paged = paginateDay({ pageBreaks: [{ before: 'b' }], sections: [secA, secB] }, {
  ...baseMeasurements,
  sections: { ...baseMeasurements.sections, a: { fullHeight: 20 }, b: { fullHeight: 20 } },
});
assert(paged.pages.length === 2, 'Manual section break should force a new page');
assert(paged.pages[1].breakBefore.mode === 'manual', 'Manual section break should stay manual');

paged = paginateDay({ pageBreaks: [], sections: [sched] }, baseMeasurements);
assert(paged.pages.length === 2, 'Schedule rows should split across pages by measured row heights');
assert(paged.pages[0].items[0].start === 0 && paged.pages[0].items[0].end === 2, 'First schedule page should contain rows that fit');
assert(paged.pages[1].items[0].continued === true, 'Second schedule page should be a continuation');

paged = paginateDay({
  pageBreaks: [{ beforeRow: { sectionId: 'sched', idx: 1 } }],
  sections: [sched],
}, {
  ...baseMeasurements,
  page1Available: 200,
  pageAvailable: 200,
});
assert(paged.pages.length === 2, 'Manual schedule row break should force a continuation page');
assert(paged.pages[1].breakBefore.mode === 'manual', 'Manual row break should stay manual');

const stateForMutation = { pageBreaks: [], sections: [secA, secB] };
paginateDay(stateForMutation, baseMeasurements);
assert(stateForMutation.pageBreaks.length === 0, 'Derived auto pagination must not mutate saved pageBreaks');

console.log('Smoke test passed.');
