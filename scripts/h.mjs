import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:5196/hub', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
await p.screenshot({ path: process.argv[2] });
await b.close();
