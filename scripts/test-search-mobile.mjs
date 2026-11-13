import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on('console', (m) => console.log('console:', m.type(), m.text()));
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

await page.goto('http://localhost:8931/', { waitUntil: 'networkidle0', timeout: 30000 });

// tap into the filter like a phone user, type slowly (real keyboard events)
await page.tap('[data-toolfilter]');
await page.keyboard.type('salary', { delay: 60 });
await new Promise((r) => setTimeout(r, 500));

const state = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('table.catalogue tbody tr')];
  const visible = rows.filter((tr) => tr.style.display !== 'none');
  return {
    inputValue: document.querySelector('[data-toolfilter]').value,
    totalRows: rows.length,
    visibleRows: visible.length,
    visibleText: visible.map((tr) => tr.textContent.trim().slice(0, 40)),
    nomatchDisplay: document.querySelector('[data-nomatch]')?.style.display,
    // distance from top of page to the first visible row: if the match is far
    // below the fold the user sees "nothing happened"
    firstVisibleTop: visible.length ? Math.round(visible[0].getBoundingClientRect().top + window.scrollY) : null,
    scrollY: window.scrollY,
    docHeight: document.documentElement.scrollHeight,
  };
});
console.log(JSON.stringify(state, null, 2));
await page.screenshot({ path: 'shots/search-salary-mobile.png', fullPage: true });
await browser.close();
