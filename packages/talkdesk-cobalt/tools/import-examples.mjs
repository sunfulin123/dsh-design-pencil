/** One-time, explicit WFM MDX migration. Never replace authored documents during a normal build. */
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import { toolkitRoot as root } from "./export.mjs";
const printer = ts.createPrinter();
function normalize(code) {
  const source = ts.createSourceFile(
    "example.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const bindings = new Map();
  const statements = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) {
      statements.push(statement);
      continue;
    }
    const clause = statement.importClause;
    const module = statement.moduleSpecifier.text;
    const keep = (name) => {
      if (bindings.has(name)) {
        if (bindings.get(name) !== module) throw new Error(`Conflicting import ${name}`);
        return false;
      }
      bindings.set(name, module);
      return true;
    };
    const name = clause.name && keep(clause.name.text) ? clause.name : undefined;
    let named = clause.namedBindings;
    if (named && ts.isNamedImports(named))
      named = ts.factory.updateNamedImports(
        named,
        named.elements.filter((e) => keep(e.name.text)),
      );
    if (!name && (!named || (ts.isNamedImports(named) && !named.elements.length))) continue;
    statements.push(
      ts.factory.updateImportDeclaration(
        statement,
        statement.modifiers,
        ts.factory.updateImportClause(clause, clause.isTypeOnly, name, named),
        ts.factory.createStringLiteral(
          module === "@wfm/ui-components" ? "../../components/extensions/src" : module,
        ),
        statement.attributes,
      ),
    );
  }
  return printer.printFile(ts.factory.updateSourceFile(source, statements));
}
const pending = [];
await mkdir(join(root, "examples/extensions"), { recursive: true });
await mkdir(join(root, "content/components/extensions"), { recursive: true });
for (const file of await readdir(join(root, "vendor/wfm-ui-components/docs/components"))) {
  if (!file.endsWith(".mdx")) continue;
  const slug = file.slice(0, -4);
  let index = 0;
  const raw = await readFile(join(root, "vendor/wfm-ui-components/docs/components", file), "utf8");
  const content = raw.replace(/```(?:tsx|jsx) preview\r?\n([\s\S]*?)```/g, (_, code) => {
    const id = `extensions.${slug}.${String(++index).padStart(3, "0")}`;
    const path = `examples/extensions/${slug}-${index}.tsx`;
    pending.push(writeFile(join(root, path), normalize(code), { flag: "wx" }));
    return `<Example id="${id}" />`;
  });
  pending.push(
    writeFile(
      join(root, "content/components/extensions", file),
      content.replaceAll("'@wfm/ui-components'", "'./components/cobalt-extensions'"),
      { flag: "wx" },
    ),
  );
}
await Promise.all(pending);
