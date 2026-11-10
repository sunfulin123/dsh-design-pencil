import assert from 'node:assert/strict';
import test from 'node:test';
import { EngineSession } from './engine-session.mjs';
import { expandScriptWithVariables } from './script-expansion.mjs';

test('design scripts cannot reach the host through an operation callback', () => {
  const script = `
    const host = __record.constructor('return process')();
    I(null, { type: 'frame', name: String(host.version) });
  `;
  assert.throws(() => expandScriptWithVariables(script), /process|not defined/i);
  assert.throws(() => expandScriptWithVariables(`
    ({}).constructor.constructor('return process')(); I(null, { type: 'frame' });
  `), /process|not defined/i);
});

test('a script cannot conceal an operation-limit violation or run indefinitely', () => {
  assert.throws(() => expandScriptWithVariables(`
    try { for (let i = 0; i < 4100; i++) I(null, { type: 'frame' }); } catch (_) {}
  `), /too many operations/i);
  assert.throws(() => expandScriptWithVariables('while (true) {}'), /interrupted/i);
});

test('a design script cannot exceed its interpreter memory budget', () => {
  assert.throws(() => expandScriptWithVariables("new Array(200000000).fill('x')"), /out of memory/i);
});

test('a rejected script cannot mutate the document or its undo history', () => {
  const session = new EngineSession({ version: '0.8.5', children: [] });
  try {
    const before = session.snapshot();
    const result = session.callTool('batch_design', {
      script: `__record.constructor('return process')(); I(null, { type: 'frame' });`,
    });
    assert.equal(result.isError, true);
    assert.deepEqual(session.snapshot(), before);
  } finally {
    session.close();
  }
});

test('invalid wrappers and overwritten creation helpers cannot partially apply a script', () => {
  const scripts = [
    `I(null, { type: 'frame' }); return 1;`,
    `tools.synapse_design_pipeline_batch({ script: 'I(null,{type:"frame"})' });`,
    `const I = () => {}; I(null, { type: 'frame' });`,
    `function K() {} I(null, { type: 'frame' });`,
    `const root = I(null, { type: 'frame' }); root.children = [];`,
  ];
  for (const script of scripts) {
    const session = new EngineSession({ version: '0.8.5', children: [] });
    try {
      const before = session.snapshot();
      const result = session.callTool('batch_design', { script });
      assert.equal(result.isError, true, script);
      assert.deepEqual(session.snapshot(), before);
    } finally { session.close(); }
  }
});

test('a newly created parent accepts children and a missing parent leaves the draft unchanged', () => {
  const session = new EngineSession({ version: '0.8.5', children: [
    { type: 'frame', id: 'root', name: 'Root', width: 800, height: 600, children: [] },
  ] });
  try {
    const result = session.callTool('batch_design', { script: `
      const card = I('root', { type: 'frame', name: 'Card', width: 240, height: 100 });
      I(card, { type: 'text', name: 'Title', content: 'Hello' });
    ` });
    assert.equal(result.isError, false, JSON.stringify(result));
    const before = session.snapshot();
    const card = before.document.children[0].children.find(node => node.name === 'Card');
    assert.equal(card.children[0].name, 'Title');
    const failed = session.callTool('batch_design', { script: `
      const missing = I('missing-parent', { type: 'frame', name: 'Missing' });
      I(missing, { type: 'text', content: 'Must not be created' });
    ` });
    assert.equal(failed.isError, true, JSON.stringify(failed));
    assert.deepEqual(session.snapshot(), before);
    const failedWithVariable = session.callTool('batch_design', { script: `
      V('--accidental', '#123456');
      I('missing-parent', { type: 'frame', name: 'Missing' });
    ` });
    assert.equal(failedWithVariable.isError, true, JSON.stringify(failedWithVariable));
    assert.deepEqual(session.snapshot(), before);
    assert.doesNotMatch(JSON.stringify(session.callTool('get_variables', {})), /accidental/);
    const missingGeneratedId = session.callTool('batch_design', { script: `I('n999999', { type: 'frame', name: 'Missing' });` });
    assert.equal(missingGeneratedId.isError, true, JSON.stringify(missingGeneratedId));
    assert.deepEqual(session.snapshot(), before);
  } finally { session.close(); }
});
