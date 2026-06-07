// Smoke checks on the source wiring and the committed single-file build.
// These guard the things a unit test can't see: that index.html points at the
// right entry/styles, and that the release HTML actually inlined CSS + JS.

import { describe, test, expect } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(resolve(root, name), 'utf8');

describe('source wiring', () => {
  test('index.html loads styles.css and the JS entry', () => {
    const index = read('index.html');
    expect(index).toContain('<link rel="stylesheet" href="styles.css" />');
    expect(index).toContain('<script type="module" src="/src/main.jsx"></script>');
  });

  test('styles.css contains the sheet styles', () => {
    expect(read('styles.css')).toContain('.paper');
  });
});

describe('release build (Call Sheet Maker.html)', () => {
  const releaseName = 'Call Sheet Maker.html';

  test('exists', () => {
    expect(existsSync(resolve(root, releaseName))).toBe(true);
  });

  test('inlined the default data and the sheet template', () => {
    const release = read(releaseName);
    expect(release).toContain('Street Attack Japan K.K.'); // default data baked in
    const hasInlinedTemplate =
      release.includes('class:`paper`') || release.includes('class:"paper"');
    expect(hasInlinedTemplate).toBe(true);
  });

  test('inlined CSS rather than linking it', () => {
    const release = read(releaseName);
    expect(release).toContain('<style');
    expect(release).not.toContain('href="styles.css"');
  });
});
