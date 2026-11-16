import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  rm,
  realpath,
  writeFile,
  access,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildContent, filesUnder } from '../tools/content.mjs';
import { exportCobalt, toolkitRoot } from '../tools/export.mjs';

async function checkLinks(path) {
  const text = await readFile(path, 'utf8');
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (!target.startsWith('http') && !target.startsWith('#'))
      await access(resolve(dirname(path), target));
  }
  return text;
}
function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}
function lookup(script, args) {
  const result = run(script, args);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
const forbiddenImport =
  /(?:from\s*|import\s*|require\s*\()['"]@openpencil\/cobalt-(?:extensions|wfm)(?:\/[^'"]*)?['"]/;
async function assertLocalTemplates(project, registry) {
  for (const component of registry.components) {
    await access(join(project, component.source));
    await checkLinks(join(project, component.readme));
    for (const file of component.sourceFiles) await access(join(project, file));
  }
  for (const recipe of registry.recipes) {
    const code = await readFile(join(project, recipe.path), 'utf8');
    assert.doesNotMatch(code, forbiddenImport);
    await checkLinks(join(project, recipe.readme));
    for (const source of recipe.supportingSources) await access(join(project, source));
    for (const component of recipe.composition) {
      await access(join(project, component.documentation));
      if (component.readme) await access(join(project, component.readme));
    }
  }
}

test('AI source-template registry exposes complete implementations and never advertises an installable extension package', async () => {
  const registry = await buildContent();
  assert.equal(registry.library.kind, 'source-templates');
  assert.equal(registry.library.reuse, 'copy-and-adapt-source');
  assert.equal(registry.library.package, undefined);
  assert.equal(registry.components.length, 28);
  assert.equal(registry.examples.length, 199);
  assert.ok(!registry.components.some((entry) => /filter-toolbar/i.test(entry.id)));
  assert.ok(!registry.examples.some((entry) => /filtertoolbar/i.test(entry.id)));
  const script = join(toolkitRoot, 'tools/cobalt-lookup.mjs');
  assert.equal(lookup(script, ['--query', 'list table filters']).results[0].id, 'recipe.list-page');
  const table = lookup(script, ['--id', 'extensions.basic-table', '--read-source']);
  assert.equal(table.reuse, 'copy-and-adapt-source');
  assert.equal(table.package, undefined);
  assert.ok(
    table.sources.some(
      (file) => file.path.endsWith('basic-table.tsx') && file.code.includes('BasicTableInner'),
    ),
  );
  assert.ok(
    table.sources.some(
      (file) => file.path.endsWith('basic-table.module.css') && file.code.includes('.wrapper'),
    ),
  );
  assert.ok(table.sources.some((file) => file.path.endsWith('table-layout-measure.ts')));
  for (const component of registry.components) {
    assert.ok(component.sourceFiles.length > 0);
    const readme = await checkLinks(join(toolkitRoot, component.readme));
    assert.ok(readme.includes('Never install `@openpencil/cobalt-extensions`'));
    const ai = await readFile(join(toolkitRoot, 'reference', component.aiDocumentation), 'utf8');
    assert.doesNotMatch(ai, forbiddenImport);
    for (const id of component.examples)
      assert.ok(registry.examples.some((example) => example.id === id));
  }
  for (const entry of [...registry.cobaltEntries, ...registry.documents])
    await access(join(toolkitRoot, 'reference', entry.documentation));
  for (const entry of [...registry.examples, ...registry.recipes])
    assert.doesNotMatch(await readFile(join(toolkitRoot, entry.path), 'utf8'), forbiddenImport);
  const toolbar = registry.cobaltEntries.find(
    (entry) => entry.package === '@talkdesk/cobalt-marketplace-react-toolbar',
  );
  assert.ok(toolbar.availableInScaffold);
  assert.ok(toolbar.exampleChecks.some((example) => example.check?.ok === false));
});

test('exported source templates create a self-contained project with local imports and no extension package or alias', async (t) => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cobalt-source-export-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const skill = join(root, 'node_modules/@synapse-studio/design/runtime/skills/synapse-design-html');
  await exportCobalt(skill);
  const manifest = JSON.parse(await readFile(join(skill, 'cobalt-reference/bundle.json')));
  await exportCobalt(skill);
  assert.equal(
    manifest.revision,
    JSON.parse(await readFile(join(skill, 'cobalt-reference/bundle.json'))).revision,
  );
  const library = join(skill, 'cobalt-reference');
  for (const path of [
    'components/extensions/src/index.ts',
    'components/extensions/src/basic-table/basic-table.tsx',
    'components/extensions/dependencies.json',
    'AI-INDEX.md',
  ]) {
    assert.equal(
      createHash('sha256')
        .update(await readFile(join(library, path)))
        .digest('hex'),
      manifest.files[path],
    );
  }
  for (const path of ['components/extensions/package.json', 'components/wfm', 'examples/wfm'])
    await assert.rejects(access(join(library, path)), { code: 'ENOENT' });
  const dependencies = JSON.parse(
    await readFile(join(library, 'components/extensions/dependencies.json')),
  );
  assert.ok(Object.keys(dependencies).every((name) => !name.startsWith('@openpencil/')));
  const spec = join(root, 'apps.json');
  await writeFile(
    spec,
    JSON.stringify({
      apps: [
        {
          id: 'new-app',
          title: 'New app',
          iconName: 'settings',
          pages: [{ id: 'users', title: 'Users' }],
        },
      ],
    }),
  );
  const project = join(root, 'project');
  const cli = join(skill, 'scripts/cobalt-project.mjs');
  const result = run(cli, ['create', '--out', project, '--spec', spec]);
  assert.equal(result.status, 0, result.stderr);
  const pkg = JSON.parse(await readFile(join(project, 'package.json')));
  assert.equal(pkg.packageManager, 'pnpm@11.7.0');
  assert.match(await readFile(join(project, 'pnpm-workspace.yaml'), 'utf8'), /autoInstallPeers: false/);
  assert.equal(pkg.dependencies['@openpencil/cobalt-extensions'], undefined);
  assert.equal(pkg.dependencies['@openpencil/cobalt-wfm'], undefined);
  await assert.rejects(access(join(project, 'packages')), { code: 'ENOENT' });
  await assert.rejects(access(join(project, 'src/components/cobalt-extensions/package.json')), {
    code: 'ENOENT',
  });
  const registry = JSON.parse(await readFile(join(project, 'registry/authoring.json')));
  await checkLinks(join(project, 'AI-INDEX.md'));
  await checkLinks(join(project, registry.library.index));
  await assertLocalTemplates(project, registry);
  for (const recipe of registry.recipes) {
    for (const dependency of recipe.packages) assert.ok(pkg.dependencies[dependency], dependency);
    assert.equal(recipe.import.source, recipe.path);
  }
  for (const path of await filesUnder(join(project, 'src'))) {
    if (/\.(?:tsx?|jsx?)$/.test(path))
      assert.doesNotMatch(await readFile(path, 'utf8'), forbiddenImport);
  }
  const examples = await filesUnder(join(project, 'examples'));
  for (const path of examples)
    if (path.endsWith('.tsx')) {
      const text = await readFile(path, 'utf8');
      assert.doesNotMatch(text, forbiddenImport);
      for (const [, target] of text.matchAll(/from ['"]([^'"]*cobalt-extensions[^'"]*)['"]/g))
        await access(resolve(dirname(path), target, 'index.ts'));
    }
  const resolved = lookup(join(project, 'tools/cobalt-lookup.mjs'), [
    '--id',
    'extensions.basic-table',
    '--read-source',
  ]);
  assert.ok(resolved.sources.every((file) => file.path.startsWith(project)));
  assert.ok(
    resolved.sources.some((file) => file.path.includes('/src/components/cobalt-extensions/')),
  );
  const localTable = join(project, 'src/components/cobalt-extensions/basic-table/basic-table.tsx');
  await writeFile(
    localTable,
    "import './missing-local-style.css';\n" + (await readFile(localTable, 'utf8')),
  );
  const incomplete = run(join(project, 'tools/cobalt-lookup.mjs'), [
    '--id',
    'extensions.basic-table',
    '--read-source',
  ]);
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stderr, /Unresolved local source import/);
});

test('copy-source supports standalone apps without a shell, manifest edits or replacement of existing source', async (t) => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cobalt-copy-source-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pkg = '{"private":true,"dependencies":{"react":"18.3.1"}}\n';
  await writeFile(join(root, 'package.json'), pkg);
  const cli = join(toolkitRoot, 'tools/cobalt-project.mjs');
  const args = ['copy-source', '--out', root];
  const result = run(cli, args);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(join(root, 'package.json'), 'utf8'), pkg);
  await access(join(root, 'src/components/cobalt-extensions/basic-table/basic-table.tsx'));
  await access(join(root, 'src/components/cobalt-extensions/dependencies.json'));
  await assert.rejects(access(join(root, 'src/workspace-shell')), { code: 'ENOENT' });
  const button = join(root, 'src/components/cobalt-extensions/button/button.tsx');
  await writeFile(button, '// locally adapted component\n');
  assert.equal(run(cli, args).status, 1);
  assert.equal(await readFile(button, 'utf8'), '// locally adapted component\n');
  const unsafe = join(root, 'unsafe');
  await symlink(root, unsafe);
  assert.equal(run(cli, ['copy-source', '--out', unsafe]).status, 1);
});
