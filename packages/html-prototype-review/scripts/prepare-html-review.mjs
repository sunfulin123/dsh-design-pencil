#!/usr/bin/env node
/** Publish dependency-free review chrome beside an authored business HTML entry. */
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const usage = 'Use --entry <business.html> [--out <preview.html>] [--states success,loading,empty,error,partial,permission] [--default-state success]';
const allowedStates = ['success', 'loading', 'empty', 'error', 'partial', 'permission'];
const resourceRoot = fileURLToPath(new URL('./html-review/', import.meta.url));
const marker = '<!-- synapse-html-review:1 -->';

function options(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--entry', '--out', '--states', '--default-state'].includes(argv[i]) || !argv[i + 1] || result[argv[i]]) throw new Error(usage);
    result[argv[i]] = argv[i + 1];
  }
  if (!result['--entry']) throw new Error(usage);
  const states = (result['--states'] ?? 'success').split(',');
  const initial = result['--default-state'] ?? states[0];
  if (new Set(states).size !== states.length || states.some(state => !allowedStates.includes(state)) || !states.includes(initial)) throw new Error('Use unique supported states and a default present in --states');
  return { entry: resolve(result['--entry']), out: result['--out'] && resolve(result['--out']), states, initial };
}

function within(root, path) {
  const rel = relative(root, path);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error('Review files must stay inside the task directory');
  return rel;
}

async function noLinks(root, path) {
  let part = root;
  for (const name of within(root, path).split(sep).filter(Boolean)) {
    part = join(part, name);
    try {
      if ((await lstat(part)).isSymbolicLink()) throw new Error(`Refusing symbolic link: ${part}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

async function atomicWrite(path, text) {
  const temporary = path + '.' + randomUUID() + '.tmp';
  let created = false;
  try {
    await writeFile(temporary, text, { flag: 'wx' }); created = true;
    await rename(temporary, path);
  } finally { if (created) await rm(temporary, { force: true }); }
}

async function prepare(argv) {
  const opts = options(argv);
  const inputRoot = resolve(process.env.SYNAPSE_DESIGN_TASK_DIR ?? dirname(opts.entry));
  const root = await realpath(inputRoot);
  const entry = join(root, within(inputRoot, opts.entry));
  const out = opts.out ? join(root, within(inputRoot, opts.out)) : join(dirname(entry), 'preview.html');
  if (!/\.html?$/i.test(entry) || !/\.html?$/i.test(out) || entry === out || dirname(entry) !== dirname(out)) throw new Error('Use distinct business and preview HTML files in the same directory');
  await noLinks(root, entry);
  await noLinks(root, out);
  const html = await readFile(entry, 'utf8');
  if (!/<script\b[^>]*\bsrc=["']\.\/prototype-review\/page\.js["'][^>]*>\s*<\/script>/i.test(html)) {
    throw new Error('Add <script src="./prototype-review/page.js"></script> in the business <head> before its application scripts');
  }
  try {
    if (!(await readFile(out, 'utf8')).startsWith(marker)) throw new Error('Refusing to overwrite an authored preview file');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const assets = join(dirname(entry), 'prototype-review');
  await noLinks(root, assets);
  const files = ['review.js', 'review.css', 'chrome.css', 'page.js', 'manifest.json'];
  for (const file of files) await noLinks(root, join(assets, file));
  let existingAssets;
  try { existingAssets = await lstat(assets); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existingAssets) {
    if (!existingAssets.isDirectory()) throw new Error('Refusing an unowned prototype-review path');
    let manifest;
    try { manifest = await readFile(join(assets, 'manifest.json'), 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') throw new Error('Refusing an unowned prototype-review directory'); else throw error; }
    const existing = JSON.parse(manifest);
    if (existing.owner !== 'synapse-html-review' || existing.version !== 1) throw new Error('Refusing an unowned prototype-review directory');
  }
  const config = JSON.stringify({ version: 1, entry: './' + encodeURIComponent(basename(entry)), states: opts.states, defaultState: opts.initial }).replaceAll('<', '\\u003c');
  const template = await readFile(join(resourceRoot, 'review.html'), 'utf8');
  const hashes = {};
  await mkdir(assets, { recursive: true });
  for (const file of files.slice(0, -1)) {
    const text = await readFile(join(resourceRoot, file), 'utf8');
    await atomicWrite(join(assets, file), text);
    hashes[file] = createHash('sha256').update(text).digest('hex');
    if (createHash('sha256').update(await readFile(join(assets, file))).digest('hex') !== hashes[file]) throw new Error(`Review source copy mismatch: ${file}`);
  }
  await atomicWrite(join(assets, 'manifest.json'), JSON.stringify({ owner: 'synapse-html-review', version: 1, templateSha256: createHash('sha256').update(template).digest('hex'), files: hashes }, null, 2) + '\n');
  await atomicWrite(out, template.replace('@@CONFIG@@', config));
  console.log(JSON.stringify({ entry: out, businessEntry: entry, states: opts.states, defaultState: opts.initial, sourceFiles: [entry, out, ...files.map(file => join(assets, file))] }));
}

if (process.argv.includes('--help')) console.log(usage);
else await prepare(process.argv.slice(2));
