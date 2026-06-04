import { readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = 'Call Sheet Maker.html';

async function mustRead(path) {
  try {
    await access(path, constants.R_OK);
    return await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`Missing required file: ${path}\n${error.message}`);
  }
}

function inlineStyles(html, css) {
  return html.replace(
    '<link rel="stylesheet" href="styles.css" />',
    `<style>\n${css.trimEnd()}\n</style>`,
  );
}

function inlineScript(html, src, js) {
  return html.replace(
    `<script src="${src}"></script>`,
    `<script>\n${js.trimEnd()}\n</script>`,
  );
}

export async function buildSingleFile() {
  let html = await mustRead('index.html');
  const css = await mustRead('styles.css');
  const logos = await mustRead('logos.inline.js');
  const utils = await mustRead('src/utils.js');
  const state = await mustRead('src/state.js');
  const parser = await mustRead('src/parser.js');
  const intake = await mustRead('src/intake.js');
  const reflow = await mustRead('src/reflow.js');
  const render = await mustRead('src/render.js');
  const app = await mustRead('app.js');

  html = inlineStyles(html, css);
  html = inlineScript(html, 'logos.inline.js', logos);
  html = inlineScript(html, 'src/utils.js', utils);
  html = inlineScript(html, 'src/state.js', state);
  html = inlineScript(html, 'src/parser.js', parser);
  html = inlineScript(html, 'src/intake.js', intake);
  html = inlineScript(html, 'src/reflow.js', reflow);
  html = inlineScript(html, 'src/render.js', render);
  html = inlineScript(html, 'app.js', app);
  return html;
}

const isCli = fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  const check = process.argv.includes('--check');
  const built = await buildSingleFile();

  if (check) {
    const current = await mustRead(OUT);
    if (current !== built) {
      console.error(`${OUT} is out of date. Run: node scripts/build-single-file.mjs`);
      process.exit(1);
    }
    console.log(`${OUT} is up to date.`);
  } else {
    await writeFile(OUT, built);
    console.log(`Built ${OUT}`);
  }
}
