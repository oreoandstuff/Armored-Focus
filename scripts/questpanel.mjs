import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5195/binder', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
await p.getByText('Test Client').first().click();
await p.waitForTimeout(700);
// click "Start Quest" in the quest panel
await p.getByText('Start Quest', { exact: true }).first().click();
await p.waitForTimeout(600);
// Begin the quest (modal) — default type is fine for a card quest
await p.getByText('Begin Quest').first().click();
await p.waitForTimeout(800);
await p.screenshot({ path: process.argv[2] + '/card-questpanel.png', fullPage: true });
await b.close();
console.log('errors:', errs.length?errs.slice(0,4):'none');
