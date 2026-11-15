#!/usr/bin/env node
import { existsSync } from 'node:fs';
/** Copy the pinned Workspace shell and author app scaffolds without touching upstream or existing pages. */
import { createHash } from 'node:crypto';
import {
  lstat,
  readFile,
  readdir,
  mkdir,
  mkdtemp,
  writeFile,
  rename,
  rm,
  open,
} from 'node:fs/promises';
import { dirname, join, resolve, parse, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyWorkspaceShell } from './verify-workspace-shell.mjs';
import {
  copyComponentSources,
  sourceDestination,
  writeSourceResources,
} from './cobalt-source-templates.mjs';
import { adaptShell } from './cobalt-shell-adapter.mjs';

// Resolve the canonical module and the backward-compatible exported Skill layout.
const moduleRoot = fileURLToPath(new URL('../', import.meta.url));
const template = join(
  moduleRoot,
  existsSync(join(moduleRoot, 'templates/source.json')) ? 'templates' : 'templates/cobalt',
);
const library = existsSync(join(moduleRoot, 'components/extensions/src/index.ts'))
  ? moduleRoot
  : join(moduleRoot, 'cobalt-reference');
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const menuSource = await readFile(
  join(template, 'vendor/workspace-shell/data/menu.generated.ts'),
  'utf8',
);
const menuJson = menuSource.match(
  /export const DEFAULT_DOCK_APPS: DockApp\[\] = (\[[\s\S]*?\n\]);/,
);
if (!menuJson) throw new Error('Canonical Workspace menu format changed');
const builtinIds = new Set(JSON.parse(menuJson[1]).map((app) => app.id));
const reviewChrome = existsSync(
  join(moduleRoot, '../html-prototype-review/scripts/html-review/chrome.css'),
)
  ? join(moduleRoot, '../html-prototype-review/scripts/html-review/chrome.css')
  : join(moduleRoot, 'scripts/html-review/chrome.css');

function validate(spec) {
  if (!Array.isArray(spec?.apps) || !spec.apps.length || spec.apps.length > 32)
    throw new Error('Provide 1–32 apps');
  const ids = new Set();
  for (const app of spec.apps) {
    if (!idPattern.test(app.id) || ids.has(app.id))
      throw new Error('App ids must be unique lowercase slugs');
    ids.add(app.id);
    if (typeof app.title !== 'string' || !app.title.trim() || app.title.length > 120)
      throw new Error('Each app needs a title');
    if (
      !builtinIds.has(app.id) &&
      (typeof app.iconName !== 'string' || !/^[a-z0-9_]{1,100}$/.test(app.iconName))
    )
      throw new Error('Each app needs a Cobalt iconName');
    if (!Array.isArray(app.pages) || !app.pages.length || app.pages.length > 32)
      throw new Error('Provide 1–32 pages per app');
    const pages = new Set();
    for (const page of app.pages) {
      if (!idPattern.test(page.id) || pages.has(page.id))
        throw new Error('Page ids must be unique lowercase slugs per app');
      pages.add(page.id);
      if (typeof page.title !== 'string' || !page.title.trim() || page.title.length > 120)
        throw new Error('Each page needs a title');
    }
  }
  return {
    apps: spec.apps.map((app) => ({
      id: app.id,
      title: app.title,
      ...(!builtinIds.has(app.id) ? { iconName: app.iconName } : {}),
      pages: app.pages.map((page) => ({ id: page.id, title: page.title })),
    })),
  };
}

async function assertNoLinks(path) {
  const absolute = resolve(path);
  let current = parse(absolute).root;
  for (const part of relative(current, absolute).split('/').filter(Boolean)) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing symbolic link: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

async function put(root, path, content) {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, { flag: 'wx' });
}

function pageSource(page) {
  return `import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { usePrototypeScenario } from '../../../prototype-runtime/scenarios';

/** Replace this scaffold with the business page using documented Cobalt components. */
export default function Page() {
  const scenario = usePrototypeScenario();
  return <section style={{ padding: 24, minWidth: 0 }} data-testid=${JSON.stringify('page-' + page.id)}>
    <Heading level={1}>{${JSON.stringify(page.title)}}</Heading>
    <Text>Cobalt business page scaffold — {scenario}. Replace with the planned content and interactions.</Text>
  </section>;
}
`;
}

async function writeApps(root, apps) {
  for (const app of apps)
    for (const page of app.pages) {
      await put(root, `src/apps/${app.id}/pages/${page.id}.tsx`, pageSource(page));
    }
}

