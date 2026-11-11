#!/usr/bin/env node
/** Bind a POC to an already selected product style without a fallback palette. */
import { createHash } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

const usage = 'Use --style-id <id> --design-md <task-local guide> --sha256 <content hash> --out <task directory>';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
const values = new Map();
for (let i = 0; i < args.length; i += 2) {
  if (!['--style-id', '--design-md', '--sha256', '--out'].includes(args[i]) || !args[i + 1]) throw new Error(usage);
  if (values.has(args[i])) throw new Error(`Duplicate argument: ${args[i]}`);
  values.set(args[i], args[i + 1]);
}
const id = values.get('--style-id');
const expected = values.get('--sha256');
if (!id?.trim() || !expected || !/^[0-9a-f]{64}$/i.test(expected) || !values.has('--out') || !values.has('--design-md')) throw new Error(usage);
const root = await realpath(resolve(values.get('--out')));
const guide = await realpath(resolve(values.get('--design-md')));
const guidePath = relative(root, guide);
if (!guidePath || guidePath === '..' || guidePath.startsWith(`..${sep}`) || isAbsolute(guidePath)) {
  throw new Error('The complete selected DESIGN must be inside the task directory');
}
const bytes = await readFile(guide);
if (!bytes.length) throw new Error('The selected DESIGN is empty');
const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== expected.toLowerCase()) throw new Error('The selected DESIGN does not match the runtime-provided content hash');
const context = { schemaVersion: 1, styleId: id, contentHash: hash, guidePath };
await writeFile(join(root, 'style-context.json'), JSON.stringify(context, null, 2) + '\n');
console.log(JSON.stringify({ ...context, confirmation: 'The runtime must verify the actual user selection during POC handoff.' }));
