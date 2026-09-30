// End-to-end check: loads this folder as an extension in a real Chromium and
// serves a replica of a Claude Doc's frames (editor in a sandboxed about:srcdoc
// iframe with the viewer's CSP). Fails if the TOC doesn't appear there, jump
// doesn't land, or the highlight is wrong.
//
//   npm i --no-save playwright-core && node check.mjs
//
// Needs a Playwright Chromium in ~/.cache/ms-playwright (npx playwright install chromium).
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const cache = path.join(os.homedir(), '.cache/ms-playwright');
const latest = fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().at(-1);
const exe = path.join(cache, latest, 'chrome-linux64/chrome');

// Same extension, but matching the local replica instead of claudeusercontent.com.
const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-toc-'));
fs.copyFileSync(path.join(here, 'claude_docs_toc.js'), path.join(ext, 'claude_docs_toc.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
manifest.content_scripts[0].matches = ['http://localhost/*'];
fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(manifest));

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const editor = `<!doctype html><html><head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; script-src-attr 'none'; style-src 'unsafe-inline'">
  <style>p{height:80vh}</style></head><body>
  <div class="ProseMirror" contenteditable="true">
    <h1>Doc title</h1><p></p><h2>Call details</h2><p></p><h2>Company snapshot</h2><p></p>
    <h3>Sub point<span contenteditable="false">Claude</span></h3><p></p><h2>The role</h2><p></p>
  </div></body></html>`;
const page = `<!doctype html><body style="margin:0"><iframe sandbox="allow-scripts"
  style="width:100vw;height:100vh;border:0" srcdoc="${esc(editor)}"></iframe></body>`;
const srv = http.createServer((_, res) => res.end(page)).listen(8767);

const ctx = await chromium.launchPersistentContext('', {
  executablePath: exe,
  headless: true,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
try {
  const tab = await ctx.newPage();
  await tab.goto('http://localhost:8767/');
  const frame = tab.frames().find((f) => f !== tab.mainFrame());
  await frame.waitForSelector('#cd-toc li button', { timeout: 5000 });
  const state = () =>
    frame.evaluate(() => ({
      items: [...document.querySelectorAll('#cd-toc li button')].map((b) => b.textContent),
      on: document.querySelector('#cd-toc button.on')?.textContent,
    }));

  assert.deepEqual((await state()).items, ['Doc title', 'Call details', 'Company snapshot', 'Sub point', 'The role']);
  assert.equal((await state()).on, 'Doc title');

  const jump = async (name) => {
    await frame.click(`#cd-toc li button:text-is("${name}")`);
    await tab.waitForTimeout(1200);
    return frame.evaluate((n) => {
      const h = [...document.querySelectorAll('.ProseMirror :is(h1,h2,h3)')].find((e) => e.firstChild.textContent === n);
      return Math.round(h.getBoundingClientRect().top);
    }, name);
  };
  const top = await jump('Company snapshot');
  assert.ok(Math.abs(top - 72) <= 2, `jump landed at ${top}px, want 72`);
  assert.equal((await state()).on, 'Company snapshot');

  await jump('The role'); // last heading can't reach the top of the page
  assert.equal((await state()).on, 'The role');
  console.log('ok');
} finally {
  await ctx.close();
  srv.close();
  fs.rmSync(ext, { recursive: true });
}
