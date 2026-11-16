/** Copy editable component templates and rebase authoring resources into a project. No package installation. */
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const sourceDestination = 'src/components/cobalt-extensions';
const sourcePrefix = 'components/extensions/src';
const excludedDirectories = new Set(['__tests__', 'test', 'node_modules', 'dist']);
const includeSource = (path) => !path.split(/[\\/]/).some((part) => excludedDirectories.has(part));
const json = (value) => JSON.stringify(value, null, 2) + '\n';

export async function copyComponentSources(library, destination) {
  const source = join(library, sourcePrefix);
  const paths = (await filesUnder(source)).filter((path) => includeSource(relative(source, path)));
  const registry = JSON.parse(await readFile(join(library, 'registry/authoring.json'), 'utf8'));
  const required = new Set(['index.ts', 'INDEX.md']);
  for (const component of registry.components) {
    for (const path of [component.readme, ...component.sourceFiles]) {
      if (!path.startsWith(sourcePrefix + '/') || path.split('/').includes('..')) {
        throw new Error(`Invalid component source path: ${path}`);
      }
      required.add(path.slice(sourcePrefix.length + 1));
    }
  }
  const available = new Set(paths.map((path) => relative(source, path)));
  for (const path of required) {
    if (!available.has(path)) throw new Error(`Incomplete Cobalt source library: ${path}`);
  }
  await cp(source, destination, {
    recursive: true,
    filter: (path) => includeSource(relative(source, path)),
  });
  // Validate within the caller's staging transaction, before the project can be promoted.
  for (const path of paths) {
    const copied = join(destination, relative(source, path));
    if (!(await readFile(copied)).equals(await readFile(path))) {
      throw new Error(`Incomplete Cobalt component copy: ${copied}`);
    }
  }
  await cp(
    join(library, 'components/extensions/dependencies.json'),
    join(destination, 'dependencies.json'),
  );
}

function projectSource(path) {
  return path.replace(sourcePrefix, sourceDestination);
}
async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected source link: ${path}`);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else files.push(path);
  }
  return files;
}

/** Preserve relative module structure while moving authored examples/recipes beside project-local source. */
export function rebaseSourceImports(code, originalPath, destinationPath) {
  return code.replace(
    /(from\s*['"]|import\s*['"])(\.[^'"]+)(['"])/g,
    (full, prefix, target, quote) => {
      const absolute = resolve('/', dirname(originalPath), target);
      const root = '/' + sourcePrefix;
      if (absolute !== root && !absolute.startsWith(root + '/')) return full;
      const mapped = '/' + projectSource(absolute.slice(1));
      let path = relative(resolve('/', dirname(destinationPath)), mapped);
      if (!path.startsWith('.')) path = './' + path;
      return prefix + path + quote;
    },
  );
}

/** Called inside the Workspace scaffold's staging transaction. */
export async function writeSourceResources(library, stage) {
  const authoring = fileURLToPath(new URL('../', import.meta.url));
  const contentRoot = library === authoring ? 'reference/content' : 'content';
  await copyComponentSources(library, join(stage, sourceDestination));
  await cp(join(library, contentRoot), join(stage, 'content'), { recursive: true });
  await cp(
    join(library, 'content/components/extensions'),
    join(stage, 'content/components/extensions'),
    { recursive: true },
  );
  await cp(
    join(library, contentRoot, 'components/extensions'),
    join(stage, 'reference/content/components/extensions'),
    { recursive: true, filter: (path) => !path.endsWith('.mdx') },
  );
  await cp(join(library, 'registry'), join(stage, 'registry'), { recursive: true });
  for (const [source, destination] of [
    ['recipes', 'src/recipes'],
    ['examples', 'examples'],
  ]) {
    await cp(join(library, source), join(stage, destination), { recursive: true });
    for (const path of await filesUnder(join(stage, destination))) {
      if (!/\.[cm]?[jt]sx?$/.test(path)) continue;
      const destinationPath = relative(stage, path);
      const originalPath = join(source, relative(join(stage, destination), path));
      await writeFile(
        path,
        rebaseSourceImports(await readFile(path, 'utf8'), originalPath, destinationPath),
      );
    }
  }
  const registry = JSON.parse(await readFile(join(stage, 'registry/authoring.json'), 'utf8'));
  registry.library.source = sourceDestination;
  registry.library.index = join(sourceDestination, 'INDEX.md');
  registry.library.dependencies = join(sourceDestination, 'dependencies.json');
  registry.components = registry.components.map((component) => ({
    ...component,
    source: projectSource(component.source),
    readme: projectSource(component.readme),
    sourceFiles: component.sourceFiles.map(projectSource),
  }));
  registry.recipes = registry.recipes.map((recipe) => ({
    ...recipe,
    path: 'src/' + recipe.path,
    readme: 'src/' + recipe.readme,
    supportingSources: recipe.supportingSources.map((path) => 'src/' + path),
    ...(recipe.sourceTemplateRoot ? { sourceTemplateRoot: sourceDestination } : {}),
    import: { ...recipe.import, source: 'src/' + recipe.import.source },
    composition: recipe.composition.map((component) => ({
      ...component,
      ...(component.readme ? { readme: projectSource(component.readme) } : {}),
    })),
  }));
  await writeFile(join(stage, 'registry/authoring.json'), json(registry));
  for (const recipe of registry.recipes) {
    const text = await readFile(join(stage, recipe.readme), 'utf8');
    await writeFile(
      join(stage, recipe.readme),
      text.replace(
        /(?:\.\.\/)+components\/extensions\/src\//g,
        (match) => '../' + match.replace(sourcePrefix + '/', sourceDestination + '/'),
      ),
    );
  }
  // The same entry is exported at the bundle root, then rebased to project-owned paths.
  const index = await readFile(
    join(library, library === authoring ? 'reference/AI-INDEX.md' : 'AI-INDEX.md'),
    'utf8',
  );
  await writeFile(
    join(stage, 'AI-INDEX.md'),
    index
      .replace(
        'All paths in this page start at the bundled cobalt-reference directory. In a generated project, read registry/authoring.json again: recipe/source/README paths have been rebased to that project.',
        'Paths in this copy start at the generated project root. Read registry/authoring.json for current local files.',
      )
      .replaceAll('recipes/', 'src/recipes/')
      .replaceAll('components/extensions/INDEX.md', sourceDestination + '/INDEX.md'),
  );
  await mkdir(join(stage, 'tools'), { recursive: true });
  await cp(new URL('./cobalt-lookup.mjs', import.meta.url), join(stage, 'tools/cobalt-lookup.mjs'));
}
