import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5195/binder', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
await p.screenshot({ path: process.argv[2] + '/binder.png' });
await p.getByText('Test Client').first().click();
await p.waitForTimeout(900);
await p.screenshot({ path: process.argv[2] + '/card-expanded.png', fullPage: true });
// edit mode
try { await p.locator('[aria-label*="Edit" i], .icon-btn').first().click({ timeout: 2000 }); } catch {}
await p.waitForTimeout(700);
await p.screenshot({ path: process.argv[2] + '/card-edit.png', fullPage: true });
await b.close();
console.log('errors:', errs.length?errs.slice(0,4):'none');
