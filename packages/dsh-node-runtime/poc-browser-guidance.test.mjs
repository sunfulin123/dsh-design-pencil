/** Visible POC review is preferred while the existing headless capture remains available. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { readGuide } from './guide-text.test-helper.mjs';

const base = new URL('../../crates/op-ai-skills/skills/', import.meta.url);

test('POC guidance prefers Browser Use and distinguishes original capture evidence from display images', async () => {
  const guide = await readGuide(new URL('synapse-design-html/references/poc-review.md', base));
  assert.match(guide, /Prefer Browser Use/);
  assert.match(guide, /browser_open/);
  assert.match(guide, /quality: "original"/);
  assert.match(guide, /verbatim PNG/);
  assert.match(guide, /headless fallback/);
  assert.match(guide, /Do not replay/);
  assert.match(guide, /fullPage: true/);
  assert.match(guide, /80%/);
  assert.match(guide, /20 screenshots/);
  assert.match(guide, /requestedUrl/);
  assert.match(guide, /background jobs.*restart/i);
  for (const resource of ['scripts/review-poc.mjs', 'scripts/poc-browser-runner.mjs', 'scripts/poc-browser-actions.mjs', 'scripts/verify-surface.mjs']) {
    await access(new URL('synapse-design-html/' + resource, base));
  }
  const html = await readFile(new URL('synapse-design-html/SKILL.md', base), 'utf8');
  assert.match(html, /Browser Use/);
  const main = await readFile(new URL('synapse-design/SKILL.md', base), 'utf8');
  assert.match(main, /Browser Use/);
});
