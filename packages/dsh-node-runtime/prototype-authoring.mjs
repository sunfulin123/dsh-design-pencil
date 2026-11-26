/** Task-local canonical authoring; installation owns only its bounded child and project. */
import { createHash } from 'node:crypto';
import { lstat, readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, dirname, parse, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPrototypeProcess as child } from './prototype-process.mjs';
const runtime = fileURLToPath(new URL('.', import.meta.url));
const toolkit = existsSync(join(runtime, '../talkdesk-cobalt/tools/cobalt-project.mjs'))
  ? resolve(runtime, '../talkdesk-cobalt/tools')
  : join(runtime, 'skills/synapse-design-html/scripts');
const canonical = (path) =>
  process.platform === 'darwin'
    ? resolve(path).replace(/^\/(var|tmp)(?=\/|$)/, '/private/$1')
    : resolve(path);
const configFiles = (mode) => [
  'package.json',
  'pnpm-workspace.yaml',
  '.npmrc',
  'vite.config.ts',
  'tsconfig.json',
  'tools/inspect-business-source.mjs',
  ...(mode === 'workspace'
    ? ['tools/verify-workspace-shell.mjs', 'cobalt-source.json']
    : [
        'index.html',
        'business.html',
        'src/main.tsx',
        'src/prototype-runtime/theme.ts',
        'src/prototype-runtime/base.css',
        'src/prototype-runtime/scenarios.tsx',
        'public/prototype-review/review.js',
        'public/prototype-review/review.css',
        'public/prototype-review/chrome.css',
        'public/prototype-review/page.js',
      ]),
];
const hash = (text) => createHash('sha256').update(text).digest('hex');
async function noLinks(path) {
  path = canonical(path);
  let current = parse(path).root;
  for (const part of relative(current, path).split('/').filter(Boolean)) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error('Authoring paths cannot be symlinks');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}
function style(styleId) {
  if (styleId !== 'talkdesk-cobalt') throw new Error('Unsupported prototype authoring style');
}

