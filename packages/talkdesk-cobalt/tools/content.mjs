/** Build local indexes and plain AI reference from authored MDX and executable examples. */
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { toolkitRoot as root } from './export.mjs';
import { indexRecipes, writeAuthoringIndex } from './authoring-index.mjs';
import { writeComponentIndexes } from './component-index.mjs';
import { discoverStyles } from '../../design-data/tools/catalog.mjs';
export async function filesUnder(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isSymbolicLink()) throw new Error(`Unexpected link: ${e.name}`);
    const path = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await filesUnder(path)));
    else files.push(path);
  }
  return files.toSorted();
}
export async function buildContent() {
  const examples = [];
  for (const path of await filesUnder(join(root, 'examples'))) {
    if (!path.endsWith('.tsx')) continue;
    const rel = relative(root, path);
    const name = path.split('/').at(-1).slice(0, -4);
    const match = /^(.*)-(\d+)$/.exec(name);
    if (!match) throw new Error(`Example filename must end in a numeric id: ${path}`);
    examples.push({
      id: `extensions.${match[1]}.${match[2].padStart(3, '0')}`,
      path: rel,
      kind: 'example',
    });
  }
  const recipes = (await filesUnder(join(root, 'recipes')))
    .filter((p) => p.endsWith('.tsx') && !relative(join(root, 'recipes'), p).startsWith('support/'))
    .map((p) => ({
      id:
        'recipe.' +
        relative(join(root, 'recipes'), p)
          .replace(/\.tsx$/, '')
          .replaceAll('/', '.'),
      path: relative(root, p),
      kind: 'recipe',
    }));
  const components = [];
  for (const path of await filesUnder(join(root, 'content/components/extensions'))) {
    if (!path.endsWith('.mdx')) continue;
    const text = await readFile(path, 'utf8');
    const name = text.match(/^# (.+)$/m)?.[1];
    if (!name) throw new Error(`Component documentation needs a title: ${path}`);
    const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    components.push({
      id: `extensions.${slug}`,
      name,
      documentation: relative(join(root, 'content'), path),
      source: `components/extensions/src/${slug}`,
      readme: `components/extensions/src/${slug}/README.md`,
      aiDocumentation: `content/components/extensions/${path.split('/').at(-1).replace('.mdx', '.md')}`,
      authoredDocumentation: `content/${relative(join(root, 'content'), path)}`,
      description: text
        .replace(/^# .+\r?\n\r?\n/, '')
        .split(/\r?\n\r?\n/)[0]
        .replaceAll('\n', ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      keywords: [name, slug, 'Cobalt Extensions', 'reusable component'],
      examples: [...text.matchAll(/<Example id="([^"]+)"/g)].map((match) => match[1]),
    });
  }
  await indexRecipes(root, recipes, components);
  const original = JSON.parse(
    await readFile(join(root, 'reference/content/registry.json'), 'utf8'),
  );
  const scaffoldDependencies = {
    ...JSON.parse(await readFile(join(root, 'templates/dependencies.json'), 'utf8')),
    ...JSON.parse(await readFile(join(root, 'components/extensions/package.json'), 'utf8'))
      .dependencies,
  };
  const cobaltEntries = original.map((entry) => ({
    id: entry.id,
    name: entry.name,
    kind: entry.kind,
    package: entry.package,
    version: entry.version,
    documentation: `content/${entry.docs.markdown}`,
    import: entry.import,
    availableInScaffold: entry.package ? Boolean(scaffoldDependencies[entry.package]) : undefined,
    exampleChecks: (entry.examples ?? []).map((example) => ({
      label: example.label,
      check: example.check
        ? { ok: example.check.ok, kind: example.check.kind, summary: example.check.summary }
        : { ok: null, kind: 'unverified' },
    })),
    recipes: recipes
      .filter((recipe) => recipe.packages.includes(entry.package))
      .map((recipe) => recipe.id),
  }));
  const documents = [];
  for (const path of await filesUnder(join(root, 'reference/content'))) {
    if (!path.endsWith('.md') || /\/components\/(extensions|wfm)\//.test(path)) continue;
    const text = await readFile(path, 'utf8');
    const documentation = 'content/' + relative(join(root, 'reference/content'), path);
    documents.push({
      id: 'reference:' + documentation,
      name: text.match(/^# (.+)$/m)?.[1] ?? path.split('/').at(-1),
      category: documentation.split('/')[1],
      documentation,
    });
  }
  await writeFile(
    join(root, 'components/extensions/dependencies.json'),
    JSON.stringify(
      JSON.parse(await readFile(join(root, 'components/extensions/package.json'), 'utf8'))
        .dependencies,
      null,
      2,
    ) + '\n',
  );
  const registry = {
    formatVersion: 1,
    library: {
      id: 'cobalt-extensions',
      name: 'Cobalt Extensions',
      kind: 'source-templates',
      reuse: 'copy-and-adapt-source',
      source: 'components/extensions/src',
      index: 'components/extensions/src/INDEX.md',
      projectSource: 'src/components/cobalt-extensions',
      dependencies: 'components/extensions/dependencies.json',
      forbiddenPackages: ['@openpencil/cobalt-extensions'],
      usage: 'General-purpose reusable components built on Cobalt; not restricted to WFM.',
    },
    pathBases: {
      default: '.',
      componentDocumentation: 'content/',
      styles: 'authoring repository design-data/styles; use get_style_guide by id',
    },
    cobaltEntries,
    documents,
    components,
    examples,
    recipes,
    styles: await discoverStyles(),
  };
  await writeComponentIndexes(root, registry);
  await writeAuthoringIndex(root, registry);
  await mkdir(join(root, 'registry'), { recursive: true });
  await writeFile(join(root, 'registry/authoring.json'), JSON.stringify(registry, null, 2) + '\n');
  // Remove the previous generated name so the website has one canonical document per component.
  await rm(join(root, 'reference/content/components/wfm'), { recursive: true, force: true });
  const ai = join(root, 'reference/content/components/extensions');
  await rm(ai, { recursive: true, force: true });
  await mkdir(ai, { recursive: true });
  for (const path of await filesUnder(join(root, 'content'))) {
    if (!path.endsWith('.mdx')) continue;
    let content = await readFile(path, 'utf8');
    content = content.replace(/<Example id="([^"]+)"\s*\/>/g, (_, id) => {
      const example = examples.find((e) => e.id === id);
      if (!example) throw new Error(`Unknown example: ${id}`);
      return `**Runnable example:** \`${example.path}\` (read the source; compatibility is checked by the examples build).`;
    });
    if (/<Example\b/.test(content)) throw new Error(`Unsupported example directive: ${path}`);
    await writeFile(join(ai, path.split('/').at(-1).replace('.mdx', '.md')), content);
  }
  return registry;
}
if (process.argv[1]?.endsWith('/content.mjs'))
  console.log(JSON.stringify(await buildContent()).slice(0, 160));