async function createProject(out, spec) {
  await assertNoLinks(out);
  // A new project is published with one rename; existing files are never replaced.
  try {
    await lstat(out);
    throw new Error('Destination already exists; use add for an existing prototype');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const manifest = JSON.parse(await readFile(join(template, 'source.json'), 'utf8'));
  const shell = new Map();
  for (const [path, hash] of Object.entries(manifest.files)) {
    const bytes = await readFile(join(template, 'vendor/workspace-shell', path));
    if (createHash('sha256').update(bytes).digest('hex') !== hash)
      throw new Error(`Shell snapshot checksum mismatch: ${path}`);
    shell.set(path, bytes.toString('utf8'));
  }
  const chrome = new Map();
  const chromeHashes = {};
  for (const name of [
    'space.ts',
    'title-bar.tsx',
    'workspace-chrome.css',
    'status-pill.tsx',
    'profile-menu.tsx',
    'notifications.tsx',
  ]) {
    const content = await readFile(join(template, 'chrome', name), 'utf8');
    chrome.set(name, content);
    chromeHashes[name] = createHash('sha256').update(content).digest('hex');
  }
  const atlasChrome = JSON.parse(await readFile(join(template, 'chrome/source.json'), 'utf8'));
  for (const [path, hash] of Object.entries(atlasChrome.primitives)) {
    const content = await readFile(join(template, 'vendor/atlas-titlebar', path), 'utf8');
    if (createHash('sha256').update(content).digest('hex') !== hash)
      throw new Error(`Atlas primitive snapshot checksum mismatch: ${path}`);
    shell.set(path, content);
  }
  shell.set(
    'helpers/class.name.formatter.d.ts',
    await readFile(join(template, 'chrome/class-name-formatter.d.ts'), 'utf8'),
  );
  adaptShell(shell, chrome);
  const dependencies = JSON.parse(await readFile(join(template, 'dependencies.json'), 'utf8'));
  await mkdir(dirname(out), { recursive: true });
  const stage = await mkdtemp(join(dirname(out), '.cobalt-project-'));
  try {
    for (const [path, content] of shell) await put(stage, `src/workspace-shell/${path}`, content);
    for (const name of await readdir(join(template, 'project'))) {
      // Runtime templates are a small, explicit flat set, independent from upstream files.
      const paths = {
        'main.tsx': 'src/main.tsx',
        'dock-registry.ts': 'src/prototype-runtime/dock-registry.ts',
        'apps.ts': 'src/prototype-runtime/apps.ts',
        'app.tsx': 'src/prototype-runtime/app.tsx',
        'scenarios.tsx': 'src/prototype-runtime/scenarios.tsx',
        'review-toolbar.tsx': 'src/prototype-runtime/review-toolbar.tsx',
        'review-toolbar.css': 'src/prototype-runtime/review-toolbar.css',
        'review-dropdown.tsx': 'src/prototype-runtime/review-dropdown.tsx',
      };
      await put(stage, paths[name] ?? name, await readFile(join(template, 'project', name)));
    }
    await put(stage, 'src/prototype-runtime/review-chrome.css', await readFile(reviewChrome));
    await put(
      stage,
      'tools/verify-workspace-shell.mjs',
      await readFile(new URL('./verify-workspace-shell.mjs', import.meta.url)),
    );
    await writeSourceResources(library, stage);
    const sourceDependencies = JSON.parse(
      await readFile(join(library, 'components/extensions/dependencies.json'), 'utf8'),
    );
    await writeApps(stage, spec.apps);
    await put(stage, 'talkdesk-prototype.json', json({ schemaVersion: 1, ...spec }));
    const protectedFiles = {};
    async function fingerprint(path) {
      const target = join(stage, path);
      if ((await lstat(target)).isDirectory()) {
        for (const name of (await readdir(target)).sort()) await fingerprint(`${path}/${name}`);
      } else
        protectedFiles[path] = createHash('sha256')
          .update(await readFile(target))
          .digest('hex');
    }
    for (const path of [
      'src/main.tsx',
      'src/workspace-shell',
      'src/prototype-runtime',
      'tools/verify-workspace-shell.mjs',
    ])
      await fingerprint(path);
    await put(
      stage,
      'cobalt-source.json',
      json({
        ...manifest,
        adapterVersion: 7,
        protectedFiles,
        atlasChrome: { ...atlasChrome, templates: chromeHashes },
        adaptedFiles: [
          'config.ts',
          'shell/state.ts',
          'title.bar/primitives/title-bar-button-frame.tsx',
          'mount.tsx',
          'space.ts',
          'shell/Shell.tsx',
          'shell/Primary.tsx',
          'shell/PrototypeBar.tsx',
          'shell/TitleBar.tsx',
          'shell/Notifications.tsx',
          'shell/StatusPill.tsx',
          'shell/ProfileMenu.tsx',
          'shell/Drawer.tsx',
          'shell/workspace-chrome.css',
        ],
      }),
    );
    await put(
      stage,
      'package.json',
      json({
        name: 'talkdesk-workspace-prototype',
        private: true,
        type: 'module',
        packageManager: 'pnpm@11.7.0',
        scripts: {
          dev: 'vite --host 127.0.0.1',
          build: 'node tools/verify-workspace-shell.mjs && vite build',
          preview: 'vite preview --host 127.0.0.1',
        },
        dependencies: {
          ...dependencies,
          ...sourceDependencies,
          react: '18.3.1',
          'react-dom': '18.3.1',
        },
        devDependencies: {
          vite: '6.4.1',
          '@vitejs/plugin-react': '4.7.0',
          typescript: '5.8.3',
          '@types/react': '18.3.20',
          '@types/react-dom': '18.3.6',
        },
      }),
    );
    await rename(stage, out);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

async function addApps(out, spec) {
  await assertNoLinks(out);
  const lockPath = join(out, '.cobalt-scaffold.lock');
  const lock = await open(lockPath, 'wx');
  const created = [];
  const pending = join(out, '.talkdesk-prototype.next.json');
  let ownsPending = false;
  try {
    const configPath = join(out, 'talkdesk-prototype.json');
    await assertNoLinks(configPath);
    const raw = await readFile(configPath, 'utf8');
    const config = JSON.parse(raw);
    if (config.schemaVersion !== 1) throw new Error('Unsupported prototype schema');
    validate(config);
    const merged = validate({ apps: [...config.apps, ...spec.apps] });
    for (const app of spec.apps) {
      const target = join(out, 'src/apps', app.id);
      await assertNoLinks(target);
      try {
        await lstat(target);
        throw new Error(`App directory already exists: ${app.id}`);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    for (const app of spec.apps) {
      const target = join(out, 'src/apps', app.id);
      await mkdir(target);
      created.push(target);
      await writeApps(out, [app]);
    }
    if ((await readFile(configPath, 'utf8')) !== raw)
      throw new Error('Prototype registry changed concurrently; retry from current files');
    await put(out, '.talkdesk-prototype.next.json', json({ ...config, apps: merged.apps }));
    ownsPending = true;
    await rename(pending, configPath);
  } catch (error) {
    for (const path of created) await rm(path, { recursive: true, force: true });
    throw error;
  } finally {
    if (ownsPending) await rm(pending, { force: true });
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

/** Add source templates to a standalone/existing app without changing its package.json or authored files. */
async function copySource(out) {
  const destination = join(out, sourceDestination);
  await assertNoLinks(destination);
  try {
    await lstat(destination);
    throw new Error(
      'Source destination exists; inspect and adapt its code instead of replacing it',
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(dirname(destination), { recursive: true });
  const stage = await mkdtemp(join(dirname(destination), '.cobalt-source-'));
  try {
    await copyComponentSources(library, stage);
    await rename(stage, destination);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

async function main() {
  const [action, ...args] = process.argv.slice(2);
  if (action === '--help') {
    console.log(
      'cobalt-project.mjs create|add --out <project-directory> --spec <apps.json>; copy-source --out <existing-project>; verify-shell --out <project>',
    );
    return;
  }
  if (action === 'verify-shell' && args.length === 2 && args[0] === '--out') {
    console.log(json(await verifyWorkspaceShell(resolve(args[1]))));
    return;
  }
  if (action === 'copy-source' && args.length === 2 && args[0] === '--out') {
    const out = resolve(args[1]);
    await copySource(out);
    console.log(
      json({
        status: 'copied',
        source: join(out, sourceDestination),
        next: 'Read and adapt the copied source. Install only required official dependencies from dependencies.json; never install @openpencil/cobalt-extensions.',
      }),
    );
    return;
  }
  if (
    !['create', 'add'].includes(action) ||
    args.length !== 4 ||
    args[0] !== '--out' ||
    args[2] !== '--spec'
  ) {
    throw new Error(
      'Usage: cobalt-project.mjs create|add --out <project-directory> --spec <apps.json>; copy-source --out <existing-project>; verify-shell --out <project>',
    );
  }
  const spec = validate(JSON.parse(await readFile(resolve(args[3]), 'utf8')));
  const out = resolve(args[1]);
  if (action === 'create') await createProject(out, spec);
  else await addApps(out, spec);
  console.log(
    json({
      status: 'ready',
      project: out,
      registry: join(out, 'talkdesk-prototype.json'),
      next: 'Read the copied component implementations, types, styles and recipes; adapt local source and replace scaffold pages. Never install @openpencil/cobalt-extensions. Use SS Preview Fill with AI for managed install/start. Build delivery/index.html before POC handoff.',
    }),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