async function verify(project) {
  await noLinks(project);
  const { verifyWorkspaceShell } = await import(
    pathToFileURL(join(toolkit, 'verify-workspace-shell.mjs'))
  );
  return verifyWorkspaceShell(project);
}
async function binding(project) {
  project = canonical(project);
  await noLinks(project);
  await noLinks(join(dirname(project), 'DESIGN.md'));
  await noLinks(join(dirname(project), 'prototype-authoring.json'));
  const record = JSON.parse(
    await readFile(join(dirname(project), 'prototype-authoring.json'), 'utf8'),
  );
  if (
    record.version !== 1 ||
    !['workspace', 'standalone'].includes(record.mode) ||
    record.styleId !== 'talkdesk-cobalt' ||
    record.project !== project ||
    record.designHash !== hash(await readFile(join(dirname(project), 'DESIGN.md')))
  )
    throw new Error('Prototype binding or DESIGN hash changed');
  const keys = configFiles(record.mode);
  if (
    !record.configHashes ||
    JSON.stringify(Object.keys(record.configHashes).sort()) !== JSON.stringify(keys.sort())
  )
    throw new Error('Invalid authoring binding keys');
  if (record.mode === 'workspace') await verify(project);
  for (const [name, expected] of Object.entries(record.configHashes || {})) {
    await noLinks(join(project, name));
    if (hash(await readFile(join(project, name))) !== expected)
      throw new Error('Prototype build/dependency configuration changed: ' + name);
  }

  if (
    hash(await readFile(join(project, 'tools/inspect-business-source.mjs'))) !==
    hash(await readFile(join(toolkit, 'inspect-business-source.mjs')))
  )
    throw new Error('Canonical business inspector changed');
  return record;
}
export async function preparePrototype({
  taskRoot,
  styleId,
  markdown,
  screens,
  signal,
  mode = 'workspace',
}) {
  style(styleId);
  if (!['workspace', 'standalone'].includes(mode)) throw new Error('Unsupported prototype mode');
  signal?.throwIfAborted();
  if (typeof markdown !== 'string' || !markdown.trim())
    throw new Error('Canonical DESIGN markdown is required');
  taskRoot = canonical(taskRoot);
  await noLinks(taskRoot);
  await mkdir(taskRoot, { recursive: true });
  const lock = join(taskRoot, '.prototype-authoring.lock');
  await writeFile(lock, 'locked', { flag: 'wx' });
  try {
    const project = join(taskRoot, 'project'),
      designMd = join(taskRoot, 'DESIGN.md'),
      designHash = hash(markdown);
    let status = 'created';
    await noLinks(designMd);
    await noLinks(join(taskRoot, 'prototype-authoring.json'));
    if (existsSync(designMd) && hash(await readFile(designMd)) !== designHash)
      throw new Error('Canonical DESIGN binding differs; refusing overwrite');
    if (existsSync(project)) {
      if (mode === 'workspace') await verify(project);
      status = 'reused';
      if (existsSync(join(taskRoot, 'prototype-authoring.json'))) {
        const existing = await binding(project);
        if (existing.mode !== mode) throw new Error('Existing prototype mode differs');
      } else
        throw new Error(
          'Unbound existing prototype requires explicit migration; authored pages were not modified',
        );
    } else {
      if (!Array.isArray(screens) || screens.length < 1 || screens.length > 32)
        throw new Error('Provide1–32 planned screens');
      const pages = screens.map((screen, index) => ({
        id:
          screen?.id && /^[a-z][a-z0-9-]{0,63}$/.test(screen.id)
            ? screen.id
            : `screen-${index + 1}`,
        title:
          typeof screen === 'string'
            ? screen
            : String(screen.name || screen.title || `Screen ${index + 1}`),
      }));
      const spec = join(taskRoot, '.prototype-apps.json');
      await writeFile(
        spec,
        JSON.stringify({
          apps: [{ id: 'prototype', title: 'Prototype', iconName: 'home', pages }],
        }),
        { flag: 'wx' },
      );
      try {
        if (mode === 'standalone') {
          const { createStandalone } = await import('./prototype-standalone.mjs');
          await createStandalone({ project, pages, toolkit, signal });
        } else {
          const result = await child(
            process.execPath,
            [join(toolkit, 'cobalt-project.mjs'), 'create', '--out', project, '--spec', spec],
            taskRoot,
            signal,
          );
          if (result.code !== 0)
            throw new Error('Canonical Workspace creation failed: ' + result.output);
        }
      } finally {
        await unlink(spec).catch(() => {});
      }
    }
    if (!existsSync(designMd)) await writeFile(designMd, markdown, { flag: 'wx' });
    const marker = join(taskRoot, 'prototype-authoring.json');
    const configHashes = {};
    for (const name of configFiles(mode)) {
      await noLinks(join(project, name));
      configHashes[name] = hash(await readFile(join(project, name)));
    }
    if (
      hash(await readFile(join(project, 'tools/inspect-business-source.mjs'))) !==
      hash(await readFile(join(toolkit, 'inspect-business-source.mjs')))
    )
      throw new Error('Business inspector integrity mismatch');
    const record = { version: 1, mode, styleId, project, designHash, configHashes };
    if (existsSync(marker)) {
      const prior = JSON.parse(await readFile(marker, 'utf8'));
      if (JSON.stringify(prior) !== JSON.stringify(record))
        throw new Error('Existing prototype binding differs');
    } else await writeFile(marker, JSON.stringify(record), { flag: 'wx' });
    return { status, project, designMd, designHash };
  } finally {
    await unlink(lock);
  }
}
export async function inspectPrototype({ taskRoot, styleId, signal, mode = 'workspace' }) {
  style(styleId);
  signal?.throwIfAborted();
  const project = join(canonical(taskRoot), 'project');
  try {
    const bound = await binding(project);
    if (bound.mode !== mode) throw new Error('Prototype mode binding differs');
    const { inspectBusinessSources } = await import(
      pathToFileURL(join(toolkit, 'inspect-business-source.mjs'))
    );
    return { project, ...(await inspectBusinessSources(project)) };
  } catch (error) {
    return {
      status: 'fail',
      project,
      findings: [{ code: 'prototype-integrity', message: error.message }],
    };
  }
}
export async function installPrototype({ project, signal }) {
  await binding(project);
  await noLinks(join(project, 'node_modules'));
  try {
    const result = await child('pnpm', ['install'], project, signal, 180000);
    return {
      status: result.code === 0 ? 'installed' : 'failed',
      project,
      message:
        result.code === 0
          ? undefined
          : `pnpm install exited with code ${result.code}: ${result.output
              .replace(/(?:Bearer\s+|_authToken[=:]\s*)[^\s]+/gi, '[redacted]')
              .replace(/https?:\/\/[^\s)]+/g, '[registry URL]')
              .slice(-1200)}`,
    };
  } catch (error) {
    signal?.throwIfAborted();
    return {
      status: 'failed',
      project,
      message: error.code === 'ENOENT' ? 'pnpm is unavailable' : error.message,
    };
  }
}
export const PROTOTYPE_TOOL_TEXT = {
  description:
    'Prepare, install or inspect the task-owned canonical Cobalt Workspace prototype. Preparation is not completed business UI. ' +
    'Install dependencies only with action "install"; never run pnpm, npm or yarn install/add/i in a shell, which leaves a .pnpm-store/ directory that check and handoff refuse.',
  parameters: {
    action: 'prepare, install or check; retain the same task-owned project.',
    taskId: 'The confirmed HTML task identifier.',
  },
};
export const PROTOTYPE_NOTE = {
  prepared:
    'Canonical Cobalt prototype prepared. Author the planned business pages using the local pinned documentation and recipes.',
  inspectFailed:
    'Prototype inspection found unresolved source or integrity findings. Correct them before handoff.',
  installFailed:
    'Dependency installation did not complete. Retain the project and report the actual blocker.',
  next: 'Read the task DESIGN.md and local component/recipe sources, author real business UI, inspect, then run scoped build and browser checks. Start the development server through owned process tools; Preview configuration is not a prerequisite.',
};
