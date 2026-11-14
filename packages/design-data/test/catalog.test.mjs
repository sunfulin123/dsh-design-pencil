import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverStyles } from "../tools/catalog.mjs";
test("new folders are discovered without editing a registration list", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "design-data-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "new-brand"));
  await writeFile(join(root, "new-brand/DESIGN.md"), "# New brand\nA complete new guide.");
  assert.equal((await discoverStyles(root))[0].id, "new-brand");
  await writeFile(
    join(root, "new-brand/style.json"),
    '{"id":"stable:brand","category":"enterprise"}',
  );
  assert.equal((await discoverStyles(root))[0].id, "stable:brand");
});
test("existing stable ids and original content hashes survive migration", async () => {
  const entries = await discoverStyles();
  assert.ok(entries.length >= 85);
  assert.equal(entries[0].id, "talkdesk-cobalt");
  assert.ok(entries.some((e) => e.id === "design-md:apple"));
  assert.equal(new Set(entries.map((e) => e.id)).size, entries.length);
  const provenance = JSON.parse(await readFile(new URL('../community-source.json', import.meta.url)));
  for (const original of provenance.files) {
    const current = entries.find(entry => entry.id === original.id);
    assert.equal(current?.sha256, original.sha256, original.id);
  }
});

test('invalid bytes, duplicate ids and linked metadata cannot enter the embedded catalogue', async t => {
  const root = await mkdtemp(join(tmpdir(), 'design-data-invalid-'));
  t.after(() => rm(root, {recursive:true,force:true}));
  await mkdir(join(root, 'brand'));
  await writeFile(join(root, 'brand/DESIGN.md'), Buffer.from([255,255,255,255,255,255,255,255,255]));
  await assert.rejects(discoverStyles(root));
  await writeFile(join(root, 'brand/DESIGN.md'), '# Brand\nValid style content.');
  await writeFile(join(root, '.DS_Store'), 'finder metadata');
  assert.equal((await discoverStyles(root)).length, 1);
  await writeFile(join(root, 'metadata.json'), '{}');
  await symlink(join(root, 'metadata.json'), join(root, 'brand/style.json'));
  await rm(join(root, 'metadata.json'));
  await assert.rejects(discoverStyles(root), /regular style.json/);
  await rm(join(root, 'brand/style.json'));
  await mkdir(join(root, 'another'));
  await writeFile(join(root, 'another/DESIGN.md'), '# Another\nValid style content.');
  await writeFile(join(root, 'another/style.json'), '{"id":"brand"}');
  await assert.rejects(discoverStyles(root), /duplicate style id/);
});
