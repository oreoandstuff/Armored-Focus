import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
const src = PNG.sync.read(readFileSync(process.argv[2]));
const y0 = 880, h = 120;
const out = new PNG({ width: src.width, height: h });
for (let y = 0; y < h; y++)
  for (let x = 0; x < src.width; x++) {
    const si = ((y0+y)*src.width + x) << 2, di = (y*src.width + x) << 2;
    out.data[di]=src.data[si]; out.data[di+1]=src.data[si+1]; out.data[di+2]=src.data[si+2]; out.data[di+3]=src.data[si+3];
  }
writeFileSync(process.argv[3], PNG.sync.write(out));
