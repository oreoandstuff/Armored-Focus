import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:5195/binder', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
const gap = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.card-list > *')];
  if (rows.length < 2) return 'fewer than 2 cards: ' + rows.length;
  const r0 = rows[0].getBoundingClientRect(), r1 = rows[1].getBoundingClientRect();
  return { gap: Math.round(r1.top - r0.bottom), card0mb: getComputedStyle(rows[0]).marginBottom, card1mt: getComputedStyle(rows[1]).marginTop };
});
console.log(JSON.stringify(gap));
await b.close();
