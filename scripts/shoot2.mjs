import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
const outDir = new URL('../shots/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
for (const [w, h, tag, mobile] of [[390, 844, 'm390', true], [1280, 900, 'd1280', false]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
  for (const [name, path] of [['home', '/'], ['perc', '/percentage-calculator/']]) {
    await page.goto('http://localhost:8931' + path, { waitUntil: 'networkidle0' });
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(tag, name, 'overflow px:', ov);
    await page.screenshot({ path: `${outDir}${name}-${tag}.png` });
  }
  await page.close();
}
await browser.close();
