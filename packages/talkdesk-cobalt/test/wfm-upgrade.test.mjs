import {createHash} from 'node:crypto';
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import ts from "typescript";
const root = fileURLToPath(new URL("../", import.meta.url));
test("migrated WFM dependencies use the same pinned Cobalt registry as the toolkit", async () => {
  const pkg = JSON.parse(await readFile(join(root, "components/extensions/package.json"), "utf8"));
  const registry = JSON.parse(
    await readFile(join(root, "reference/content/registry.json"), "utf8"),
  );
  const versions = new Map(
    registry.filter((e) => e.package && e.version).map((e) => [e.package, e.version]),
  );
  for (const [name, version] of Object.entries(pkg.dependencies))
    if (name.startsWith("@talkdesk/") && name !== "@talkdesk/cobalt-theme-base")
      assert.equal(version, versions.get(name), name);
  assert.equal(pkg.dependencies.react, "18.3.1");
  assert.equal(pkg.dependencies["@talkdesk/cobalt-react-button"], "3.3.1");
});
test("all migrated TypeScript components parse after path adaptation", async () => {
  async function walk(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) files.push(...(await walk(path)));
      else if (/\.(ts|tsx)$/.test(path)) files.push(path);
    }
    return files;
  }
  const paths = await walk(join(root, "components/extensions/src"));
  assert.ok(paths.length >= 60);
  for (const path of paths) {
    const file = ts.createSourceFile(
      path,
      await readFile(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    assert.deepEqual(
      file.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")),
      [],
      path,
    );
  }
});

test('the original WFM snapshot remains byte-for-byte traceable', async () => {
  const source = JSON.parse(await readFile(join(root, 'wfm-source.json'), 'utf8'));
  for (const [path, hash] of Object.entries(source.files)) {
    const bytes = await readFile(join(root, 'vendor/wfm-ui-components', path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path);
  }
});
