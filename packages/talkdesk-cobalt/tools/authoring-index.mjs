/** Generate AI entry points and recipe integration docs from authored intent and actual imports. */
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, relative, dirname, normalize } from 'node:path';

const packageName = name => name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/');

export async function indexRecipes(root, recipes, components) {
  const catalog = JSON.parse(await readFile(join(root, 'recipes/catalog.json'), 'utf8'));
  const packageInfo = JSON.parse(
    await readFile(join(root, 'components/extensions/package.json'), 'utf8'),
  );
  const dependencyVersions = JSON.parse(await readFile(join(root, 'templates/dependencies.json'), 'utf8'));
  const cobalt = JSON.parse(await readFile(join(root, 'reference/content/registry.json'), 'utf8'));
  for (const recipe of recipes) {
    const key = recipe.path.replace(/^recipes\//, '');
    const intent = catalog[key];
    if (!intent) throw new Error(`Recipe has no usage contract: ${key}`);
    const code = await readFile(join(root, recipe.path), 'utf8');
    const component = code.match(/export default function (\w+)/)?.[1];
    if (!component) throw new Error(`Recipe needs a named default export: ${recipe.path}`);
    const packages = [
      ...new Set([...code.matchAll(/from\s*['"]([^.'"][^'"]+)['"]/g)].map((match) => packageName(match[1]))),
    ];
    const supportingSources = [
      ...new Set(
        [...code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)].map((match) =>
          normalize(join(dirname(recipe.path), match[1])),
        ),
      ),
    ];
    const localSupport = supportingSources.filter(
      (path) => !path.startsWith('components/extensions/src'),
    );
    for (let index = 0; index < localSupport.length; index++) {
      const base = localSupport[index];
      for (const suffix of ['.ts', '.tsx']) {
        try { await access(join(root, base + suffix)); localSupport[index] = base + suffix; break; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      const support = await readFile(join(root, localSupport[index]), 'utf8');
      for (const match of support.matchAll(/from\s*['"]([^.'"][^'"]+)['"]/g)) {
        const name = packageName(match[1]);
        if (!packages.includes(name)) packages.push(name);
      }
    }
    const resolved = intent.composition.map((id) => {
      const extension = components.find((item) => item.id === id);
      if (extension)
        return { id, documentation: extension.aiDocumentation, readme: extension.readme };
      const official = cobalt.find((item) => item.id === id);
      if (!official) throw new Error(`Unknown component in recipe ${recipe.id}: ${id}`);
      return { id, documentation: `content/${official.docs.markdown}` };
    });
    Object.assign(recipe, intent, {
      component,
      import: { name: component, kind: 'default', source: recipe.path },
      packages,
      supportingSources: localSupport,
      sourceTemplateRoot: code.includes('components/extensions/src')
        ? 'components/extensions/src'
        : undefined,
      readme: recipe.path.replace(/\.tsx$/, '.md'),
      composition: resolved,
    });
    const link = (target) => relative(dirname(recipe.path), target);
    await writeFile(
      join(root, recipe.readme),
      [
        `# ${intent.title}`,
        '',
        '<!-- Generated from recipes/catalog.json and recipe source imports. -->',
        '',
        intent.description,
        '',
        `Read and copy [${key}](${link(recipe.path)}). Default export: \`${component}\`.`,
        '',
        ...localSupport.map(
          (path) =>
            `Supporting source: [${path}](${link(path)}). Copy this file too when reusing the recipe outside a scaffold.`,
        ),
        '',
        '## Integration',
        '',
        intent.usage,
        '',
        'Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.',
        '',
        '## Components and dependencies',
        '',
        ...resolved.map(
          (item) =>
            `- \`${item.id}\`${item.readme ? `: [component guidance](${link(item.readme)}).` : ': look up its exact import and props in the Cobalt registry.'}`,
        ),
        '',
        ...packages.map(
          (name) =>
            `- \`${name}\`${(packageInfo.dependencies[name] ?? dependencyVersions[name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/')]) ? ` (${packageInfo.dependencies[name] ?? dependencyVersions[name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/')]})` : ''}`,
        ),
        '',
        'Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.',
        '',
        `States covered: ${intent.states.join(', ')}.`,
        '',
        '## Limits and required adaptation',
        '',
        intent.limits,
        '',
        'Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.',
        '',
      ].join('\n'),
    );
  }
  const sourceKeys = new Set(recipes.map((recipe) => recipe.path.replace(/^recipes\//, '')));
  for (const key of Object.keys(catalog))
    if (!sourceKeys.has(key)) throw new Error(`Recipe catalog points to missing source: ${key}`);
}

export async function writeAuthoringIndex(root, registry) {
  await writeFile(
    join(root, 'reference/AI-INDEX.md'),
    [
      '# Talkdesk Cobalt AI authoring entry',
      '',
      'All paths in this page start at the bundled cobalt-reference directory. In a generated project, read registry/authoring.json again: recipe/source/README paths have been rebased to that project.',
      '',
      '1. Read references/cobalt-workspace.md from the parent HTML Skill for build mode, shell setup and delivery workflow.',
      '2. Search [registry/authoring.json](registry/authoring.json) by purpose, keywords or exact ID. Read only the matching component and recipe docs; this index does not replace API documentation.',
      '3. Read the complete relevant [Cobalt source templates](components/extensions/INDEX.md), including implementation, types, CSS and local dependencies; copy them to src/components/cobalt-extensions/, then adapt and import local modules. Never install @openpencil/cobalt-extensions or import/alias that package name. Official @talkdesk/* packages remain normal dependencies. Otherwise read the matching core/marketplace entry and its exact import/version in [content/registry.json](content/registry.json). Duplicate names such as Button, Table and DatePicker are separate APIs; qualify the library and import. Reuse existing controls for tags, badges, avatars and empty states before adding UI. Retain specialized chart/schedule layouts and requested motion as composition, and document any missing component capability.',
      '4. Use lookup --id <component-ID> --read-source to inspect full source before reuse. Workspace creation copies all templates; standalone/existing apps use cobalt-project.mjs copy-source --out <project>. Read the recipe integration contract, then the actual TSX. Extend the source and connect required callbacks instead of copying old inline snippets from migrated pages.',
      '5. Preserve source qualifications. Migrated examples marked check.ok=false or “Doesn’t compile” are not executable templates. The maintained recipes/examples are checked separately; their build success does not validate all migrated snippets.',
      '6. Test the requested states, callbacks, keyboard behavior, themes and target Workspace app widths. Keep prototype controls in the host toolbar.',
      '',
      '## Bounded lookup',
      '',
      'Use the HTML Skill script: `node <skill-directory>/scripts/cobalt-lookup.mjs --query "list table filters"`. Then use `--id recipe.list-page` to resolve the current local source, integration guide and API file paths. Search returns at most eight entries by default. Translate the brief into library terms such as users, table, toolbar or validation; retry individual terms when no result matches before assuming a component is missing. Inside a generated project, the same read-only command is `node tools/cobalt-lookup.mjs`. Read the resolved files before coding; do not load the entire large reference registry into context.',
      '',
      '## Path conventions',
      '',
      'authoring.json source/readme/path/aiDocumentation/authoredDocumentation paths are relative to this bundle; the component documentation field is relative to content/. Recipe paths are rebased in generated projects. Styles are discovered by style ID using get_style_guide; their source paths belong to the authoring repository, not this bundle.',
      '',
      '## Verified recipe entry points',
      '',
      ...registry.recipes.flatMap((recipe) => [
        `### ${recipe.title}`,
        '',
        recipe.description,
        '',
        `- Integration: [${recipe.readme}](${recipe.readme}); source: [${recipe.path}](${recipe.path}).`,
        `- Default export: \`${recipe.component}\`; states: ${recipe.states.join(', ')}.`,
        `- Limits: ${recipe.limits}`,
        '',
      ]),
      '## Document retrieval',
      '',
      'registry/authoring.json also indexes the migrated Markdown documents by category/name and records core/marketplace package availability in the scaffold. Foundations, patterns and Workspace docs remain authoritative for design guidance; component props come from the selected library API. When a required official @talkdesk/* or React dependency is absent, install its pinned version explicitly after checking the target app; extension templates must be copied as source, never installed as @openpencil/cobalt-extensions; do not guess that all documented packages are preinstalled.',
      '',
    ].join('\n'),
  );
}
