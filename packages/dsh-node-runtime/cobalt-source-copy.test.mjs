import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { copyComponentSources } from '../talkdesk-cobalt/tools/cobalt-source-templates.mjs';

const librarySource = new URL('../talkdesk-cobalt/', import.meta.url);

for (const ancestor of ['node_modules', 'test', 'dist']) {
  test(`component copy preserves the complete registry under a ${ancestor} installation ancestor`, async t => {
    const root = await mkdtemp(join(tmpdir(), 'cobalt-installed-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const library = join(root, ancestor, 'runtime/cobalt-reference');
    await cp(new URL('components/extensions/src/', librarySource), join(library, 'components/extensions/src'), { recursive: true });
    await cp(new URL('components/extensions/dependencies.json', librarySource), join(library, 'components/extensions/dependencies.json'));
    await mkdir(join(library, 'registry'), { recursive: true });
    await cp(new URL('registry/authoring.json', librarySource), join(library, 'registry/authoring.json'));
    const source = join(library, 'components/extensions/src');
    await mkdir(join(source, '__tests__'), { recursive: true });
    await writeFile(join(source, '__tests__/excluded.ts'), 'test only');
    const destination = join(root, 'project/src/components/cobalt-extensions');
    await copyComponentSources(library, destination);
    assert.match(await readFile(join(destination, 'index.ts'), 'utf8'), /export/);
    const registry = JSON.parse(await readFile(join(library, 'registry/authoring.json'), 'utf8'));
    for (const component of registry.components) {
      for (const path of [component.readme, ...component.sourceFiles]) {
        assert.ok((await readFile(join(destination, path.replace('components/extensions/src/', '')))).length, path);
      }
    }
    await assert.rejects(readFile(join(destination, '__tests__/excluded.ts')), { code: 'ENOENT' });
  });
}

test('component copy refuses a damaged installed library before writing a destination', async t => {
  const root = await mkdtemp(join(tmpdir(), 'cobalt-damaged-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const library = join(root, 'library');
  await cp(new URL('components/extensions/src/', librarySource), join(library, 'components/extensions/src'), { recursive: true });
  await mkdir(join(library, 'registry'), { recursive: true });
  await cp(new URL('registry/authoring.json', librarySource), join(library, 'registry/authoring.json'));
  await rm(join(library, 'components/extensions/src/index.ts'));
  await assert.rejects(copyComponentSources(library, join(root, 'destination')), /Incomplete Cobalt source library: index.ts/);
  await assert.rejects(readFile(join(root, 'destination/index.ts')), { code: 'ENOENT' });
});
