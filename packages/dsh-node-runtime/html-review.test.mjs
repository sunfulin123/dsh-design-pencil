import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, states } from './html-review.test-helper.mjs';
import { exportHtmlReview, libraryRoot, sourcePaths } from '../html-prototype-review/tools/export.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

test('ordinary HTML review preparation is standalone, repeatable and preserves business source', async t => {
  const f = await fixture(t);
  const source = await readFile(join(f.root, 'index.html'), 'utf8');
  const result = f.run(['--states', states.join(',')]);
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.businessEntry, join(f.root, 'index.html'));
  assert.equal(output.entry, join(f.root, 'preview.html'));
  assert.equal(await readFile(output.businessEntry, 'utf8'), source);
  const html = await readFile(output.entry, 'utf8');
  assert.doesNotMatch(html, /feature.flag|@talkdesk|react/i);
  assert.ok(output.sourceFiles.includes(join(f.root, 'prototype-review/page.js')));
  assert.equal(f.run(['--states', 'success,error']).status, 0);
  const { collectEvidenceFiles } = await import('../../crates/op-ai-skills/skills/synapse-design-html/scripts/verify-source.mjs');
  for (const path of output.sourceFiles) assert.ok(collectEvidenceFiles(f.root, f.root).includes(path), 'Review sources stay fingerprinted with the business page');
  assert.notEqual(f.run(['--states', 'success,success']).status, 0);
  assert.notEqual(f.run(['--states', 'success,unknown']).status, 0);
  assert.notEqual(f.run(['--states', 'success,error', '--default-state', 'loading']).status, 0);
});
test('bundled helper and project runtime preserve the canonical library bytes', async t => {
  const f = await fixture(t);
  const skill = join(f.root, 'bundled-skill');
  const manifest = await exportHtmlReview(skill);
  for (const path of sourcePaths) {
    const canonical = await readFile(join(libraryRoot, path));
    assert.deepEqual(await readFile(join(skill, path)), canonical);
    assert.equal(manifest.files[path], createHash('sha256').update(canonical).digest('hex'));
  }
  const result = spawnSync(process.execPath, [join(skill, 'scripts/prepare-html-review.mjs'), '--entry', join(f.root, 'index.html')], {
    env: { ...process.env, SYNAPSE_DESIGN_TASK_DIR: f.root }, encoding: 'utf8', timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr);
  const copied = JSON.parse(await readFile(join(f.root, 'prototype-review/manifest.json'), 'utf8'));
  for (const [file, hash] of Object.entries(copied.files)) {
    const bytes = await readFile(join(f.root, 'prototype-review', file));
    assert.deepEqual(bytes, await readFile(join(libraryRoot, 'scripts/html-review', file)));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
  }
});
test('preparation rejects unrelated files, missing adapters, escapes and symbolic links', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'preview.html'), 'Authored preview');
  assert.notEqual(f.run().status, 0);
  assert.equal(await readFile(join(f.root, 'preview.html'), 'utf8'), 'Authored preview');
  assert.notEqual(f.run(['--out', join(f.root, '../outside.html')]).status, 0);
  await mkdir(join(f.root, 'prototype-review'));
  assert.notEqual(f.run(['--out', join(f.root, 'reviewed.html')]).status, 0);
  await writeFile(join(f.root, 'index.html'), '<!doctype html><h1>No adapter</h1>');
  const missing = f.run(['--out', join(f.root, 'plain.html')]);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Add <script/);
  await symlink(join(f.root, 'index.html'), join(f.root, 'linked.html'));
  assert.notEqual(f.run(['--out', join(f.root, 'linked.html')]).status, 0);
});
