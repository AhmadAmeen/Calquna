import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
let fails = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' — ' + extra : ''));
  if (!ok) fails++;
};

// ---------- mobile 390px: drawer ----------
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
await page.goto('http://localhost:8931/', { waitUntil: 'networkidle0', timeout: 30000 });

let s = await page.evaluate(() => {
  const btn = document.querySelector('[data-menubtn]');
  const drawer = document.querySelector('.drawer');
  const r = drawer.getBoundingClientRect();
  return {
    btnVisible: btn && btn.offsetParent !== null,
    drawerOffscreen: r.left >= window.innerWidth - 5,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});
check('mobile: menu button visible', s.btnVisible);
check('mobile: drawer starts off-canvas', s.drawerOffscreen);
check('mobile: no horizontal overflow (closed)', s.overflow === 0, 'overflow=' + s.overflow);

await page.tap('[data-menubtn]');
await new Promise((r) => setTimeout(r, 450));
s = await page.evaluate(() => {
  const drawer = document.querySelector('.drawer');
  const r = drawer.getBoundingClientRect();
  const links = [...drawer.querySelectorAll('nav a')].map((a) => a.textContent.trim());
  return {
    drawerOnscreen: r.left >= 0 && r.right <= window.innerWidth + 1,
    expanded: document.querySelector('[data-menubtn]').getAttribute('aria-expanded'),
    links,
    langVisible: !!drawer.querySelector('[data-langsel]') && drawer.querySelector('[data-langsel]').offsetParent !== null,
  };
});
check('mobile: drawer slides in on tap', s.drawerOnscreen);
check('mobile: aria-expanded=true', s.expanded === 'true');
check('mobile: drawer has 5 nav links', s.links.length === 5, s.links.join(','));
check('mobile: language select inside drawer', s.langVisible);
await page.screenshot({ path: 'shots/drawer-open-mobile.png' });

// language switch from inside the drawer -> French age page equivalent is home here
await page.select('[data-langsel]', '/fr/');
await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
check('mobile: language switch from drawer lands on /fr/', page.url().endsWith('/fr/'), page.url());

// close via the x button on a tool page (drawer exists on every page)
await page.goto('http://localhost:8931/fr/calculateur-age/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.tap('[data-menubtn]');
await new Promise((r) => setTimeout(r, 450));
await page.tap('[data-menuclose]');
await new Promise((r) => setTimeout(r, 450));
s = await page.evaluate(() => {
  const r = document.querySelector('.drawer').getBoundingClientRect();
  return { off: r.left >= window.innerWidth - 5, expanded: document.querySelector('[data-menubtn]').getAttribute('aria-expanded') };
});
check('mobile: close button hides drawer', s.off && s.expanded === 'false');

// ---------- mobile: search dropdown ----------
await page.goto('http://localhost:8931/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.tap('[data-toolfilter]');
await page.keyboard.type('salary', { delay: 50 });
await new Promise((r) => setTimeout(r, 400));
s = await page.evaluate(() => {
  const list = document.querySelector('[data-suggestions]');
  const items = [...list.querySelectorAll('a')];
  const rows = [...document.querySelectorAll('table.catalogue tbody tr')];
  return {
    listVisible: !list.hidden,
    itemCount: items.length,
    firstName: items.length ? items[0].querySelector('.suggest-name').textContent : '',
    firstHref: items.length ? items[0].getAttribute('href') : '',
    rowsStillVisible: rows.filter((tr) => tr.style.display !== 'none').length,
    heroStillVisible: document.querySelector('.hero-band').style.display !== 'none',
  };
});
check('dropdown: opens while typing', s.listVisible);
check('dropdown: "salary" gives exactly 1 suggestion', s.itemCount === 1, 'n=' + s.itemCount);
check('dropdown: suggestion is the salary tool', /Salary to hourly/.test(s.firstName) && s.firstHref === '/salary-to-hourly-calculator/', s.firstName + ' -> ' + s.firstHref);
check('dropdown: page below does NOT filter or hide', s.rowsStillVisible === 15 && s.heroStillVisible, 'rows=' + s.rowsStillVisible);
await page.screenshot({ path: 'shots/search-dropdown-mobile.png' });

// tapping the suggestion goes straight to the tool
await page.tap('[data-suggestions] a');
await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
check('dropdown: tap takes you straight to the tool page', page.url().endsWith('/salary-to-hourly-calculator/'), page.url());

// keyboard: type bmi, Enter picks the first suggestion
await page.goto('http://localhost:8931/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.tap('[data-toolfilter]');
await page.keyboard.type('bmi', { delay: 50 });
await new Promise((r) => setTimeout(r, 300));
await page.keyboard.press('Enter');
await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
check('dropdown: Enter picks the first suggestion', page.url().endsWith('/bmi-calculator/'), page.url());

// Spanish homepage: suggestions are the Spanish tools with Spanish URLs
await page.goto('http://localhost:8931/es/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.tap('[data-toolfilter]');
await page.keyboard.type('salario', { delay: 50 });
await new Promise((r) => setTimeout(r, 300));
s = await page.evaluate(() => {
  const a = document.querySelector('[data-suggestions] a');
  return { href: a ? a.getAttribute('href') : '', name: a ? a.querySelector('.suggest-name').textContent : '' };
});
check('dropdown: ES suggestions link to ES tools', s.href === '/es/salario-por-hora/', s.name + ' -> ' + s.href);

// no-match state: one plain row inside the dropdown, page untouched
await page.evaluate(() => {
  const i = document.querySelector('[data-toolfilter]');
  i.value = 'zzzz';
  i.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 200));
s = await page.evaluate(() => ({
  noneRow: !!document.querySelector('.suggest-none'),
  links: document.querySelectorAll('[data-suggestions] a').length,
  rows: [...document.querySelectorAll('table.catalogue tbody tr')].filter((tr) => tr.style.display !== 'none').length,
}));
check('dropdown: nonsense shows a no-match row and no links', s.noneRow && s.links === 0 && s.rows === 15);

// ---------- desktop 1280px ----------
const d = await browser.newPage();
await d.setViewport({ width: 1280, height: 900 });
await d.goto('http://localhost:8931/', { waitUntil: 'networkidle0', timeout: 30000 });
s = await d.evaluate(() => {
  const nav = document.querySelector('.drawer nav');
  return {
    btnHidden: document.querySelector('[data-menubtn]').offsetParent === null,
    navVisible: nav.offsetParent !== null,
    navLinksRow: new Set([...nav.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top))).size === 1,
    langVisible: document.querySelector('[data-langsel]').offsetParent !== null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});
check('desktop: menu button hidden', s.btnHidden);
check('desktop: inline nav visible, one row', s.navVisible && s.navLinksRow);
check('desktop: language select visible in header', s.langVisible);
check('desktop: no horizontal overflow', s.overflow === 0, 'overflow=' + s.overflow);
await d.screenshot({ path: 'shots/home-desktop-after.png' });

await browser.close();
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
process.exit(fails ? 1 : 0);
