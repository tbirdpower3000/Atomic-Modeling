// End-to-end checks in a real (headless) browser.   npm test
// Serves the repo locally, swaps the three.js CDN link for the local copy, and checks the app's numbers.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'].find(p => fs.existsSync(p));
const THREE = [path.join(ROOT, 'node_modules/three/build/three.min.js'), process.env.THREE_PATH].find(p => p && fs.existsSync(p));
if (!CHROME || !THREE) { console.error('Need Chrome (CHROME_PATH) and three@0.128 (npm install).'); process.exit(2); }

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/three.min.js') return res.end(fs.readFileSync(THREE));
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  let body = fs.readFileSync(f);
  if (f.endsWith('index.html')) body = body.toString().replace(/https:\/\/cdnjs[^"]*three\.min\.js/, '/three.min.js').replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '');
  res.setHeader('content-type', f.endsWith('.json') ? 'application/json' : f.endsWith('.html') ? 'text/html' : 'text/plain');
  res.end(body);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.setViewport({ width: 1200, height: 900 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, got) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${got !== undefined ? '  → ' + got : ''}`); if (!ok) failed++; };
const text = sel => page.evaluate(s => document.querySelector(s).innerText, sel);
const tab = async t => { await page.evaluate(t => document.querySelector(`[data-tab="${t}"]`).click(), t); await sleep(1200); };
const num = s => parseFloat(String(s).replace(/−/g, '-').replace(/,/g, ''));

// 1. a shared link restores the view
await page.goto(base + '#z=11&mode=cloud&n=3&l=0&m=0&by=ie&eu=eV&a=23');
await sleep(2500);
check('page loads without errors', errors.length === 0, errors.join(' | ') || 'no errors');
check('share link restores element and orbital', /Sodium.*3s orbital/.test(await text('#simLab')), (await text('#simLab')).split('\n')[0]);
check('the top bar shows what is loaded', /Na-23/.test(await text('#ctxChip')), await text('#ctxChip'));

// 1b. each tab opens, shows only its own panel, and fits in a few screens
for (const t of ['pt', 'spec', 'nuc', 'ff', 'trans', 'sm', 'atom']) {
  await tab(t);
  const r = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.tabpanel')].filter(x => !x.hidden).map(x => x.dataset.panel), screens: document.documentElement.scrollHeight / innerHeight }));
  check(`tab ${t}: one panel, ${r.screens.toFixed(1)} screens`, r.shown.length === 1 && r.shown[0] === t && r.screens < 6, r.shown.join());
}

// 2. every view mode switches without errors
for (const m of ['shape', 'cloud', 'vol', 'shell', 'nuc', 'gpu', 'qmc', 'quark']) await page.evaluate(m => document.querySelector(`[data-mode="${m}"]`).click(), m);
await sleep(500);
check('all eight views open', errors.length === 0, errors.join(' | ') || 'ok');

// 3. measured data: sodium's ionization energy
await tab('pt');
await page.evaluate(() => document.querySelector('[data-z="11"]').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
const ie = num((await text('#ptsum')).match(/ionization energy: ([\d.]+)/i)?.[1]);
check('sodium ionization energy is the measured 5.14 eV', Math.abs(ie - 5.14) < 0.01, ie);

// 4. transmutation lab: lead-208 to gold-197 takes 8 steps
await tab('trans');
await page.evaluate(() => document.querySelector('[data-trn="abs"]').click());
await sleep(300);
const tr = await text('#trStats');
check('lead to gold route has 8 steps', /^8\b/.test(tr.trim()), tr.replace(/\n/g, ' ').slice(0, 60));

// 5. spectrum: Balmer red line from the Rydberg formula
await tab('pt');
await page.evaluate(() => document.querySelector('[data-z="1"]').click());
await tab('spec');
await page.evaluate(() => document.querySelector('[data-sp="h"]').click());
await sleep(300);
const balmer = num((await text('#specOut')).match(/3 → 2\s+Balmer\s+([\d.]+) nm/)?.[1]);
check('hydrogen Balmer line within 0.02 nm of 656.28', Math.abs(balmer - 656.28) < 0.02, balmer);

// 6. Schrödinger solver (CPU path, runs anywhere): harmonic oscillator ground state is 1.5 ħω = 40.8 eV
await tab('atom');
await page.evaluate(() => { document.querySelector('[data-lvl="lab"]').click(); document.querySelector('[data-mode="gpu"]').click(); document.querySelector('[data-gg="32"]').click(); const s = document.getElementById('gPot'); s.value = 'ho'; s.dispatchEvent(new Event('change')); document.getElementById('gK').value = '2'; document.getElementById('gGo').click(); });
for (let i = 0; i < 90 && !(await text('#gStat')).startsWith('Done'); i++) await sleep(1000);
const res = await text('#gRes');
const e0 = num(res.match(/State 1\s+([\d.]+) eV/)?.[1]), e1 = num(res.match(/State 2\s+([\d.]+) eV/)?.[1]);
check('harmonic oscillator ground state 40.8 eV', Math.abs(e0 - 40.8) < 0.2, e0);
check('harmonic oscillator first excited state 68.0 eV', Math.abs(e1 - 68.0) < 0.3, e1);

// 7. Monte Carlo starts and reports an energy for lithium
await page.evaluate(() => { document.querySelector('[data-mode="qmc"]').click(); document.querySelector('[data-qm="vmc"]').click(); document.getElementById('qGo').click(); });
let q = ''; for (let i = 0; i < 60 && !/Total energy/.test(q = await text('#qRes')); i++) await sleep(1000);
const eq = num(q.match(/Total energy\s+(-?[\d.]+)/)?.[1]);
check('Monte Carlo lithium energy near -7.4 hartree', Math.abs(eq + 7.45) < 0.15, eq);

// 8. Learn level hides the advanced views; a mission completes when its goal is met
await page.evaluate(() => { document.getElementById('msReset').click(); document.querySelector('[data-lvl="learn"]').click(); });
await tab('pt');
await sleep(300);
const hid = await page.evaluate(() => getComputedStyle(document.querySelector('[data-mode="gpu"]')).display === 'none' && getComputedStyle(document.querySelector('[data-mode="cloud"]')).display !== 'none');
check('Learn hides the solver views and keeps the basic ones', hid);
await page.evaluate(() => document.querySelector('[data-z="6"]').click());
await sleep(1200);
const ms = await text('#msCard');
check('picking carbon completes the first mission', /Mission complete/.test(ms) && /1 of 10/.test(await text('#msProg')), ms.split('\n')[0]);
await page.evaluate(() => document.querySelector('[data-lvl="lab"]').click());
check('Lab shows the solver views again', await page.evaluate(() => getComputedStyle(document.querySelector('[data-mode="gpu"]')).display !== 'none'));

// 9. fuse and split: energies straight from the measured masses
await tab('ff');
const dt = num((await text('#ffOut')).match(/Energy released\s+([\d.]+) MeV/)?.[1]);
check('D + T releases the measured 17.59 MeV', Math.abs(dt - 17.59) < 0.05, dt);
await page.evaluate(() => document.querySelector('[data-fu="3a"]').click());
await sleep(400);
const ta = num((await text('#ffOut')).match(/Energy released\s+([\d.]+) MeV/)?.[1]);
check('triple alpha releases the measured 7.27 MeV', Math.abs(ta - 7.275) < 0.02, ta);
await page.evaluate(() => { document.querySelector('[data-ff="split"]').click(); document.querySelector('[data-fi="u235"]').click(); });
await sleep(500);
const fi = await text('#ffOut');
const fq = num(fi.match(/Energy released\s+([\d.]+) MeV/)?.[1]);
check('U-235 fission releases 160-200 MeV', fq > 150 && fq < 205, fq);
check('U-235 splits with a slow neutron, U-238 does not', /Yes\./.test(fi));
await page.evaluate(() => document.querySelector('[data-fi="u238"]').click());
await sleep(500);
check('U-238 needs a fast neutron', /No\./.test(await text('#ffOut')));

check('no errors during the whole run', errors.length === 0, errors.join(' | ') || 'ok');
await browser.close(); server.close();
process.exit(failed ? 1 : 0);
