const nodeCache = new WeakMap();
function nodes(document) {
  if (nodeCache.has(document)) return nodeCache.get(document);
  const result = new Map();
  const walk = (items) => {
    for (const node of items ?? []) {
      if (typeof node.id === 'string') result.set(node.id, node);
      walk(node.children);
    }
  };
  walk(document.children);
  for (const page of document.pages ?? []) walk(page.children);
  nodeCache.set(document, result);
  return result;
}

function extensions(document, canonical) {
  const root = Object.fromEntries(
    Object.entries(document).filter(
      ([key]) => key !== 'editorMeta' && !Object.hasOwn(canonical, key),
    ),
  );
  const meta = Object.fromEntries(
    Object.entries(document.editorMeta ?? {}).filter(
      ([key]) => !Object.hasOwn(canonical.editorMeta ?? {}, key),
    ),
  );
  const known = nodes(canonical);
  const nodeFields = new Map();
  for (const [id, node] of nodes(document)) {
    const reference = known.get(id);
    if (reference) {
      const fields = Object.fromEntries(
        Object.entries(node).filter(([key]) => !Object.hasOwn(reference, key)),
      );
      if (Object.keys(fields).length) nodeFields.set(id, fields);
    }
  }
  return {
    root,
    meta,
    nodeFields,
    hadMeta: Object.hasOwn(document, 'editorMeta'),
    omittedMeta: Object.keys(canonical.editorMeta ?? {}).filter(
      (k) => !Object.hasOwn(document.editorMeta ?? {}, k),
    ),
  };
}

function applyNodeFields(document, fields) {
  if (fields.size === 0) return document;
  const walk = (items) =>
    (items ?? []).map((node) => ({
      ...fields.get(node.id),
      ...node,
      ...(Array.isArray(node.children) ? { children: walk(node.children) } : {}),
    }));
  return {
    ...document,
    children: walk(document.children),
    ...(Array.isArray(document.pages)
      ? { pages: document.pages.map((p) => ({ ...p, children: walk(p.children) })) }
      : {}),
  };
}

export function preserveTemplateExtensions(document, source, insertedIds) {
  const references = nodes(document);
  const page = source.pages?.[source.editorMeta?.activePageIndex ?? 0];
  const roots = page?.children ?? source.children;
  const fields = new Map();
  const pair = (original, inserted) => {
    if (!inserted) throw new Error('Template insertion did not retain the expected node structure');
    fields.set(
      inserted.id,
      Object.fromEntries(Object.entries(original).filter(([key]) => !Object.hasOwn(inserted, key))),
    );
    for (let i = 0; i < (original.children?.length ?? 0); i++)
      pair(original.children[i], inserted.children?.[i]);
  };
  if (roots.length !== insertedIds.length)
    throw new Error('Template root count changed during insertion');
  roots.forEach((node, index) => pair(node, references.get(insertedIds[index])));
  return applyNodeFields(document, fields);
}

export class DocumentHistory {
  #extensions = new Map();

  remember(document, canonical, history) {
    this.#extensions.set(history.revision, extensions(document, canonical));
    const retained = new Set([history.revision, ...history.past, ...history.future]);
    for (const revision of this.#extensions.keys()) {
      if (!retained.has(revision)) this.#extensions.delete(revision);
    }
  }

  merge(document, before, after, history, historyMove = false) {
    const extra =
      (historyMove && this.#extensions.get(history.revision)) || extensions(document, before);
    const merged = applyNodeFields(
      {
        ...extra.root,
        ...after,
        editorMeta: { ...extra.meta, ...after.editorMeta },
      },
      extra.nodeFields,
    );
    if (historyMove && this.#extensions.has(history.revision)) {
      for (const key of extra.omittedMeta) delete merged.editorMeta[key];
      if (!extra.hadMeta && Object.keys(merged.editorMeta).length === 0) delete merged.editorMeta;
    }
    return merged;
  }
}
