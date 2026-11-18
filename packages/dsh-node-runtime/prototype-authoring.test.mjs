import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { preparePrototype, inspectPrototype } from './prototype-authoring.mjs';
test('canonical preparation is idempotent without overwriting authored pages or DESIGN', async (t) => {
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-authoring-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const args = {
    taskRoot,
    styleId: 'talkdesk-cobalt',
    markdown: '# Approved design\n',
    screens: [{ name: 'Operations' }],
  };
  const first = await preparePrototype(args);
  assert.equal(first.status, 'created');
  const page = join(first.project, 'src/apps/prototype/pages/screen-1.tsx');
  await writeFile(page, 'export default function Page(){return <main>Authored content</main>}');
  assert.equal((await preparePrototype(args)).status, 'reused');
  assert.match(await readFile(page, 'utf8'), /Authored content/);
  await assert.rejects(preparePrototype({ ...args, markdown: 'changed' }), /DESIGN|binding/);
  assert.equal(await readFile(first.designMd, 'utf8'), args.markdown);
});
test('untouched scaffold cannot pass authoring inspection', async (t) => {
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-inspect-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  await preparePrototype({
    taskRoot,
    styleId: 'talkdesk-cobalt',
    markdown: '# Draft',
    screens: ['Overview'],
  });
  const inspected = await inspectPrototype({ taskRoot, styleId: 'talkdesk-cobalt' });
  assert.equal(inspected.status, 'fail');
  assert.ok(inspected.findings.some((f) => f.code === 'scaffold-placeholder'));
});

test('standalone has ordinary controls, route registry and no Workspace; mode is bound', async (t) => {
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-standalone-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const args = {
    taskRoot,
    styleId: 'talkdesk-cobalt',
    markdown: '# Standalone',
    screens: ['Overview'],
    mode: 'standalone',
  };
  const result = await preparePrototype(args);
  assert.match(
    await readFile(join(result.project, 'index.html'), 'utf8'),
    /prototype-size-trigger/,
  );
  const { existsSync } = await import('node:fs');
  assert.equal(existsSync(join(result.project, 'src/workspace-shell')), false);
  assert.match(await readFile(join(result.project, 'src/main.tsx'), 'utf8'), /ThemeProvider/);
  assert.equal((await preparePrototype(args)).status, 'reused');
  await assert.rejects(preparePrototype({ ...args, mode: 'workspace' }));
});
test('configuration weakening and forged path keys fail before inspection', async (t) => {
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-config-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const args = {
    taskRoot,
    styleId: 'talkdesk-cobalt',
    markdown: '# Config',
    screens: ['Overview'],
  };
  const result = await preparePrototype(args);
  const config = join(result.project, 'vite.config.ts'),
    before = await readFile(config);
  await writeFile(config, 'export default {}');
  assert.equal((await inspectPrototype(args)).status, 'fail');
  await writeFile(config, before);
  const path = join(taskRoot, 'prototype-authoring.json'),
    record = JSON.parse(await readFile(path));
  record.configHashes['../outside'] = 'a'.repeat(64);
  await writeFile(path, JSON.stringify(record));
  assert.match((await inspectPrototype(args)).findings[0].message, /binding keys/);
});
test('source parser sees actual reachable UI rather than imports', async (t) => {
  const { cp, mkdir, realpath } = await import('node:fs/promises');
  const { createRequire } = await import('node:module');
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-ast-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const args = { taskRoot, styleId: 'talkdesk-cobalt', markdown: '# AST', screens: ['Overview'] },
    result = await preparePrototype(args),
    page = join(result.project, 'src/apps/prototype/pages/screen-1.tsx');
  await writeFile(
    page,
    "import{Heading}from'@talkdesk/cobalt-react-typography';export default()=> <Heading level={1}>Hello</Heading>",
  );
  assert.equal((await inspectPrototype(args)).status, 'unavailable');
  await mkdir(join(result.project, 'node_modules'), { recursive: true });
  const require = createRequire(new URL('../package.json', import.meta.url));
  const parser = await realpath(require.resolve('typescript/package.json'));
  await cp(
    parser.slice(0, -'/package.json'.length),
    join(result.project, 'node_modules/typescript'),
    { recursive: true },
  );
  // This is module-resolution metadata, not a component implementation or rendering double.
  const typography = join(result.project, 'node_modules/@talkdesk/cobalt-react-typography');
  await mkdir(typography, { recursive: true });
  await writeFile(
    join(typography, 'package.json'),
    JSON.stringify({
      name: '@talkdesk/cobalt-react-typography',
      version: '0.0.0-fixture',
      types: 'index.d.ts',
    }),
  );
  await writeFile(
    join(typography, 'index.d.ts'),
    'export declare function Heading(props: unknown): unknown;\n',
  );
  assert.equal((await inspectPrototype(args)).status, 'pass');
  await writeFile(
    join(result.project, 'src/apps/prototype/pages/page.css'),
    'main { display: grid }',
  );
  await writeFile(
    page,
    "import './page.css';import{Heading}from'@talkdesk/cobalt-react-typography';export default()=> <main><Heading>Hello</Heading></main>",
  );
  assert.equal((await inspectPrototype(args)).status, 'pass');
  for (const code of [
    "import{Heading}from'@talkdesk/cobalt-react-typography';function Unused(){return <Heading>X</Heading>}export default()=> <main>Only layout</main>",
    "import{Heading}from'@talkdesk/cobalt-react-typography';export default()=> <span className='tag'><Heading>X</Heading></span>",
    "import{Heading}from'@talkdesk/cobalt-react-typography';export default()=> <input/>",
    "import{createElement as make}from'react';export default()=>make('button',{},'Go')",
    "import{Heading}from'@talkdesk/cobalt-react-typography';export default()=> <div className='badge'><Heading>X</Heading></div>",
    "import{Heading}from'@talkdesk/cobalt-react-typography';export default()=> <Heading dangerouslySetInnerHTML={{__html:'<button>Go</button>'}}/>",
  ]) {
    await writeFile(page, code);
    assert.equal((await inspectPrototype(args)).status, 'fail', code);
  }
  await writeFile(page, "export {default}from './nested'");
  await writeFile(
    join(result.project, 'src/apps/prototype/pages/nested.tsx'),
    'export default()=> <textarea/>',
  );
  assert.equal((await inspectPrototype(args)).status, 'fail');
});
test('owned subprocess timeout and cancellation terminate child groups', async () => {
  const { runPrototypeProcess } = await import('./prototype-process.mjs');
  await assert.rejects(
    runPrototypeProcess(
      process.execPath,
      ['-e', 'setInterval(()=>{},1000)'],
      process.cwd(),
      undefined,
      30,
    ),
    /time budget/,
  );
  const abort = new AbortController(),
    promise = runPrototypeProcess(
      process.execPath,
      ['-e', 'setInterval(()=>{},1000)'],
      process.cwd(),
      abort.signal,
    );
  abort.abort();
  await assert.rejects(promise);
});

