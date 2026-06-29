import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:5194/rules', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
const data = await p.evaluate(() => {
  const secs = [...document.querySelectorAll('.section')];
  return secs.map(s => { const r = s.getBoundingClientRect(); const cs = getComputedStyle(s);
    return { h: Math.round(r.height), mt: cs.marginTop, mb: cs.marginBottom }; });
});
console.log(JSON.stringify(data));
await b.close();
