import assert from 'node:assert/strict';
import test from 'node:test';
import { planDesignStyle } from './design-style-plan.mjs';

const entries = [
  { id: 'user:123', name: 'My brand', kind: 'style-guide', isUser: true },
  { id: 'talkdesk-cobalt', name: 'talkdesk-cobalt', kind: 'style-guide' },
  { id: 'design-md:stripe', name: 'Stripi-Inspired-design-analysis', kind: 'style-guide' },
  { id: 'other', name: 'Preset', kind: 'theme-preset' },
];
const assets = {
  catalog: async () => ({ revision: 4, assets: entries }),
  checkRevision: (revision) => assert.equal(revision, 4),
};
const plan = (taskKind = 'new', extra = {}) =>
  planDesignStyle(assets, { taskKind, ...extra });

test('new designs wait for a real choice regardless of user language and list catalogue styles', async () => {
  const result = await plan('new', { userMessage: '顧客管理ダッシュボードを設計してください' });
  assert.equal(result.decision, 'ask_user');
  assert.equal(result.recommendedId, 'talkdesk-cobalt');
  assert.equal(result.candidates[0].id, 'talkdesk-cobalt');
  assert.equal(result.count, 3);
  assert.equal(result.catalogRevision, 4);
  assert.match((await plan('new', { userMessage: 'Concevoir une application CRM' })).question, /Choose a design style/);
  assert.equal((await plan('new', { query: 'brand' })).candidates[0].id, 'user:123');
  assert.equal((await plan('new', { limit: 1 })).nextOffset, 1);
  assert.equal((await plan('new', { userMessage: 'Compare stripe and talkdesk-cobalt' })).decision, 'ask_user');
});

test('structured styleMode and styleId resolve deterministically without natural-language guessing', async () => {
  assert.equal((await plan('new', { styleMode: 'explicit', styleId: 'design-md:stripe' })).decision, 'use_explicit');
  assert.equal((await plan('new', { styleMode: 'explicit', styleId: 'stripe' })).guideId, 'design-md:stripe');
  assert.equal((await plan('new', { styleMode: 'explicit', styleId: 'My brand' })).guideId, 'user:123');
  assert.equal((await plan('new', { styleMode: 'explicit', styleId: 'Talkdesk Cobalt' })).guideId, 'talkdesk-cobalt');
  assert.equal((await plan('new', { styleMode: 'explicit', styleId: 'S1' })).guideId, 'talkdesk-cobalt');
  assert.equal((await plan('new', { styleMode: 'default', userMessage: 'お任せします' })).decision, 'use_default');
  assert.equal((await plan('new', { styleMode: 'default' })).guideId, 'talkdesk-cobalt');
  assert.equal((await plan('new', { styleMode: 'ask_user', userMessage: 'use stripe' })).decision, 'ask_user');
  assert.equal((await plan('new', { styleMode: 'reselect', documentHasStyle: true })).decision, 'ask_user');
  await assert.rejects(plan('new', { styleMode: 'explicit' }), /requires styleId/);
  await assert.rejects(plan('new', { styleMode: 'explicit', styleId: 'nonexistent' }), /Unknown style-guide/);
});

test('continued designs inherit valid document style and reject stale IDs', async () => {
  assert.equal((await plan('local', { documentStyleId: 'design-md:stripe', userMessage: 'カードを小さくする' })).decision, 'use_existing');
  assert.equal((await plan('continue', { documentHasStyle: true })).decision, 'use_document');
  assert.equal((await plan('local', { documentHasStyle: true, styleMode: 'default' })).decision, 'use_document');
  assert.equal((await plan('continue', { documentHasStyle: true, documentStyleId: 'deleted' })).decision, 'use_document');
  assert.equal((await plan('restyle', { documentHasStyle: true })).decision, 'ask_user');
  await assert.rejects(plan('local', { documentStyleId: 'missing' }), /Unknown style-guide/);
});
