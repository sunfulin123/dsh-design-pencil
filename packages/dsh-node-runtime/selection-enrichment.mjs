export function enrichSelection(result, layoutReply) {
  const layoutById = new Map();
  const parentById = new Map();
  const indexLayout = (items, parent = null) => {
    for (const item of items ?? []) {
      if (!item || typeof item !== 'object') continue;
      if (typeof item.id === 'string') {
        layoutById.set(item.id, item);
        if (parent && typeof parent.id === 'string') {
          parentById.set(item.id, {
            id: parent.id,
            name: parent.name ?? '',
            type: parent.type ?? 'frame',
          });
        }
      }
      if (Array.isArray(item.children)) indexLayout(item.children, item);
    }
  };
  indexLayout(layoutReply?.structuredContent?.layout);
  const enrichNode = (node) => {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string') return node;
    const layout = layoutById.get(node.id);
    const parent = parentById.get(node.id);
    const next = { ...node };
    if (typeof next.width === 'string') next.sizingWidth = next.width;
    if (typeof next.height === 'string') next.sizingHeight = next.height;
    if (layout) {
      if (typeof layout.x === 'number' && Number.isFinite(layout.x)) next.x = Math.round(layout.x);
      if (typeof layout.y === 'number' && Number.isFinite(layout.y)) next.y = Math.round(layout.y);
      if (typeof layout.width === 'number' && Number.isFinite(layout.width))
        next.width = Math.round(layout.width);
      if (typeof layout.height === 'number' && Number.isFinite(layout.height))
        next.height = Math.round(layout.height);
    }
    if (parent) {
      next.parentId = parent.id;
      if (parent.name) next.parentName = parent.name;
    }
    if (Array.isArray(next.children)) next.children = next.children.map(enrichNode);
    return next;
  };
  result.structuredContent.nodes = result.structuredContent.nodes.map(enrichNode);
  result.content = [{ type: 'text', text: JSON.stringify(result.structuredContent) }];
}
