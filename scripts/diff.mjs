// Pixel-diff two screenshot dirs. Usage: node diff.mjs <dirA> <dirB>
import { readdirSync, existsSync } from 'node:fs';
import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';
import pixelmatch from 'pixelmatch';

const A = process.argv[2];
const B = process.argv[3];

const names = readdirSync(A).filter((f) => f.endsWith('.png'));
let totalDiff = 0;
for (const name of names) {
	if (!existsSync(`${B}/${name}`)) {
		console.log(`${name}: MISSING in B`);
		continue;
	}
	const a = PNG.sync.read(readFileSync(`${A}/${name}`));
	const b = PNG.sync.read(readFileSync(`${B}/${name}`));
	if (a.width !== b.width || a.height !== b.height) {
		console.log(`${name}: SIZE DIFF ${a.width}x${a.height} vs ${b.width}x${b.height}`);
		totalDiff += 999999;
		continue;
	}
	const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
	const pct = ((diff / (a.width * a.height)) * 100).toFixed(3);
	totalDiff += diff;
	console.log(`${name}: ${diff} px (${pct}%)${diff > 0 ? '' : '  ✓'}`);
}
console.log(`TOTAL diff px: ${totalDiff}`);
