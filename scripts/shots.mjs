// Capture screenshots of all four screens for visual comparison.
// Usage: node shots.mjs <baseURL> <outPrefix>
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:5173/';
const prefix = process.argv[3] ?? 'shot';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);

for (const tab of ['Hub', 'Quests', 'Binder', 'Rules']) {
	try {
		await page.getByText(tab, { exact: true }).first().click({ timeout: 4000 });
	} catch {
		/* Hub is default; ignore if not clickable */
	}
	await page.waitForTimeout(700);
	await page.screenshot({ path: `scripts/${prefix}-${tab.toLowerCase()}.png`, fullPage: true });
	console.log(`captured ${prefix}-${tab.toLowerCase()}.png`);
}

await browser.close();
console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