test('pnpm installs in the prepared project, reports redacted failures and can retry', async (t) => {
  const { mkdir } = await import('node:fs/promises');
  const { installPrototype } = await import('./prototype-authoring.mjs');
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-install-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const result = await preparePrototype({
    taskRoot,
    styleId: 'talkdesk-cobalt',
    markdown: '# Install',
    screens: ['Overview'],
  });
  const bin = join(taskRoot, 'bin');
  await mkdir(bin);
  const retryMarker = join(taskRoot, 'first-attempt');
  await writeFile(
    join(bin, 'pnpm'),
    `#!${process.execPath}
const fs = require('node:fs');
if (process.cwd() !== ${JSON.stringify(result.project)} ||
    JSON.stringify(process.argv.slice(2)) !== '["install"]' ||
    !fs.existsSync('.npmrc')) process.exit(2);
const marker = ${JSON.stringify(retryMarker)};
if (!fs.existsSync(marker)) {
  fs.writeFileSync(marker, '');
  console.error('ERR_PNPM_FETCH_401 _authToken=private-secret https://user:password@example.test/');
  process.exitCode = 1;
}
`,
    { mode: 0o755 },
  );
  const path = process.env.PATH;
  process.env.PATH = bin + ':' + path;
  t.after(() => { process.env.PATH = path; });
  const failed = await installPrototype({ project: result.project });
  assert.equal(failed.status, 'failed');
  assert.match(failed.message, /ERR_PNPM_FETCH_401/);
  assert.doesNotMatch(failed.message, /private-secret|password|example\.test/);
  const retried = await installPrototype({ project: result.project });
  assert.equal(retried.status, 'installed');
  assert.equal(retried.project, failed.project);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    installPrototype({ project: result.project, signal: controller.signal }),
    { name: 'AbortError' },
  );
});

test('business parent symlinks cannot escape the owned project', async (t) => {
  const { symlink, rename } = await import('node:fs/promises');
  const taskRoot = await mkdtemp(join(tmpdir(), 'prototype-links-'));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const args = { taskRoot, styleId: 'talkdesk-cobalt', markdown: '# Links', screens: ['Overview'] },
    result = await preparePrototype(args);
  const pages = join(result.project, 'src/apps/prototype/pages'),
    outside = join(taskRoot, 'external-pages');
  await rename(pages, outside);
  await symlink(outside, pages, 'dir');
  assert.equal((await inspectPrototype(args)).status, 'fail');
});
