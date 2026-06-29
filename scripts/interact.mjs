// Interaction smoke: click through tabs and open a modal, watching for errors.
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'https://svelte-cloudflare-rewrite.armored-focus.pages.dev/';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

async function step(label, fn) {
	const before = errors.length;
	await fn();
	await page.waitForTimeout(700);
	console.log(`${label}: ${errors.length === before ? 'ok' : 'ERRORS'}`);
}

for (const tab of ['Binder', 'Quests', 'Rules', 'Hub']) {
	await step(`tab ${tab}`, () => page.getByText(tab, { exact: true }).first().click());
}
await step('open Draw New Card', () => page.getByText('Draw New Card').first().click());
const modalText = await page.locator('body').innerText();
const modalOpened = /Card Type|Draw|Name/i.test(modalText);
console.log('draw modal visible:', modalOpened);
await page.screenshot({ path: 'scripts/interact.png', fullPage: true });

await browser.close();
console.log('total errors:', errors.length ? errors.slice(0, 6) : 'none');
console.log(errors.length === 0 ? 'RESULT: INTERACT_OK' : 'RESULT: INTERACT_FAILED');
process.exit(errors.length === 0 ? 0 : 1);
