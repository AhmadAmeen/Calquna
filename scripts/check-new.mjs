import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const out = [];
// Tool page components (EN)
await page.goto('http://localhost:8931/percentage-calculator/', { waitUntil: 'networkidle0' });
out.push(['crumbs EN', await page.$eval('.crumbs', e => e.textContent.replace(/\s+/g, ' ').trim())]);
out.push(['onpage links', await page.$$eval('.onpage a', as => as.map(a => a.getAttribute('href')).join(','))]);
out.push(['related count', await page.$$eval('.related li a', as => as.length)]);
out.push(['related first', await page.$eval('.related li a', a => a.textContent + ' -> ' + a.getAttribute('href'))]);
// FR tool page
await page.goto('http://localhost:8931/fr/calculateur-de-moyenne/', { waitUntil: 'networkidle0' });
out.push(['crumbs FR', await page.$eval('.crumbs', e => e.textContent.replace(/\s+/g, ' ').trim())]);
out.push(['related FR hrefs all /fr/', await page.$$eval('.related li a', as => as.every(a => a.getAttribute('href').startsWith('/fr/')))]);
// Homepage filter
await page.goto('http://localhost:8931/', { waitUntil: 'networkidle0' });
await page.type('[data-toolfilter]', 'salary');
await new Promise(r => setTimeout(r, 300));
const vis = await page.$$eval('table.catalogue tbody tr', trs => trs.filter(tr => tr.style.display !== 'none').map(tr => tr.querySelector('a').textContent));
out.push(['filter "salary" visible rows', JSON.stringify(vis)]);
await page.$eval('[data-toolfilter]', el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
await new Promise(r => setTimeout(r, 300));
const all = await page.$$eval('table.catalogue tbody tr', trs => trs.filter(tr => tr.style.display !== 'none').length);
out.push(['filter cleared visible rows', all]);
for (const [k, v] of out) console.log(k, '=>', v);
await browser.close();
