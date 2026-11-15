/** Export the canonical code library without rewriting its executable/template bytes. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const libraryRoot = fileURLToPath(new URL('../', import.meta.url));
export const sourcePaths = [
  'scripts/prepare-html-review.mjs',
  ...['review.html', 'review.js', 'review.css', 'page.js'].map(name => `scripts/html-review/${name}`),
];

/** skillRoot must be a maintainer-owned build/staging directory, never an authored project. */
export async function exportHtmlReview(skillRoot) {
  const files = {};
  for (const path of sourcePaths) {
    const bytes = await readFile(join(libraryRoot, path));
    files[path] = createHash('sha256').update(bytes).digest('hex');
    await mkdir(dirname(join(skillRoot, path)), { recursive: true });
    await writeFile(join(skillRoot, path), bytes);
  }
  const manifest = { owner: 'synapse-html-review', schemaVersion: 1, files };
  await writeFile(join(skillRoot, 'scripts/html-review/library.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Pass the HTML Skill build directory');
  console.log(JSON.stringify(await exportHtmlReview(resolve(process.argv[2]))));
}
