import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:5194/rules', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0,0));
await p.waitForTimeout(300);
await p.screenshot({ path: process.argv[2] });
await b.close(); console.log('done');
