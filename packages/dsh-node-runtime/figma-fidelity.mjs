import { figmaFetch, figmaNodesUrl, figmaRenderUrl, parseFigmaWebUrl, resolveFigmaToken, FigmaApiError } from './figma-rest-client.mjs'
import { diffPng } from './png-diff.mjs'

// Vector parts are merged into one imported path; their layers are not missing.
const MERGED_PARTS = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'REGULAR_POLYGON'])

/** Figma stores raw characters and applies `textCase` when rendering. */
function renderedCase(node) {
  const text = node.characters
  switch (node.style?.textCase) {
    case 'UPPER': return text.toUpperCase()
    case 'LOWER': return text.toLowerCase()
    case 'TITLE': return text.replace(/\b\p{L}/gu, c => c.toUpperCase())
    default: return text
  }
}

function textOf(node) {
  if (typeof node.content === 'string') return node.content
  if (Array.isArray(node.content)) return node.content.map(segment => segment?.text ?? '').join('')
  return ''
}

/**
 * Imported document nodes by id (all pages), for `figmaNodeId` and text.
 * Ids of expanded component instances (`<ref>__<layer>`) resolve to the
 * component layer merged with the instance's `descendants` override; its
 * component-relative `figmaNodeId` (`I<component>;<key>`) is rewritten to the
 * instance's Figma REST id (`I<instance>;<key>`).
 */
function documentIndex(document) {
  const byId = new Map()
  const walk = list => {
    for (const n of list ?? []) {
      if (!n || typeof n !== 'object') continue
      if (n.id) byId.set(n.id, n)
      walk(n.children)
      // Subtrees an instance replaced wholesale live inside its overrides.
      for (const override of Object.values(n.descendants ?? {})) walk(override?.children)
    }
  }
  walk(document?.children)
  for (const page of document?.pages ?? []) walk(page.children)
  const resolve = id => {
    const direct = byId.get(id)
    if (direct) return direct
    const cut = id.indexOf('__')
    if (cut < 0) return undefined
    const ref = resolve(id.slice(0, cut))
    const layerId = id.slice(cut + 2)
    const layer = byId.get(layerId)
    if (!ref || !layer) return undefined
    const merged = { ...layer, ...ref.descendants?.[layerId] }
    const component = byId.get(ref.ref)
    const prefix = component?.figmaNodeId ? `I${component.figmaNodeId.replace(/^I/, '')};` : null
    if (prefix && ref.figmaNodeId && merged.figmaNodeId?.startsWith(prefix)) {
      merged.figmaNodeId = `I${ref.figmaNodeId.replace(/^I/, '')};${merged.figmaNodeId.slice(prefix.length)}`
    }
    return merged
  }
  return { size: byId.size, get: resolve }
}

/**
 * Rendered box of a layout node. snapshot_layout reports boxes before
 * transforms, while Figma's absoluteBoundingBox is taken after them: apply the
 * node's own rotation, then each ancestor's rotation and mirroring about that
 * ancestor's box centre (the canvas applies flips outside rotation).
 */
function renderedBox(node, ancestors, docIndex) {
  let points = [[node.x, node.y], [node.x + node.width, node.y],
    [node.x, node.y + node.height], [node.x + node.width, node.y + node.height]]
  for (const owner of [node, ...ancestors]) {
    const doc = docIndex.get(owner.id)
    const cx = owner.x + owner.width / 2
    const cy = owner.y + owner.height / 2
    const radians = (Number(doc?.rotation) || 0) * Math.PI / 180
    if (radians) {
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      points = points.map(([x, y]) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos])
    }
    if (owner !== node && doc?.flipX) points = points.map(([x, y]) => [2 * cx - x, y])
    if (owner !== node && doc?.flipY) points = points.map(([x, y]) => [x, 2 * cy - y])
  }
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/** Multiset difference of visible source texts against imported texts. */
function textParity(sourceTexts, importedTexts) {
  const counts = new Map()
  for (const t of importedTexts) counts.set(t, (counts.get(t) ?? 0) + 1)
  const missing = []
  for (const t of sourceTexts) {
    const left = counts.get(t) ?? 0
    if (left > 0) counts.set(t, left - 1)
    else missing.push(t)
  }
  const extra = [...counts].flatMap(([t, c]) => Array(c).fill(t))
  return {
    expected: sourceTexts.length,
    matched: sourceTexts.length - missing.length,
    missing: missing.slice(0, 20),
    missingCount: missing.length,
    extra: extra.slice(0, 20),
    extraCount: extra.length,
  }
}

