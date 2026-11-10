/** Validate script-side variable changes without mutating the live engine. */
export function preflightDesignScript({ expanded, args, variables, themes, createEngine, document, heal }) {
  args.strictParent = true;
  if (!expanded.operations || (!Object.keys(variables).length && !Object.keys(themes).length)) return;
  const probe = createEngine();
  try {
    probe.load_document(document());
    for (const [tool, values] of [['set_themes', themes], ['set_variables', variables]]) {
      if (!Object.keys(values).length) continue;
      const key = tool === 'set_themes' ? 'themes' : 'variables';
      const checked = JSON.parse(probe.call_tool(tool, JSON.stringify({ [key]: values, replace: false })));
      if (checked.isError) return checked;
    }
    const operations = heal(args.operations);
    return JSON.parse(probe.call_tool('batch_design', JSON.stringify({ ...args, operations })));
  } finally {
    probe.free();
  }
}

export function healOperationsParents(operations, roots, { strict = false } = {}) {
  if (typeof operations !== 'string' || !operations.trim()) return operations;
  if (roots.length === 0) return operations;
  const containerIds = new Set();
  const leafParentMap = new Map();
  const nameToContainerId = new Map();
  const walk = (nodes, parentContainerId) => {
    for (const node of nodes ?? []) {
      if (!node || typeof node !== 'object' || typeof node.id !== 'string') continue;
      const isContainer =
        node.type === 'frame' || node.type === 'group' || Array.isArray(node.children);
      if (isContainer) {
        containerIds.add(node.id);
        if (typeof node.name === 'string' && node.name.trim()) {
          const key = node.name.trim().toLowerCase();
          if (!nameToContainerId.has(key)) nameToContainerId.set(key, node.id);
        }
        if (Array.isArray(node.children)) walk(node.children, node.id);
      } else if (parentContainerId) {
        leafParentMap.set(node.id, parentContainerId);
      }
    }
  };
  const rootFrame = roots.find((r) => r && (r.type === 'frame' || r.type === 'group')) ?? roots[0];
  const rootId = typeof rootFrame?.id === 'string' ? rootFrame.id : null;
  walk(roots, rootId);

  const lines = operations.split('\n');
  const definedBindings = new Set();
  for (const line of lines) {
    const match = /^\s*([A-Za-z_]\w*)\s*=\s*[ICKRMG]\s*\(/.exec(line);
    if (match) definedBindings.add(match[1]);
  }

  const resolveParentToken = (rawToken) => {
    const trimmed = rawToken.trim();
    const unquoted = trimmed.replace(/^["']|["']$/g, '');
    if (definedBindings.has(unquoted)) {
      return unquoted;
    }
    if (containerIds.has(unquoted)) {
      return JSON.stringify(unquoted);
    }
    if (
      !unquoted ||
      unquoted === 'null' ||
      unquoted === 'undefined' ||
      unquoted === '0' ||
      unquoted === 'root' ||
      unquoted === 'document'
    ) {
      return rawToken;
    }
    if (!strict && leafParentMap.has(unquoted)) {
      return JSON.stringify(leafParentMap.get(unquoted));
    }
    const byName = nameToContainerId.get(unquoted.toLowerCase());
    if (byName) {
      return JSON.stringify(byName);
    }
    if (!strict && rootId && /^n\d+$/i.test(unquoted)) {
      return JSON.stringify(rootId);
    }
    return rawToken;
  };

  return lines
    .map((line) => {
      const insertMatch = /^(\s*(?:[A-Za-z_]\w*\s*=\s*)?I\s*\(\s*)([^,]+)(,.*)$/s.exec(line);
      if (insertMatch) {
        return `${insertMatch[1]}${resolveParentToken(insertMatch[2])}${insertMatch[3]}`;
      }
      const kitMatch =
        /^(\s*(?:[A-Za-z_]\w*\s*=\s*)?K\s*\(\s*(?:"[^"]*"|'[^']*')\s*,\s*)([^,)]+)(.*)$/s.exec(
          line,
        );
      if (kitMatch) {
        return `${kitMatch[1]}${resolveParentToken(kitMatch[2])}${kitMatch[3]}`;
      }
      return line;
    })
    .join('\n');
}
