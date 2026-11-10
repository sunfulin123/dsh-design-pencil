import assert from 'node:assert/strict';
import test from 'node:test';
import { designCapabilities } from './design-tool-capabilities.mjs';
import { planDesignCanvas } from './design-canvas-plan.mjs';

test('capabilities expose actual schemas and default unknown operations to sensitive', () => {
  const schemas = ['get_design_capabilities', 'get_design_agent_prompt', 'plan_design_style', 'set_text_style', 'set_selection', 'import_design_md', 'future_tool']
    .map((name) => ({ name, description: name, inputSchema: { type: 'object' } }));
  const result = designCapabilities(schemas);
  assert.equal(result.version, 1);
  assert.deepEqual(result.tools.map((item) => item.access), [
    'document-read', 'document-read', 'document-read', 'document-write', 'session', 'sensitive', 'sensitive',
  ]);
  assert.deepEqual(result.tools[0].inputSchema, { type: 'object' });
});

test('canvas plan respects device and explicit sizes without adding a style', () => {
  const mobile = planDesignCanvas({ userMessage: '设计手机应用' });
  assert.equal(mobile.canvas.width, 390);
  assert.equal(mobile.canvas.finalHeight, 'fit_content');
  assert.doesNotMatch(mobile.seedScript, /fill|#[0-9a-f]{6}/i);
  const fixed = planDesignCanvas({ userMessage: '画板 1024×768' });
  assert.equal(fixed.canvas.width, 1024);
  assert.equal(fixed.canvas.finalHeight, 768);
  assert.equal(fixed.canvas.fixedViewport, true);
  assert.equal(planDesignCanvas({ userMessage: '你决定', context: '设计手机应用' }).canvas.width, 390);
  assert.equal(planDesignCanvas({ userMessage: '改成桌面', context: '手机 390×844' }).canvas.width, 1440);
});
