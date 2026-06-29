// Draw a card, screenshot the Draw modal, then expand the card and screenshot it.
import { chromium } from 'playwright';

const URL = process.argv[2];
const prefix = process.argv[3] ?? 'card';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);

// Open Draw New Card modal
await page.getByText('Draw New Card').first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `scripts/${prefix}-drawmodal.png` });
console.log('captured draw modal');

// Fill the first text input (Name) inside the dialog and submit
const inputs = page.locator('input[type="text"], input:not([type])');
await inputs.first().fill('Test Client');
await page.waitForTimeout(200);
await page.getByText(/Add to Binder/i).first().click();
await page.waitForTimeout(1000);

// Go to Binder and expand the card
await page.getByText('Binder', { exact: true }).first().click();
await page.waitForTimeout(800);
await page.getByText('Test Client').first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: `scripts/${prefix}-card.png`, fullPage: true });
console.log('captured expanded card');

await browser.close();
console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
