import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const results = [];
const check = (name, got, want) => results.push([name, got.includes(want), got.slice(0, 110)]);

// Age calculator: born 14 Mar 1990, on 13 Nov 2026 -> 36 years, 7 months, 30 days, 13,393 days
await page.goto('http://localhost:8931/age-calculator/', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const d = document.getElementById('dob');
  d.value = '1990-03-14';
  d.dispatchEvent(new Event('change', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
check('age', await page.$eval('#out', (e) => e.textContent), '36 years, 7 months, 30 days');
check('age days', await page.$eval('#out', (e) => e.textContent), '13,393');

// Days between dates: 1 Jan 2026 -> 13 Nov 2026 = 316 days
await page.goto('http://localhost:8931/days-between-dates/', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const s = document.getElementById('start');
  s.value = '2026-01-01';
  const e = document.getElementById('end');
  e.value = '2026-11-13';
  e.dispatchEvent(new Event('change', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
check('days', await page.$eval('#out', (e) => e.textContent), '316 days');

// BMI: 70 kg, 175 cm -> BMI 22.9
await page.goto('http://localhost:8931/bmi-calculator/', { waitUntil: 'networkidle0' });
await page.type('#kg', '70');
await page.type('#cm', '175');
await page.click('#calc');
await new Promise((r) => setTimeout(r, 300));
check('bmi', await page.$eval('#out', (e) => e.textContent), 'BMI 22.9');

// Due date: LMP 1 Feb 2026 -> due around 8 November 2026
await page.goto('http://localhost:8931/due-date-calculator/', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const l = document.getElementById('lmp');
  l.value = '2026-02-01';
  l.dispatchEvent(new Event('change', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 300));
check('due', await page.$eval('#out', (e) => e.textContent), '8 November 2026');

// Sleep: wake 06:30 -> in bed by 22:45
await page.goto('http://localhost:8931/sleep-calculator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('sleep', await page.$eval('#out', (e) => e.textContent), 'In bed by 22:45');

// Word counter
await page.goto('http://localhost:8931/word-counter/', { waitUntil: 'networkidle0' });
await page.type('#text', 'One two three. Four five!');
await new Promise((r) => setTimeout(r, 300));
check('words', await page.$eval('#words', (e) => e.textContent), '5');

// Compound interest: defaults 10000 + 200/mo at 7% for 10y -> 54,713.58
await page.goto('http://localhost:8931/compound-interest-calculator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('compound', await page.$eval('#out', (e) => e.textContent), '54,713.58');

// Salary: default 60000 -> 28.85 an hour
await page.goto('http://localhost:8931/salary-to-hourly-calculator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('salary', await page.$eval('#out', (e) => e.textContent), '28.85 an hour');

// Percentage: defaults -> 36, 25%, +25% increase
await page.goto('http://localhost:8931/percentage-calculator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('pct of', await page.$eval('#out-a', (e) => e.textContent), 'is 36');
check('pct change', await page.$eval('#out-c', (e) => e.textContent), '25% increase');

// GPA: prefilled rows -> GPA 3.51
await page.goto('http://localhost:8931/gpa-calculator/', { waitUntil: 'networkidle0' });
await page.click('#calc');
await new Promise((r) => setTimeout(r, 300));
check('gpa', await page.$eval('#out', (e) => e.textContent), 'GPA 3.51');

// Password generator: default 16 chars, ~102 bits
await page.goto('http://localhost:8931/password-generator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
const pw = await page.$eval('#password', (e) => e.textContent);
results.push(['password length', pw.trim().length === 16, 'len=' + pw.trim().length]);
check('password bits', await page.$eval('#strength', (e) => e.textContent), '102 bits');

// QR generator: canvas should be drawn (non-white pixels)
await page.goto('http://localhost:8931/qr-code-generator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const dark = await page.evaluate(() => {
  const c = document.getElementById('qr');
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 60) n++;
  return n;
});
results.push(['qr drawn', dark > 1000, 'dark px=' + dark]);

// YouTube money: default 100k views tech -> About $550 a month
await page.goto('http://localhost:8931/youtube-money-calculator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('youtube', await page.$eval('#out', (e) => e.textContent), '$550 a month');

// TikTok money: defaults -> About $840 a month, 12.0% engagement
await page.goto('http://localhost:8931/tiktok-money-calculator/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
check('tiktok', await page.$eval('#out', (e) => e.textContent), '$840 a month');
check('tiktok eng', await page.$eval('#out', (e) => e.textContent), '12.0%');

// Unfollowers: feed the test ZIP -> 1 does not follow back (dave), fans alice
await page.goto('http://localhost:8931/instagram-unfollowers-checker/', { waitUntil: 'networkidle0' });
const input = await page.$('#zip');
await input.uploadFile('/tmp/ig-test.zip');
await new Promise((r) => setTimeout(r, 800));
check('unfollowers headline', await page.$eval('#out', (e) => e.textContent), '1 do not follow you back');
check('unfollowers dave', await page.$eval('#out', (e) => e.textContent), '@dave');
check('unfollowers fans', await page.$eval('#out', (e) => e.textContent), '@alice');

await browser.close();
let fail = 0;
for (const [name, ok, got] of results) {
  console.log(ok ? 'PASS' : 'FAIL', name, '|', got.replace(/\s+/g, ' ').trim());
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);
