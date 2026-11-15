/** Chrome geometry and the copy adapter must evolve together without modifying vendor inputs. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { adaptShell } from '../tools/cobalt-shell-adapter.mjs';
import { chromeWidth, requiredWidth, slotVisibility, TITLE_BAR_HEIGHT, DOCK_WIDTH } from '../templates/chrome/space.ts';

test('chrome costs participate in slot admission and actual frame geometry', () => {
  assert.equal(TITLE_BAR_HEIGHT, 44);
  assert.equal(DOCK_WIDTH, 48);
  assert.equal(chromeWidth(1440, false), 14);
  assert.equal(chromeWidth(1440, true), 13);
  assert.equal(chromeWidth(640, true), 1);
  assert.equal(chromeWidth(641, true), 13);
  assert.equal(requiredWidth({ drawer: false, secondaryArea: false, dock: false }), 422);
  const wants = { drawer: false, secondaryArea: true, dock: false };
  assert.equal(slotVisibility(781, wants, ['secondaryArea']).secondaryAreaVisible, false);
  assert.equal(slotVisibility(782, wants, ['secondaryArea']).secondaryAreaVisible, true);
  const drawer = { drawer: true, secondaryArea: false, dock: true };
  assert.equal(slotVisibility(640, drawer, ['drawer', 'dock']).drawerVisible, false);
  assert.equal(slotVisibility(641, drawer, ['drawer', 'dock']).drawerVisible, true);
  assert.equal(slotVisibility(641, drawer, ['drawer', 'dock']).dockExpandedVisible, false);
});

test('owned chrome replaces presentation only on the verified project copy', async () => {
  const base = new URL('../templates/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('source.json', base), 'utf8'));
  const source = new Map();
  for (const [path, hash] of Object.entries(manifest.files)) {
    const bytes = await readFile(new URL(`vendor/workspace-shell/${path}`, base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path);
    source.set(path, bytes.toString());
  }
  const chrome = new Map();
  for (const name of ['space.ts', 'title-bar.tsx', 'workspace-chrome.css', 'status-pill.tsx', 'profile-menu.tsx', 'notifications.tsx'])
    chrome.set(name, await readFile(new URL(`chrome/${name}`, base), 'utf8'));
  const project = new Map(source);
  const atlas = JSON.parse(await readFile(new URL('chrome/source.json', base), 'utf8'));
  for (const path of Object.keys(atlas.primitives)) project.set(path, await readFile(new URL(`vendor/atlas-titlebar/${path}`, base), 'utf8'));
  adaptShell(project, chrome);
  assert.equal(project.get('space.ts'), chrome.get('space.ts'));
  assert.match(project.get('mount.tsx'), /shell\/workspace-chrome.css/);
  assert.match(project.get('shell/Shell.tsx'), /chromeWidth\(windowWidth, hasDrawer\)/);
  assert.match(project.get('shell/Shell.tsx'), /ws-window--small/);
  assert.match(project.get('shell/TitleBar.tsx'), /workspace-titlebar/);
  assert.match(project.get('shell/TitleBar.tsx'), /workspace-search/);
  assert.match(source.get('space.ts'), /DOCK_WIDTH = 58/);
  const origin = JSON.parse(await readFile(new URL('chrome/source.json', base), 'utf8'));
  assert.equal(origin.designCommit, 'deb48668941974a71c7516fcaf0b53313b3d6d0f');
  assert.ok(Object.keys(origin.files).length >= 9);
  for (const [path, hash] of Object.entries(origin.primitives)) {
    const bytes = await readFile(new URL(`vendor/atlas-titlebar/${path}`, base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path);
  }
  assert.doesNotMatch(chrome.get('workspace-chrome.css'), /--chrome-(?:button|hover|selected|contrast):/);
  assert.doesNotMatch(chrome.get('title-bar.tsx'), /FakeInput/);
  assert.match(chrome.get('title-bar.tsx'), /TitleBarButton/);
  assert.throws(() => adaptShell(new Map(), chrome), /no longer matches/);
});
