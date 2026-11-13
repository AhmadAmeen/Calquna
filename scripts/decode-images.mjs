// Images are stored in the repo as base64 text (img-src/*.b64) because the
// push tooling carries text only. This step turns them back into real image
// files under public/img/ before Astro builds, so the deployed site serves
// ordinary WebP/PNG files.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const srcDir = new URL('../img-src/', import.meta.url).pathname;
const outDir = new URL('../public/img/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const name of readdirSync(srcDir)) {
  if (!name.endsWith('.b64')) continue;
  const target = name.slice(0, -4);
  writeFileSync(outDir + target, Buffer.from(readFileSync(srcDir + name, 'utf8').trim(), 'base64'));
  count++;
}
console.log(`decoded ${count} images into public/img/`);
