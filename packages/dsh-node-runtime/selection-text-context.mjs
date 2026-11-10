// Text selections are ephemeral editor context, never authored document data.
const ranges = new WeakMap();
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;

export function isSelectionSetTool(name) {
  return ['set_selection', 'set_selection_set', 'select_nodes', 'select_by_type'].includes(name);
}

export function clearTextRange(session) {
  ranges.delete(session);
}

export function saveTextRange(session, body) {
  const value = body?.textRange;
  if (!value || typeof value !== 'object' || typeof value.nodeId !== 'string' ||
      typeof value.sourceText !== 'string' || Buffer.byteLength(value.sourceText) > MAX_SOURCE_BYTES ||
      !Number.isSafeInteger(value.start) || !Number.isSafeInteger(value.end) ||
      value.start < 0 || value.start >= value.end || value.end > Array.from(value.sourceText).length ||
      !Array.isArray(body.selectedIds) || body.selectedIds.length !== 1 || body.selectedIds[0] !== value.nodeId) {
    ranges.delete(session);
    return;
  }
  ranges.set(session, { nodeId: value.nodeId, start: value.start, end: value.end,
    sourceText: value.sourceText, pageId: typeof body.activePageId === 'string' ? body.activePageId : null });
}

export function attachTextRange(session, target, selection) {
  const range = ranges.get(session);
  if (!range || !target || !selection || selection.selectedIds?.length !== 1 ||
      selection.selectedIds[0] !== range.nodeId ||
      (range.pageId !== null && selection.activePageId !== range.pageId)) return target;
  const node = selection.nodes?.find(item => item.id === range.nodeId);
  const content = typeof node?.content === 'string' ? node.content
    : Array.isArray(node?.content) ? node.content.map(run => run.text ?? '').join('') : null;
  if (content !== range.sourceText) return target;
  target.textRange = { nodeId: range.nodeId, start: range.start, end: range.end,
    selectedText: Array.from(content).slice(range.start, range.end).join('') };
  return target;
}
