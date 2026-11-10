import assert from 'node:assert/strict';
import test from 'node:test';
import { EngineSession } from './engine-session.mjs';

test('MCP reads an ephemeral Unicode text range and rejects it after text changes', () => {
  const engine = new EngineSession({ version: '1.0.0', children: [
    { type: 'text', id: 'title', content: 'A中🙂Z' },
  ] });
  try {
    engine.setSelection({ selectedIds: ['title'], textRange: {
      nodeId: 'title', start: 1, end: 3, sourceText: 'A中🙂Z',
    } });
    const before = engine.snapshot();
    const selection = engine.callTool('get_selection', { readDepth: 0 });
    assert.deepEqual(selection.structuredContent.textRange, {
      nodeId: 'title', start: 1, end: 3, selectedText: '中🙂',
    });
    assert.deepEqual(JSON.parse(selection.content[0].text).textRange, selection.structuredContent.textRange);
    assert.deepEqual(engine.getSelection().textRange, selection.structuredContent.textRange);
    assert.deepEqual(engine.snapshot(), before);
    assert.equal(engine.callTool('set_node_text', { node_id: 'title', text: 'changed' }).isError, false);
    assert.equal(engine.callTool('get_selection', { readDepth: 0 }).structuredContent.textRange, undefined);
    assert.equal(engine.getSelection().textRange, undefined);
  } finally {
    engine.close();
  }
});

test('malformed or mismatched text ranges do not appear in selection context', () => {
  const engine = new EngineSession({ version: '1.0.0', children: [{ type: 'text', id: 't', content: 'ok' }] });
  try {
    for (const range of [
      { nodeId: 't', start: 0, end: 3, sourceText: 'ok' },
      { nodeId: 'other', start: 0, end: 1, sourceText: 'ok' },
      { nodeId: 't', start: 0, end: 1, sourceText: 'stale' },
    ]) {
      engine.setSelection({ selectedIds: ['t'], textRange: range });
      assert.equal(engine.callTool('get_selection', { readDepth: 0 }).structuredContent.textRange, undefined);
    }
  } finally {
    engine.close();
  }
});

test('text range tools target the supplied page through the production engine', () => {
  const engine = new EngineSession({ version: '1.0.0', children: [], pages: [
    { id: 'page-a', name: 'A', children: [{ type: 'text', id: 'a', content: 'First' }] },
    { id: 'page-b', name: 'B', children: [{ type: 'text', id: 'b', content: '中🙂Z' }] },
  ] });
  try {
    const args = { pageId: 'page-b', nodeId: 'b', start: 0, end: 2 };
    const result = engine.callTool('set_text_style', { ...args, style: { fill: '#ff0000' } });
    assert.equal(result.isError, false, JSON.stringify(result));
    const read = engine.callTool('get_text_style', args);
    assert.equal(read.isError, false, JSON.stringify(read));
    assert.equal(read.structuredContent.text, '中🙂');
    assert.equal(read.structuredContent.runs[0].fill, '#ff0000');
    const bad = engine.callTool('set_text_style', { ...args, pageId: 'missing', style: { fill: '#000000' } });
    assert.equal(bad.isError, true);
    assert.equal(engine.callTool('undo', {}).isError, false);
    const reverted = engine.callTool('get_text_style', args);
    assert.equal(reverted.structuredContent.runs[0].fill, undefined);
  } finally {
    engine.close();
  }
});
