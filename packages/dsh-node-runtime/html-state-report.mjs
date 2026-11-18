/** Coverage and execution completion are separate from visual approval and file persistence. */
const clone = (value) => JSON.parse(JSON.stringify(value));
export function htmlStateResult(state, checkpoint) {
  const candidates = state.candidates;
  const pendingCount = candidates.filter(
    (c) => !['captured', 'excluded'].includes(c.status),
  ).length;
  const limitations = [...new Set(state.warnings)].filter((warning) => {
    const recoveredFont = (state.fonts || []).some(
      (face) => face.available && warning.startsWith(`Page font ${face.family} ${face.weight} `),
    );
    if (recoveredFont) return false;
    return /blocked|Internal scroll|truncat|budget exhausted|missing font|font.*(?:failed|rejected|could not|limit|unavailable|unsupported)|pixels skipped|unresolved icon glyphs|could not locate some captured .* glyphs|resources may be missing|Frame .*(?:transformed viewport|produced no editable snapshot|could not be matched|raster evidence reached)/i.test(
      warning,
    );
  });
  const frames = state.frames || [];
  for (const frame of frames) {
    if (frame.status === 'available') continue;
    const path = frame.framePath.join(' > ');
    limitations.push(
      `${frame.label || 'Embedded frame'}${path ? ` (${path})` : ''}: ${frame.reason}`,
    );
  }
  const structureComplete =
    state.boards.length > 0 &&
    pendingCount === 0 &&
    limitations.length === 0 &&
    state.boards.every((b) => b.structure?.status === 'verified');
  const visualComplete =
    structureComplete &&
    state.boards.length > 0 &&
    state.boards.every((b) => b.visual?.status === 'verified');
  return clone({
    document: state.document,
    nodeCount: state.document.children.reduce((sum, node) => {
      const count = (n) => 1 + (n.children || []).reduce((s, c) => s + count(c), 0);
      return sum + count(node);
    }, 0),
    boards: state.boards,
    fonts: state.fonts || [],
    warnings: [...new Set(state.warnings)],
    verification: { structureComplete, visualComplete },
    coverage: {
      complete: structureComplete,
      structuralComplete: structureComplete,
      visualComplete,
      limitations,
      states: candidates,
      frames,
      pendingCount,
    },
    checkpoint: checkpoint,
    done:
      state.budgetExhausted === true ||
      !candidates.some((c) => c.status === 'pending' && c.safe) ||
      state.boards.length - (state.boardWindowStart || 0) >= 40 ||
      state.actions >= 120 ||
      state.elapsedMs >= 600000,
  });
}

/** Compare extracted visible text/row/graphic witnesses with the converted subtree. */
export function compareHtmlStateStructure(snapshot, root) {
  const sourceTexts = [],
    sourceRows = [],
    sourceGraphics = [];
  const walk = (node, visit) => {
    if (!node || typeof node !== 'object') return;
    visit(node);
    for (const child of node.children || []) walk(child, visit);
  };
  walk(snapshot.root, (n) => {
    if (n.kind === 'text' && n.text?.trim()) sourceTexts.push(n.text);
    if (n.tag === 'tr') sourceRows.push(n);
    if (n.kind === 'image' || n.tag === 'svg') sourceGraphics.push(n);
  });
  const importedTexts = [],
    importedRows = [],
    importedGraphics = [];
  walk(root, (n) => {
    if (n.type === 'text')
      importedTexts.push(
        typeof n.content === 'string'
          ? n.content
          : (n.content || []).map((c) => c.text || '').join(''),
      );
    if (String(n.name).toLowerCase() === 'tr' || n.role === 'row') importedRows.push(n);
    if (['image', 'path', 'icon_font'].includes(n.type)) importedGraphics.push(n);
  });
  const normalize = (s) => s.replace(/\s+/g, '').toLowerCase();
  const text = normalize(importedTexts.join(''));
  const missingText = sourceTexts.filter((s) => !text.includes(normalize(s)));
  const issues = [];
  if (missingText.length) issues.push('Extracted visible text was not retained');
  if (sourceRows.length && importedRows.length < sourceRows.length)
    issues.push('Table row structure is incomplete or unavailable');
  if (sourceGraphics.length && !importedGraphics.length)
    issues.push('Source graphics have no converted paint nodes');
  return {
    status: issues.length ? 'unverified' : 'verified',
    sourceTextRuns: sourceTexts.length,
    matchedTextRuns: sourceTexts.length - missingText.length,
    sourceRows: sourceRows.length,
    convertedRows: importedRows.length,
    sourceGraphics: sourceGraphics.length,
    convertedGraphics: importedGraphics.length,
    issues,
  };
}

/** Painted graphic identity participates in deduplication even when surrounding labels stay fixed. */
export function htmlStateGraphics(snapshot) {
  const values = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'image' || node.tag === 'svg')
      values.push([node.src, node.d, node.fill, node.rect]);
    for (const child of node.children || []) walk(child);
  };
  walk(snapshot.root);
  return values;
}
