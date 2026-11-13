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

// ---------- mobile: search ----------
await page.goto('http://localhost:8931/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.tap('[data-toolfilter]');
await page.keyboard.type('salary', { delay: 50 });
await new Promise((r) => setTimeout(r, 400));
s = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('table.catalogue tbody tr')];
  const visible = rows.filter((tr) => tr.style.display !== 'none');
  return {
    visibleRows: visible.length,
    countText: document.querySelector('[data-matchcount]').textContent,
    countVisible: document.querySelector('[data-matchcount]').style.display !== 'none',
    heroHidden: document.querySelector('.hero-band').style.display === 'none',
    firstVisibleTop: visible.length ? Math.round(visible[0].getBoundingClientRect().top + window.scrollY) : null,
  };
});
check('search: "salary" leaves 1 row', s.visibleRows === 1, 'rows=' + s.visibleRows);
check('search: match count shown under box', s.countVisible && /1 tool matches/.test(s.countText), s.countText);
check('search: hero hidden while searching', s.heroHidden);
check('search: match lands near the top now', s.firstVisibleTop !== null && s.firstVisibleTop < 700, 'top=' + s.firstVisibleTop);
await page.screenshot({ path: 'shots/search-fixed-mobile.png' });

// clearing restores everything
await page.evaluate(() => {
  const i = document.querySelector('[data-toolfilter]');
  i.value = '';
  i.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 200));
s = await page.evaluate(() => ({
  rows: [...document.querySelectorAll('table.catalogue tbody tr')].filter((tr) => tr.style.display !== 'none').length,
  heroBack: document.querySelector('.hero-band').style.display !== 'none',
}));
check('search: clearing restores all 15 rows and the hero', s.rows === 15 && s.heroBack);

// no-match state
await page.evaluate(() => {
  const i = document.querySelector('[data-toolfilter]');
  i.value = 'zzzz';
  i.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 200));
s = await page.evaluate(() => ({ nomatch: document.querySelector('[data-nomatch]').style.display !== 'none' }));
check('search: no-match message shows for nonsense', s.nomatch);

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
