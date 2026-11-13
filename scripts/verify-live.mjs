import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';

const outDir = new URL('../shots/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const BASE = 'https://calquna.pages.dev';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

const results = [];
for (const [name, path] of [['live-home', '/'], ['live-es-embarazo', '/es/calculadora-de-embarazo/'], ['live-fr-salaire', '/fr/salaire-brut-net/']]) {
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 45000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  results.push([name + ' overflow', overflow === 0, 'px=' + overflow]);
  await page.screenshot({ path: outDir + name + '.png' });
}

// Live functional check: age calculator on the real site
await page.goto(BASE + '/age-calculator/', { waitUntil: 'networkidle0', timeout: 45000 });
await page.evaluate(() => {
  const d = document.getElementById('dob');
  d.value = '1990-03-14';
  d.dispatchEvent(new Event('change', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 400));
const txt = await page.$eval('#out', (e) => e.textContent);
results.push(['live age computes', txt.includes('36 years'), txt.slice(0, 60)]);

await browser.close();
let fail = 0;
for (const [name, ok, got] of results) {
  console.log(ok ? 'PASS' : 'FAIL', name, '|', got);
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);
