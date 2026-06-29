// Headless render check: loads the app, captures console/page errors, and
// confirms the UI actually rendered (not a white screen).
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:8788/';
const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => {
	if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => pageErrors.push(e.message));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500); // let client hydrate/render

const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
const hasTabs = /Hub/.test(bodyText) && /Binder/.test(bodyText);
const visibleChars = bodyText.trim().length;

await page.screenshot({ path: 'scripts/smoke.png', fullPage: true });

console.log('URL:', URL);
console.log('visible text chars:', visibleChars);
console.log('rendered tab bar (Hub+Binder):', hasTabs);
console.log('snippet:', JSON.stringify(bodyText.slice(0, 200)));
console.log('pageErrors:', pageErrors.length ? pageErrors : 'none');
console.log('consoleErrors:', consoleErrors.length ? consoleErrors.slice(0, 8) : 'none');

await browser.close();

const ok = hasTabs && visibleChars > 30 && pageErrors.length === 0;
console.log(ok ? 'RESULT: RENDER_OK' : 'RESULT: RENDER_FAILED');
process.exit(ok ? 0 : 1);
