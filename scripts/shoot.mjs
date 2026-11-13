import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';

const outDir = new URL('../shots/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const pages = [
  ['home', 'http://localhost:8931/'],
  ['age', 'http://localhost:8931/age-calculator/'],
  ['bmi', 'http://localhost:8931/bmi-calculator/'],
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

for (const [name, url] of pages) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, 'horizontal overflow px:', overflow);
  await page.screenshot({ path: outDir + name + '-top.png' });
  await page.screenshot({ path: outDir + name + '-full.png', fullPage: true });
}
await browser.close();
console.log('done');