export async function compareFigmaFidelity(args, { capture, layout, version, document }) {
  const info = parseFigmaWebUrl(args.url)
  if (!info?.nodeId) throw new FigmaApiError('FIGMA_ARGUMENT', 'Comparison requires a figma.com URL with node-id')
  const token = resolveFigmaToken(args.figmaToken)
  if (!token) throw new FigmaApiError('FIGMA_AUTH', 'Comparison requires figmaToken or FIGMA_TOKEN')
  const scale = Number(args.scale ?? 1)
  const tolerance = Number(args.tolerance ?? 8)
  if (scale < 0.5 || scale > 2 || !Number.isFinite(scale) || !Number.isInteger(tolerance) || tolerance < 0 || tolerance > 64) {
    throw new FigmaApiError('FIGMA_ARGUMENT', 'Invalid comparison scale or tolerance')
  }
  const before = version()
  const body = await figmaFetch(figmaNodesUrl(info.fileKey, [info.nodeId], { geometry: false }), { token, nodeId: info.nodeId })
  const source = body.nodes?.[info.nodeId]?.document
  if (!source) throw new FigmaApiError('FIGMA_NOT_FOUND', 'Figma source node was not found')
  const rootBox = source.absoluteBoundingBox
  const actual = layout()
  if (actual.isError) throw new FigmaApiError('ENGINE_REJECTED', actual.content?.[0]?.text)
  const nodes = []
  const walk = list => {
    for (const n of list ?? []) { nodes.push(n); walk(n.children) }
  }
  walk(actual.structuredContent?.layout)
  const root = nodes.find(n => n.id === args.nodeId)
  if (!root) throw new FigmaApiError('ENGINE_REJECTED', 'Imported node is not on the active page')
  const subtree = []
  const ancestorsOf = new Map()
  const flatten = (n, ancestors) => {
    subtree.push(n)
    ancestorsOf.set(n, ancestors)
    for (const child of n.children ?? []) flatten(child, [n, ...ancestors])
  }
  flatten(root, [])
  const docIndex = documentIndex(document?.())
  const rendered = n => renderedBox(n, ancestorsOf.get(n) ?? [], docIndex)
  const rootBoxRendered = rendered(root)
  const byFigmaId = new Map()
  for (const n of subtree) {
    const figmaId = docIndex.get(n.id)?.figmaNodeId
    if (figmaId && !byFigmaId.has(figmaId)) byFigmaId.set(figmaId, n)
  }
  const structural = []
  const used = new Set()
  const sourceTexts = []
  const compare = (node, insideMerged) => {
    if (node.type === 'TEXT' && typeof node.characters === 'string') sourceTexts.push(renderedCase(node))
    if (insideMerged) return
    // Match by preserved Figma id; names are only a fallback for documents
    // imported before ids were kept (tree order, so repeated names can drift).
    const mapped = node === source
      ? root
      : byFigmaId.get(node.id) ?? (byFigmaId.size ? undefined : subtree.find(n => !used.has(n.id) && n.name === node.name))
    if (mapped) used.add(mapped.id)
    const b = node.absoluteBoundingBox
    if (b && rootBox && mapped) {
      const line = node.type === 'LINE'
      const expected = line
        ? [b.x - rootBox.x, b.y - rootBox.y, Math.max(b.width, b.height)]
        : [b.x - rootBox.x, b.y - rootBox.y, b.width, b.height]
      const seen = rendered(mapped)
      const ox = seen.x - rootBoxRendered.x
      const oy = seen.y - rootBoxRendered.y
      const observed = line
        ? [ox, oy, Math.max(seen.width || 0, seen.height || 0)]
        : [ox, oy, seen.width, seen.height]
      if (expected.some((value, i) => !Number.isFinite(observed[i]) || Math.abs(value - observed[i]) > 0.5)) {
        structural.push({ sourceNodeId: node.id, nodeId: mapped.id, name: node.name, expected, observed })
      }
    } else if (!mapped && !MERGED_PARTS.has(node.type)) {
      structural.push({ sourceNodeId: node.id, name: node.name, reason: 'no-matching-imported-node' })
    }
    const merged = MERGED_PARTS.has(node.type)
    for (const child of node.children ?? []) if (child.visible !== false) compare(child, merged)
  }
  compare(source, false)
  // A text is visible only when it and every ancestor up to the root are.
  const importedTexts = []
  const collectTexts = layoutNode => {
    const node = docIndex.get(layoutNode.id)
    if (node?.visible === false) return
    if (node?.type === 'text') importedTexts.push(textOf(node))
    for (const child of layoutNode.children ?? []) collectTexts(child)
  }
  collectTexts(root)
  const text = docIndex.size ? textParity(sourceTexts, importedTexts) : null
  let visual
  const screenshot = await capture({ nodeId: args.nodeId, scale, maxSize: 4096, background: 'transparent', isolate: true }, before)
  if (screenshot.isError) {
    visual = { comparable: false, reason: screenshot.content?.[0]?.text ?? 'Editor screenshot unavailable' }
  } else {
    const rendered = await figmaFetch(figmaRenderUrl(info.fileKey, [info.nodeId], { scale }), { token, nodeId: info.nodeId })
    const url = rendered.images?.[info.nodeId]
    if (!url) throw new FigmaApiError('FIGMA_RENDER', 'Figma did not return a rendered image')
    const png = await figmaFetch(url, { kind: 'bytes' })
    const image = screenshot.content?.find(c => c.type === 'image')
    if (!image) throw new FigmaApiError('FIGMA_RENDER', 'Editor did not return a PNG')
    visual = diffPng(png, Buffer.from(image.data, 'base64'), tolerance)
  }
  if (version() !== before) throw new FigmaApiError('FIGMA_VERSION_CHANGED', 'Document changed while comparing; run comparison again')
  if (visual.comparable) {
    for (const region of visual.regions) {
      region.nodes = subtree.filter(n => {
        const x = (n.x - root.x) * scale, y = (n.y - root.y) * scale
        return x < region.x + region.width && x + n.width * scale > region.x
          && y < region.y + region.height && y + n.height * scale > region.y
      }).map(n => ({ id: n.id, name: n.name })).slice(0, 20)
    }
  }
  const report = {
    sourceNodeId: info.nodeId, nodeId: args.nodeId, structural, visual, text,
    matchedBy: byFigmaId.size ? 'figmaNodeId' : 'name',
    verified: visual.comparable === true && visual.ratio <= 0.01 && structural.length === 0
      && (!text || (text.missingCount === 0 && text.extraCount === 0)),
    note: 'Pixel ratio includes antialiasing edges. Layers match by preserved Figma id (name order only for older imports); vector parts merged into one path are not counted missing. Text parity compares visible source texts with imported texts. A non-comparable image is never a fidelity pass.',
  }
  return { isError: false, content: [{ type: 'text', text: JSON.stringify(report) }], structuredContent: report }
}
