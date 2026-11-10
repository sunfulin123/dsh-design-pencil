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
const plan = (userMessage, taskKind = 'new', extra = {}) =>
  planDesignStyle(assets, { userMessage, taskKind, ...extra });

test('new designs wait for a real choice and list catalogue styles', async () => {
  const result = await plan('设计一个客户管理系统');
  assert.equal(result.decision, 'ask_user');
  assert.equal(result.recommendedId, 'talkdesk-cobalt');
  assert.equal(result.candidates[0].id, 'talkdesk-cobalt');
  assert.equal(result.count, 3);
  assert.equal(result.catalogRevision, 4);
  assert.match((await plan('Design an application')).question, /Choose a design style/);
  assert.match((await plan('Design an application', 'new', { locale: 'zh' })).question, /请选择/);
  assert.equal((await plan('设计应用', 'new', { query: 'brand' })).candidates[0].id, 'user:123');
  assert.equal((await plan('设计应用', 'new', { limit: 1 })).nextOffset, 1);
});

test('explicit style or delegated default avoids a repeated question', async () => {
  assert.deepEqual((await plan('使用 stripe 风格设计')).decision, 'use_explicit');
  assert.equal((await plan('使用 stripe 风格设计')).guideId, 'design-md:stripe');
  assert.equal((await plan('使用 stripe 风格，不要圆角')).guideId, 'design-md:stripe');
  assert.equal((await plan('不要 stripe，使用 talkdesk cobalt 风格')).guideId, 'talkdesk-cobalt');
  assert.equal((await plan('使用 My brand 风格设计')).guideId, 'user:123');
  assert.equal((await plan('使用 Talkdesk Cobalt 风格设计')).guideId, 'talkdesk-cobalt');
  assert.equal((await plan('你来决定')).decision, 'use_default');
  assert.equal((await plan('不要圆角，你来决定')).decision, 'use_default');
  assert.equal((await plan('不要使用默认风格')).decision, 'ask_user');
  assert.equal((await plan('不要默认风格')).decision, 'ask_user');
  assert.equal((await plan('比较 stripe 和 talkdesk-cobalt 风格')).decision, 'ask_user');
  assert.equal((await plan('你了解 stripe 风格吗？')).decision, 'ask_user');
  assert.equal((await plan('我想看看 stripe 风格')).decision, 'ask_user');
  assert.equal((await plan('布局你来决定')).decision, 'ask_user');
  assert.equal((await plan('布局交给你决定')).decision, 'ask_user');
  assert.equal((await plan('你决定颜色')).decision, 'ask_user');
  assert.equal((await plan('颜色用默认')).decision, 'ask_user');
  assert.equal((await plan('you decide the layout')).decision, 'ask_user');
  assert.equal((await plan('your choice of layout')).decision, 'ask_user');
  assert.equal((await plan('设计一个 stripe 风格的页面')).guideId, 'design-md:stripe');
  assert.equal((await plan('我们用 stripe 风格设计')).guideId, 'design-md:stripe');
  assert.equal((await plan('主题选 stripe')).guideId, 'design-md:stripe');
  assert.equal((await plan('style: stripe')).guideId, 'design-md:stripe');
  assert.equal((await plan('选 stripe')).guideId, 'design-md:stripe');
  assert.equal((await plan('use stripe')).guideId, 'design-md:stripe');
  assert.equal((await plan('帮我选择布局，顺便介绍 stripe 风格')).decision, 'ask_user');
  assert.equal((await plan('比较 stripe 和 talkdesk cobalt，最后使用 talkdesk cobalt 风格')).guideId, 'talkdesk-cobalt');
  assert.equal((await plan('用默认风格，布局你来决定')).decision, 'use_default');
  assert.equal((await plan('用默认风格布局这页')).decision, 'use_default');
  assert.equal((await plan(`${'stripe '.repeat(6000)}，使用 talkdesk cobalt 风格`)).guideId, 'talkdesk-cobalt');
});

test('continued designs inherit valid document style and reject stale IDs', async () => {
  assert.equal((await plan('把卡片缩小', 'local', { documentStyleId: 'design-md:stripe' })).decision, 'use_existing');
  assert.equal((await plan('继续设计', 'continue', { documentHasStyle: true })).decision, 'use_document');
  assert.equal((await plan('你来决定', 'local', { documentHasStyle: true })).decision, 'use_document');
  assert.equal((await plan('继续设计', 'continue', { documentHasStyle: true, documentStyleId: 'deleted' })).decision, 'use_document');
  assert.equal((await plan('换一种风格', 'restyle', { documentHasStyle: true })).decision, 'ask_user');
  await assert.rejects(plan('调整', 'local', { documentStyleId: 'missing' }), /Unknown style-guide/);
});
