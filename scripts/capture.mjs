// Capture a fixed set of UI states for visual-regression diffing.
// Usage: node capture.mjs <baseURL> <outDir>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5190';
const OUT = process.argv[3] ?? '/tmp/shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

async function shot(name) {
	await page.waitForTimeout(500);
	await page.screenshot({ path: `${OUT}/${name}.png` });
	console.log('shot', name);
}
async function go(path) {
	await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(900);
}
async function click(text, exact = false) {
	await page.getByText(text, { exact }).first().click();
	await page.waitForTimeout(700);
}

// Static screens
for (const v of ['hub', 'quests', 'binder', 'rules']) {
	await go(`/${v}`);
	await shot(v);
}

// Modals — fresh navigation before each so the previous one is closed.
await go('/hub');
await click('Draw New Card');
await shot('modal-draw');

await go('/hub');
await click('Start Standalone Quest');
await shot('modal-standalone');

await go('/binder');
await click('Add Booster Pack');
await shot('modal-booster');

await go('/rules');
await click('Edit Table');
await shot('modal-leveltable');

// Card states
await go('/binder');
try {
	await page.getByText('Test Client').first().click({ timeout: 3000 });
	await page.waitForTimeout(800);
	await shot('card-expanded');
} catch {
	console.log('no card to expand');
}

await browser.close();
console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
