/** Inspect the registered business module graph with the project's installed TypeScript parser. */
import { createRequire } from 'node:module';
import { readFile, lstat, realpath } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function inspectBusinessSources(project) {
  project = resolve(project);
  const findings = [];
  const add = (code, message, path) => findings.push({ code, message, path });
  const owned = async (file) => {
    const rel = relative(project, file);
    if (
      rel.startsWith('..') ||
      relative(await realpath(project), await realpath(file)).startsWith('..')
    )
      throw new Error('Business source escapes project');
    let current = project;
    for (const part of rel.split('/')) {
      current = join(current, part);
      if ((await lstat(current)).isSymbolicLink()) throw new Error('Business source symlink');
    }
  };
  await owned(join(project, 'talkdesk-prototype.json'));
  const registry = JSON.parse(await readFile(join(project, 'talkdesk-prototype.json'), 'utf8'));

  const packages =
    JSON.parse(await readFile(join(project, 'package.json'), 'utf8')).dependencies || {};
  const approvedPackages = new Set(
    Object.keys(packages).filter((name) => name.startsWith('@talkdesk/cobalt-')),
  );
  const roots = [];
  for (const app of registry.apps || [])
    for (const page of app.pages || []) {
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(app.id) || !/^[a-z][a-z0-9-]{0,63}$/.test(page.id))
        throw new Error('Invalid business route');
      const path = join(project, 'src/apps', app.id, 'pages', page.id + '.tsx');
      await owned(path);
      roots.push(path);
      const source = await readFile(path, 'utf8');
      if (
        source.includes('Cobalt business page scaffold') ||
        source.includes('Replace with the planned content and interactions')
      )
        add(
          'scaffold-placeholder',
          'Replace the registered business scaffold with the planned UI.',
          relative(project, path),
        );
    }
  if (!roots.length) add('missing-business-routes', 'No registered business pages exist.');
  if (findings.length) return { status: 'fail', findings };
  let ts;
  try {
    const dependency = join(project, 'node_modules');
    if ((await lstat(dependency)).isSymbolicLink()) throw new Error('Foreign node_modules');
    const require = createRequire(join(project, 'package.json'));
    const path = require.resolve('typescript');
    if (!relative(project, await realpath(path)).startsWith('node_modules/'))
      throw new Error('TypeScript must be installed in this project');
    ts = require(path);
  } catch {
    return {
      status: 'unavailable',
      findings: [
        {
          code: 'parser-unavailable',
          message:
            'Install this project dependencies before source inspection; no foreign parser is borrowed.',
        },
      ],
    };
  }
  const options = {
    jsx: ts.JsxEmit.Preserve,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
  };
  const pending = [...roots],
    seen = new Set();
  let officialUses = 0;
  while (pending.length) {
    const file = pending.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const rel = relative(project, file);
    if (rel.startsWith('..')) {
      add('external-source', 'Business imports escape the project.', rel);
      continue;
    }
    if (seen.size > 300) {
      add('graph-budget', 'Business module graph exceeds the bounded inspection budget.');
      break;
    }
    if ((await lstat(file)).isSymbolicLink()) {
      add('source-symlink', 'Business source must remain project-owned.', rel);
      continue;
    }
    await owned(file);
    const text = await readFile(file, 'utf8'),
      source = ts.createSourceFile(
        file,
        text,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
    if (source.parseDiagnostics.length) {
      add('parse-error', 'Business source could not be parsed.', rel);
      continue;
    }
    const componentImports = new Map(),
      reactFactories = new Set();
    for (const statement of source.statements) {
      const spec =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : undefined;
      if (!spec) continue;
      const packageName = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0];
      if (spec.startsWith('@talkdesk/') && !approvedPackages.has(packageName))
        add('unapproved-package', 'Use the pinned documented Cobalt package for this UI.', rel);
      if (
        spec.startsWith('.') &&
        /\.(?:css|scss|sass|less|json|svg|png|jpe?g|webp|woff2?)(?:\?.*)?$/i.test(spec)
      ) {
        await owned(resolve(dirname(file), spec.split('?')[0]));
        continue;
      }
      const dependency = ts.resolveModuleName(spec, file, options, ts.sys).resolvedModule
        ?.resolvedFileName;
      if (
        dependency &&
        relative(await realpath(project), await realpath(dependency)).startsWith('..')
      )
        add(
          'external-dependency',
          'Dependencies must be installed for this project; foreign modules are not borrowed.',
          rel,
        );
      const library =
        (approvedPackages.has(packageName) && Boolean(dependency)) ||
        dependency?.includes('/src/components/cobalt-extensions/');
      if (dependency?.includes('/src/components/cobalt-extensions/')) await owned(dependency);
      if (
        ts.isImportDeclaration(statement) &&
        spec === 'react' &&
        statement.importClause?.namedBindings &&
        ts.isNamedImports(statement.importClause.namedBindings)
      )
        for (const binding of statement.importClause.namedBindings.elements)
          if ((binding.propertyName || binding.name).text === 'createElement')
            reactFactories.add(binding.name.text);
      if (ts.isImportDeclaration(statement) && library) {
        const clause = statement.importClause;
        if (clause?.name) componentImports.set(clause.name.text, true);
        if (clause?.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings))
            componentImports.set(clause.namedBindings.name.text, true);
          else
            for (const n of clause.namedBindings.elements) componentImports.set(n.name.text, true);
        }
      }
      if (
        dependency &&
        !dependency.includes('/node_modules/') &&
        !dependency.includes('/src/components/cobalt-extensions/') &&
        !dependency.endsWith('.d.ts')
      )
        pending.push(dependency);
      else if ((spec.startsWith('.') || spec.startsWith('@/')) && !dependency)
        add('unresolved-module', 'A local business dependency cannot be resolved.', rel);
    }
    const references = new Map();
    const identifiers = (n) => {
      if (ts.isIdentifier(n)) references.set(n.text, (references.get(n.text) || 0) + 1);
      ts.forEachChild(n, identifiers);
    };
    identifiers(source);
    const deadLocal = (node) => {
      for (let owner = node.parent; owner; owner = owner.parent) {
        if (
          ts.isFunctionDeclaration(owner) &&
          owner.name &&
          !owner.modifiers?.some((m) =>
            [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].includes(m.kind),
          )
        )
          return (references.get(owner.name.text) || 0) < 2;
        if (
          ts.isArrowFunction(owner) &&
          ts.isVariableDeclaration(owner.parent) &&
          ts.isIdentifier(owner.parent.name)
        )
          return (references.get(owner.parent.name.text) || 0) < 2;
      }
      return false;
    };
    const visit = (node) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'import.meta.glob')
        add('dynamic-module', 'Computed business module groups require explicit review.', rel);
      if (
        (ts.isJsxAttribute(node) && node.name.getText(source) === 'dangerouslySetInnerHTML') ||
        (ts.isBinaryExpression(node) && /\.(innerHTML|outerHTML)$/.test(node.left.getText(source)))
      )
        add(
          'opaque-html',
          'Injected markup requires explicit source review; reuse cannot be verified.',
          rel,
        );
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source),
          first = tag.split('.')[0];
        if (componentImports.has(first) && !deadLocal(node)) officialUses++;
        if (['input', 'select', 'textarea', 'button', 'dialog', 'svg', 'canvas'].includes(tag))
          add(
            'native-ui',
            'Reuse the matching documented Cobalt/Extensions control, icon or chart recipe.',
            rel,
          );
        if (['div', 'section', 'article', 'span'].includes(tag))
          for (const attribute of node.attributes.properties)
            if (
              ts.isJsxAttribute(attribute) &&
              attribute.name.text === 'className' &&
              attribute.initializer &&
              /\b(card|widget|tag|badge|chip)\b(?![-_](?:grid|row|list|layout|container|wrapper|label))/i.test(
                attribute.initializer.getText(source),
              )
            )
              add(
                'custom-card',
                'Use the documented Card/widget recipe rather than a styled native surface.',
                rel,
              );
      }
      if (
        ts.isCallExpression(node) &&
        (node.expression.getText(source).endsWith('.createElement') ||
          reactFactories.has(node.expression.getText(source))) &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0]) &&
        ['input', 'select', 'textarea', 'button', 'dialog', 'svg', 'canvas'].includes(
          node.arguments[0].text,
        )
      )
        add(
          'imperative-native-ui',
          'Reuse documented UI rather than creating native controls imperatively.',
          rel,
        );
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (!arg || !ts.isStringLiteral(arg))
          add('dynamic-module', 'Computed imports require a bounded manual reuse review.', rel);
        else {
          const dependency = ts.resolveModuleName(arg.text, file, options, ts.sys).resolvedModule
            ?.resolvedFileName;
          if (
            dependency &&
            !dependency.includes('/node_modules/') &&
            !dependency.includes('/src/components/cobalt-extensions/')
          )
            pending.push(dependency);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  if (!officialUses)
    add(
      'no-component-usage',
      'No actual Cobalt or copied Extensions JSX usage was found; imports alone are not evidence.',
    );
  return { status: findings.length ? 'fail' : 'pass', findings };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  inspectBusinessSources(resolve(dirname(fileURLToPath(import.meta.url)), '..'))
    .then((result) => {
      console.log(JSON.stringify(result));
      if (result.status !== 'pass') process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
