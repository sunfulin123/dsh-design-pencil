// Font faces used by a document's text, in the inventory shape the REST
// import produces (`{family, weight, italic}`), so `.fig` imports can fetch
// and register the same fonts.

const NAMED_WEIGHTS = { normal: 400, regular: 400, bold: 700 }

function weightOf(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return Math.round(numeric)
    return NAMED_WEIGHTS[value.toLowerCase()] ?? 400
  }
  return 400
}

/** First family of a CSS-style stack, unquoted; generic families are skipped. */
function primaryFamily(stack) {
  if (typeof stack !== 'string') return null
  const first = stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '')
  if (!first || /^(system-ui|sans-serif|serif|monospace|cursive|fantasy)$/i.test(first)) return null
  return first
}

/** Collect the distinct font faces used by text nodes under `roots`. */
export function collectDocumentFonts(document) {
  const faces = new Map()
  const add = (family, weight, style) => {
    const name = primaryFamily(family)
    if (!name) return
    const face = { family: name, weight: weightOf(weight), italic: style === 'italic' }
    faces.set(`${face.family}|${face.weight}|${face.italic}`, face)
  }
  const walk = list => {
    for (const node of list ?? []) {
      if (node?.type === 'text') {
        add(node.fontFamily, node.fontWeight, node.fontStyle)
        if (Array.isArray(node.content)) {
          for (const segment of node.content) {
            add(segment?.fontFamily ?? node.fontFamily, segment?.fontWeight ?? node.fontWeight, segment?.fontStyle ?? node.fontStyle)
          }
        }
      }
      walk(node?.children)
    }
  }
  walk(document?.children)
  for (const page of document?.pages ?? []) walk(page.children)
  return [...faces.values()]
}
