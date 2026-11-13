import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const results = [];
const check = (name, got, want) => results.push([name, got.includes(want), got.slice(0, 130)]);

// ES age: born 14 Mar 1990 on 13 Nov 2026 -> 36 años, 13.393 días
await page.goto('http://localhost:8931/es/calculadora-de-edad/', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const d = document.getElementById('dob');
  d.value = '1990-03-14';
  d.dispatchEvent(new Event('change', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
check('es age', await page.$eval('#out', (e) => e.textContent), '36 años');
check('es age days', await page.$eval('#out', (e) => e.textContent), '13.393');

// ES promedio: prefilled rows -> Nota media 8,11
await page.goto('http://localhost:8931/es/calculadora-de-promedio/', { waitUntil: 'networkidle0' });
const calcBtn = await page.$('#calc');
if (calcBtn) await calcBtn.click();
await new Promise((r) => setTimeout(r, 300));
check('es promedio', await page.$eval('#out', (e) => e.textContent), '8,11');

// ES embarazo: FUR 1 Feb 2026 -> 8 de noviembre de 2026
await page.goto('http://localhost:8931/es/calculadora-de-embarazo/', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const l = document.getElementById('lmp');
  l.value = '2026-02-01';
  l.dispatchEvent(new Event('change', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
check('es parto', await page.$eval('#out', (e) => e.textContent), '8 de noviembre de 2026');

// FR salaire: default should compute; set 2500 non-cadre -> 1 925
await page.goto('http://localhost:8931/fr/salaire-brut-net/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('fr salaire', await page.$eval('body', (e) => e.textContent), '1 925');

// FR moyenne: prefilled -> 13,55
await page.goto('http://localhost:8931/fr/calculateur-de-moyenne/', { waitUntil: 'networkidle0' });
const frCalc = await page.$('#calc');
if (frCalc) await frCalc.click();
await new Promise((r) => setTimeout(r, 300));
check('fr moyenne', await page.$eval('#out', (e) => e.textContent), '13,55');

// FR age: hreflang + lang
await page.goto('http://localhost:8931/fr/calculateur-age/', { waitUntil: 'networkidle0' });
check('fr lang', await page.$eval('html', (e) => e.getAttribute('lang')), 'fr');
const hreflangCount = await page.evaluate(() => document.querySelectorAll('link[hreflang]').length);
results.push(['hreflang links', hreflangCount >= 4, 'count=' + hreflangCount]);

await browser.close();
let fail = 0;
for (const [name, ok, got] of results) {
  console.log(ok ? 'PASS' : 'FAIL', name, '|', got.replace(/\s+/g, ' ').trim());
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);
