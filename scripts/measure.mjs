import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:5194/rules', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
const rects = await p.evaluate(() => {
  const heads = [...document.querySelectorAll('.section-head h3, .section-head .section-title, h3')];
  return heads.map(h => ({ t: h.textContent.trim().slice(0,20), y: Math.round(h.getBoundingClientRect().top) }));
});
console.log(JSON.stringify(rects, null, 0));
// also measure gap between last two right-col sections
const colInfo = await p.evaluate(() => {
  const cols = document.querySelectorAll('.col');
  return [...cols].map(c => ({ children: c.children.length, h: Math.round(c.getBoundingClientRect().height) }));
});
console.log('cols:', JSON.stringify(colInfo));
await b.close();
