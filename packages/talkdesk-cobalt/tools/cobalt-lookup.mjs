#!/usr/bin/env node
/** Read-only, bounded lookup across AI recipes, extension APIs and migrated Cobalt documents. */
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const library = existsSync(join(root, 'registry/authoring.json'))
  ? root
  : join(root, 'cobalt-reference');
const registry = JSON.parse(await readFile(join(library, 'registry/authoring.json'), 'utf8'));
const indexedDocs = new Set(registry.cobaltEntries.map((entry) => entry.documentation));
const entries = [
  ...registry.components.map((entry) => ({
    ...entry,
    reuse: registry.library.reuse,
    projectSource: entry.projectSource,
    library: 'Cobalt Extensions',
  })),
  ...registry.recipes.map((entry) => ({ ...entry, name: entry.title, library: 'Owned recipe' })),
  ...registry.cobaltEntries.map((entry) => ({ ...entry, library: 'Cobalt reference' })),
  ...registry.documents
    .filter((entry) => !indexedDocs.has(entry.documentation))
    .map((entry) => ({ ...entry, library: 'Design reference' })),
];
const args = process.argv.slice(2);
function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
function locate(path) {
  const candidates = [join(library, path), join(library, 'reference', path)];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) throw new Error(`Indexed file is missing: ${path}`);
  return resolve(file);
}
/** Read every selected component file and recursively follow its local code/style imports. */
async function sourceClosure(initial) {
  if (!initial) throw new Error('--read-source requires a component ID with sourceFiles');
  const files = new Map();
  async function visit(file) {
    if (files.has(file)) return;
    if (!file.startsWith(resolve(library) + '/'))
      throw new Error('Source import leaves the local library');
    const code = await readFile(file, 'utf8');
    files.set(file, code);
    for (const match of code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      const base = resolve(dirname(file), match[1]);
      let resolved;
      for (const candidate of [
        base,
        base + '.ts',
        base + '.tsx',
        base + '.css',
        base + '.js',
        join(base, 'index.ts'),
        join(base, 'index.tsx'),
      ]) {
        try {
          if ((await stat(candidate)).isFile()) {
            resolved = candidate;
            break;
          }
        } catch (error) {
          if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
        }
      }
      if (!resolved) throw new Error(`Unresolved local source import ${match[1]} in ${file}`);
      await visit(resolved);
    }
  }
  for (const file of initial) await visit(file);
  return [...files].map(([path, code]) => ({ path, code }));
}

try {
  const id = option('--id');
  if (id) {
    const canonical = id;
    const entry =
      entries.find((entry) => entry.id === canonical) ??
      registry.documents.find((entry) => entry.id === canonical);
    if (!entry) throw new Error(`Unknown reference ID: ${id}`);
    const documentation = entry.aiDocumentation ?? entry.documentation;
    const files = {};
    if (documentation) files.documentation = locate(documentation);
    for (const field of ['source', 'readme', 'path'])
      if (entry[field]) files[field] = locate(entry[field]);
    if (entry.sourceFiles) files.sourceFiles = entry.sourceFiles.map(locate);
    if (entry.supportingSources) files.supportingSources = entry.supportingSources.map(locate);
    const sources = args.includes('--read-source')
      ? await sourceClosure(files.sourceFiles)
      : undefined;
    console.log(JSON.stringify({ ...entry, files, sources }, null, 2));
  } else {
    const query = option('--query')?.trim().toLowerCase();
    if (!query)
      throw new Error(
        'Use --query "table filters" [--limit 8], then --id <exact ID> to resolve source/API files.',
      );
    const limit = Number(option('--limit') ?? 8);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20)
      throw new Error('--limit must be an integer from 1 to 20');
    const words = query.split(/\s+/);
    const matches = entries
      .map((entry) => {
        const name = `${entry.name} ${entry.id}`.toLowerCase();
        const text = [name, entry.description ?? '', ...(entry.keywords ?? [])]
          .join(' ')
          .toLowerCase();
        const score = words.reduce(
          (sum, word) => sum + (name.includes(word) ? 3 : text.includes(word) ? 1 : 0),
          0,
        );
        return { entry, score };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
    console.log(
      JSON.stringify(
        {
          query,
          total: matches.length,
          results: matches.slice(0, limit).map(({ entry }) => ({
            id: entry.id,
            name: entry.name,
            library: entry.library,
            description: entry.description,
            package: entry.package,
            reuse: entry.reuse,
            projectSource: entry.projectSource,
            availableInScaffold: entry.availableInScaffold,
            states: entry.states,
          })),
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
