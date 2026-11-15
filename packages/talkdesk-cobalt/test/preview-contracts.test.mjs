/** Canonical preview geometry and protected built-in Workspace registration. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
test('built-in registration needs no icon and generated shell rejects modification', async (t) => {
  const temp = await realpath(await mkdtemp(join(tmpdir(), 'protected-cobalt-')));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const spec = join(temp, 'spec.json'),
    out = join(temp, 'project');
  await writeFile(
    spec,
    JSON.stringify({
      apps: [
        {
          id: 'wfm',
          title: 'Workforce Management',
          pages: [{ id: 'insights', title: 'Insights' }],
        },
        {
          id: 'conversation',
          title: 'Conversations',
          iconName: 'work',
          pages: [{ id: 'call', title: 'Call' }],
        },
      ],
    }),
  );
  const result = spawnSync(
    process.execPath,
    [join(root, 'tools/cobalt-project.mjs'), 'create', '--out', out, '--spec', spec],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const source = JSON.parse(await readFile(join(out, 'cobalt-source.json'), 'utf8'));
  assert.equal(source.adapterVersion, 7);
  assert.ok(source.protectedFiles['src/main.tsx']);
  assert.ok(source.protectedFiles['src/prototype-runtime/dock-registry.ts']);
  const registry = JSON.parse(await readFile(join(out, 'talkdesk-prototype.json'), 'utf8'));
  assert.equal(registry.apps[1].iconName, undefined);
  const verify = () =>
    spawnSync(process.execPath, [join(out, 'tools/verify-workspace-shell.mjs')], {
      encoding: 'utf8',
    });
  assert.equal(verify().status, 0);
  await writeFile(
    join(out, 'src/apps/wfm/pages/insights.tsx'),
    'export default function Page(){return null}',
  );
  assert.equal(verify().status, 0);
  await writeFile(
    join(out, 'src/workspace-shell/shell/SvgIcon.tsx'),
    'export const SvgIcon=()=>null',
  );
  assert.notEqual(verify().status, 0);
  assert.match(verify().stderr, /SvgIcon/);
});
test('both adapters copy the same compact visual source', async () => {
  const css = await readFile(
    join(root, '../html-prototype-review/scripts/html-review/chrome.css'),
    'utf8',
  );
  assert.match(css, /44px/);
  assert.match(css, /32px/);
  assert.match(css, /36px/);
  const html = await readFile(
    join(root, '../html-prototype-review/scripts/html-review/review.html'),
    'utf8',
  );
  assert.doesNotMatch(html, /⌄/);
  assert.match(html, /review-icon--chevron/);
  assert.match(
    await readFile(join(root, 'templates/project/review-dropdown.tsx'), 'utf8'),
    /review-icon--chevron/,
  );
});
test('every built-in retains its canonical icon and drawer model even with an icon override', async () => {
  const { default: ts } = await import('typescript');
  const menu = await readFile(
    join(root, 'templates/vendor/workspace-shell/data/menu.generated.ts'),
    'utf8',
  );
  const defaults = JSON.parse(menu.match(/DEFAULT_DOCK_APPS: DockApp\[\] = (\[[\s\S]*?\n\]);/)[1]);
  const before = JSON.stringify(defaults);
  const code = ts
    .transpileModule(await readFile(join(root, 'templates/project/dock-registry.ts'), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    })
    .outputText.replace(/^import .*;$/gm, '')
    .replace(/export function /g, 'function ');
  const merge = new Function(
    'DEFAULT_DOCK_APPS',
    'addDockApp',
    code + ';return createPrototypeDock;',
  )(defaults, (apps, app) => apps.concat(app));
  const actual = merge(
    defaults.map((app) => ({
      id: app.id,
      title: 'Override',
      iconName: 'work',
      pages: [{ id: 'demo', title: 'Demo' }],
    })),
  );
  for (const expected of defaults) {
    const item = actual.find((x) => x.id === expected.id);
    assert.equal(item.icon, expected.icon, expected.id);
    assert.equal(item.iconName, expected.iconName, expected.id);
    assert.equal(item.title, expected.title);
    if (!expected.sections) assert.equal(item.sections, undefined);
  }
  assert.equal(JSON.stringify(defaults), before);
});
