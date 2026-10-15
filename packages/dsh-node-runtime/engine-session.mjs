import { spawn } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { isIP } from 'node:net'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import vm from 'node:vm'
import { deflateSync } from 'node:zlib'
import { DocumentStore } from './document-store.mjs'

const require = createRequire(import.meta.url)
const { DesignEngine } = require('./wasm/op_dsh_engine.js')

const VIRTUAL_PROJECT_ORIGIN = 'https://openpencil.local/__op_project__/'
const MAX_SCRIPT_BYTES = 262_144
const MAX_RECORDED_LINES = 4096
const MAX_RECORDED_BYTES = 8 * 1024 * 1024

const SCRIPT_PRELUDE = `
var __cjkText = /(?:\\p{Script=Han}|\\p{Script=Hiragana}|\\p{Script=Katakana}|\\p{Script=Hangul})/u;
function __hasCjkContent(content) {
  if (typeof content === "string") return __cjkText.test(content);
  if (!Array.isArray(content)) return false;
  var text = "";
  for (var i = 0; i < content.length; i++) {
    var segment = content[i];
    if (segment == null || typeof segment !== "object" || typeof segment.text !== "string") return false;
    text += segment.text;
  }
  return __cjkText.test(text);
}
var __insertBindings = Object.create(null);
function __hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function __canonicalIconFontName(name) {
  switch (name) {
    case "magnifying-glass": return "search";
    case "snow": return "snowflake";
    case "drop": return "droplet";
    case "cup": return "coffee";
    case "table-lamp": return "lamp-desk";
    case "sidebar": return "panel-left";
    case "collapse": return "panel-left-close";
    case "expand": return "panel-left-open";
    case "help-circle": return "circle-help";
    case "plus-circle": return "circle-plus";
    case "check-circle": return "circle-check";
    case "alert-circle": return "circle-alert";
    case "x-circle": return "circle-x";
    case "more-horizontal": return "ellipsis";
    case "more-vertical": return "ellipsis-vertical";
    case "edit":
    case "edit-2":
    case "edit-3": return "pen-line";
    case "chat":
    case "chat-bubble": return "message-square";
    case "new-chat": return "message-square-plus";
    case "project":
    case "projects":
    case "workspace": return "folder-open";
    case "plugin":
    case "plugins": return "package";
    case "task":
    case "tasks": return "layers";
    case "gear":
    case "cog": return "settings";
    case "sliders": return "sliders-horizontal";
    default: return name;
  }
}
globalThis.I = function (parent, obj) {
  var recorded = obj;
  if (obj != null && typeof obj === "object" && obj.type === "frame" && obj.layout === "center") {
    var centeredFrame = {layout: "vertical"};
    if (!__hasOwn(obj, "alignItems")) centeredFrame.alignItems = "center";
    if (!__hasOwn(obj, "justifyContent")) centeredFrame.justifyContent = "center";
    recorded = Object.assign({}, obj, centeredFrame);
  } else if (obj != null && typeof obj === "object" && obj.type === "text") {
    var defaults = {};
    if (!__hasOwn(obj, "fontFamily") || obj.fontFamily === "Inter") defaults.fontFamily = "Inter, system-ui, sans-serif";
    if (!__hasOwn(obj, "fontSize")) defaults.fontSize = 16;
    if (!__hasOwn(obj, "lineHeight")) {
      defaults.lineHeight = 1.5;
    } else if (typeof obj.lineHeight === "number" && obj.lineHeight < 1.3 && __hasCjkContent(obj.content)) {
      defaults.lineHeight = 1.5;
    }
    if (typeof obj.height === "number" && obj.textGrowth !== "fixed-width-height") {
      defaults.height = "fit_content";
    }
    if (Object.keys(defaults).length > 0) recorded = Object.assign({}, obj, defaults);
  } else if (obj != null && typeof obj === "object" && obj.type === "icon_font") {
    var iconDefaults = {};
    if (typeof obj.iconFontName === "string") {
      var canonical = __canonicalIconFontName(obj.iconFontName);
      if (canonical !== obj.iconFontName) iconDefaults.iconFontName = canonical;
    }
    if (typeof obj.width !== "number" || !(obj.width > 0)) iconDefaults.width = 20;
    if (typeof obj.height !== "number" || !(obj.height > 0)) iconDefaults.height = 20;
    if (Object.keys(iconDefaults).length > 0) recorded = Object.assign({}, obj, iconDefaults);
  }
  var effectiveParent = parent == null ? "null" : JSON.stringify(String(parent));
  return __record(effectiveParent, JSON.stringify(recorded));
};
globalThis.K = function (kitComponentId, parent, overrides) {
  return __recordK(JSON.stringify(String(kitComponentId)), parent == null ? "null" : JSON.stringify(String(parent)), JSON.stringify(overrides == null ? {} : overrides));
};
globalThis.U = function (nodeId, patch) {
  __recordU(JSON.stringify(String(nodeId)), JSON.stringify(patch == null ? {} : patch));
  return nodeId;
};
globalThis.D = function (nodeId) {
  __recordD(JSON.stringify(String(nodeId)));
  return nodeId;
};
globalThis.M = function (nodeId, parentId, index) {
  __recordM(
    JSON.stringify(String(nodeId)),
    parentId == null ? "null" : JSON.stringify(String(parentId)),
    index === undefined ? undefined : Number(index)
  );
  return nodeId;
};
globalThis.V = function (name, defOrValue, kind) {
  var rawName = String(name == null ? "" : name).trim().replace(/^\$/, "");
  if (!rawName) return "";
  var def = defOrValue;
  if (def == null || typeof def !== "object" || Array.isArray(def)) {
    var inferredType = kind;
    if (!inferredType) {
      if (typeof def === "number") inferredType = "number";
      else if (typeof def === "boolean") inferredType = "boolean";
      else if (typeof def === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(def.trim())) inferredType = "color";
      else if (Array.isArray(def) && def.length > 0 && typeof def[0]?.value === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(def[0].value.trim())) inferredType = "color";
      else if (Array.isArray(def) && def.length > 0 && typeof def[0]?.value === "number") inferredType = "number";
      else inferredType = "string";
    }
    def = { type: inferredType, value: def };
  }
  __recordV(rawName, JSON.stringify(def));
  return "$" + rawName;
};
globalThis.T = function (axis, values) {
  var rawAxis = String(axis == null ? "" : axis).trim();
  if (!rawAxis || !Array.isArray(values)) return "";
  __recordT(rawAxis, JSON.stringify(values.map(String)));
  return rawAxis;
};
function __unsupported(op) {
  return function () {
    throw new Error("OP_SCRIPT_MODE_UNSUPPORTED: " + op + "() is unavailable in direct QuickJS; use only I(), K(), and authorized U() calls");
  };
}
globalThis.C = __unsupported("C");
globalThis.R = __unsupported("R");
globalThis.G = __unsupported("G");
var __noop = function () {};
globalThis.console = { log: __noop, warn: __noop, error: __noop, info: __noop, debug: __noop };
`

export function expandScriptWithVariables(rawScript) {
  const stripped = String(rawScript ?? '')
    .trim()
    .replace(/^```(?:javascript|js|ts)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
  if (!stripped) throw new Error('script must not be empty')
  if (Buffer.byteLength(stripped, 'utf8') > MAX_SCRIPT_BYTES) {
    throw new Error(`script exceeds ${MAX_SCRIPT_BYTES} byte limit`)
  }
  const lines = []
  const variables = {}
  const themes = {}
  let counter = 0
  let bytesUsed = 0
  const pushOp = line => {
    if (lines.length >= MAX_RECORDED_LINES || bytesUsed >= MAX_RECORDED_BYTES) return
    if (bytesUsed + line.length <= MAX_RECORDED_BYTES) {
      bytesUsed += line.length
      lines.push(line)
    } else {
      bytesUsed = MAX_RECORDED_BYTES
    }
  }
  const sandbox = {
    __record(parent, json) {
      const bind = `b${counter++}`
      pushOp(`${bind}=I(${parent}, ${json})`)
      return bind
    },
    __recordK(kit, parent, json) {
      const bind = `b${counter++}`
      pushOp(`${bind}=K(${kit}, ${parent}, ${json})`)
      return bind
    },
    __recordU(nodeId, json) {
      pushOp(`U(${nodeId}, ${json})`)
      return nodeId
    },
    __recordD(nodeId) {
      pushOp(`D(${nodeId})`)
      return nodeId
    },
    __recordM(nodeId, parentId, index) {
      pushOp(index === undefined || !Number.isFinite(index)
        ? `M(${nodeId}, ${parentId})`
        : `M(${nodeId}, ${parentId}, ${Math.max(0, Math.trunc(index))})`)
      return nodeId
    },
    __recordV(name, json) {
      try {
        variables[name] = JSON.parse(json)
      } catch {
        // Ignore malformed variable entry
      }
      return `$${name}`
    },
    __recordT(axis, json) {
      try {
        themes[axis] = JSON.parse(json)
      } catch {
        // Ignore malformed theme entry
      }
      return axis
    },
  }
  const context = vm.createContext(sandbox)
  vm.runInContext(SCRIPT_PRELUDE, context, { timeout: 2000 })
  vm.runInContext(stripped, context, { timeout: 2000 })
  if (lines.length === 0 && Object.keys(variables).length === 0 && Object.keys(themes).length === 0) {
    throw new Error('script recorded no operations')
  }
  return {
    operations: lines.join('\n'),
    variables,
    themes,
  }
}

export function expandScriptToOperations(rawScript) {
  return expandScriptWithVariables(rawScript).operations
}

function collectLocalHtmlResources(html, baseDir) {
  const resources = {}
  if (!baseDir) return resources
  let rootReal
  try {
    rootReal = realpathSync(baseDir)
  } catch {
    return resources
  }
  const refs = new Set()
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1]?.trim()
    if (!raw || /^(?:https?:|data:|blob:|mailto:|javascript:|#)/i.test(raw)) continue
    const clean = raw.split(/[?#]/)[0]?.replace(/^\/+/, '')
    if (clean) refs.add(clean)
  }
  for (const href of refs) {
    try {
      const decoded = decodeURIComponent(href)
      if (!decoded || decoded.includes('\0') || isAbsolute(decoded)) continue
      const candidate = realpathSync(resolve(rootReal, decoded))
      const rel = relative(rootReal, candidate)
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) continue
      const bytes = readFileSync(candidate)
      if (bytes.byteLength <= 4 * 1024 * 1024) {
        const b64 = bytes.toString('base64')
        resources[href] = b64
        resources[decoded] = b64
        resources[`${VIRTUAL_PROJECT_ORIGIN}${href}`] = b64
        resources[`${VIRTUAL_PROJECT_ORIGIN}${decoded}`] = b64
      }
    } catch {
      // Ignore missing or unreadable optional local assets.
    }
  }
  return resources
}

function isRestrictedHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
  ) return true
  const ipKind = isIP(host)
  if (ipKind === 4) {
    const parts = host.split('.').map(Number)
    if (
      parts[0] === 0
      || parts[0] === 10
      || parts[0] === 127
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168)
      || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    ) return true
  } else if (ipKind === 6) {
    if (
      host === '::1'
      || host === '::'
      || host.startsWith('fe80:')
      || host.startsWith('fc')
      || host.startsWith('fd')
      || host.startsWith('::ffff:127.')
    ) return true
  }
  return false
}

function validateExternalUrl(rawUrl, allowLocal = false) {
  let parsed
  try {
    parsed = new URL(String(rawUrl ?? '').trim())
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`)
  }
  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password) {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`)
  }
  if (!allowLocal && isRestrictedHost(parsed.hostname)) {
    throw new Error(`URL host is restricted: ${parsed.hostname}`)
  }
  return parsed
}

async function fetchRemoteHtmlWithResources(rawUrl, { allowLocal = false } = {}) {
  const initialUrl = validateExternalUrl(rawUrl, allowLocal)
  const response = await fetch(initialUrl, { redirect: 'follow', signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${initialUrl.href}`)
  const finalUrl = validateExternalUrl(response.url || initialUrl.href, allowLocal)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('HTML response exceeds 10 MiB limit')
  const html = new TextDecoder('utf-8').decode(bytes)
  const resources = {}
  const refs = new Set()
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1]?.trim()
    if (!raw || /^(?:data:|blob:|mailto:|javascript:|#)/i.test(raw)) continue
    try {
      const resolved = new URL(raw, finalUrl.href).href
      refs.add(resolved)
    } catch {
      // Ignore malformed subresource URLs.
    }
  }
  for (const resourceUrl of [...refs].slice(0, 32)) {
    try {
      const validated = validateExternalUrl(resourceUrl, allowLocal)
      const sub = await fetch(validated, { redirect: 'follow', signal: AbortSignal.timeout(10_000) })
      if (!sub.ok) continue
      const subBytes = Buffer.from(await sub.arrayBuffer())
      if (subBytes.byteLength <= 4 * 1024 * 1024) {
        resources[resourceUrl] = subBytes.toString('base64')
      }
    } catch {
      // Ignore unreachable optional subresources.
    }
  }
  return { html, bytes, finalUrl: finalUrl.href, resources }
}

function parseFigmaWebUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl ?? '').trim())
    if (!/(?:^|\.)figma\.com$/i.test(parsed.hostname)) return null
    const match = /^\/(?:design|file|proto|board)\/([A-Za-z0-9]+)(?:\/([^/?#]+))?/i.exec(parsed.pathname)
    if (!match) return null
    const rawNodeId = parsed.searchParams.get('node-id')
    return {
      fileKey: match[1],
      title: match[2] ? decodeURIComponent(match[2]).replace(/[-_]+/g, ' ') : undefined,
      nodeId: rawNodeId ? rawNodeId.replace(/-/g, ':') : undefined,
    }
  } catch {
    return null
  }
}

function rgbaToHex(color, opacity = 1) {
  if (!color || typeof color !== 'object') return '#000000'
  const r = Math.round(Math.max(0, Math.min(1, Number(color.r ?? 0))) * 255)
  const g = Math.round(Math.max(0, Math.min(1, Number(color.g ?? 0))) * 255)
  const b = Math.round(Math.max(0, Math.min(1, Number(color.b ?? 0))) * 255)
  const a = Math.max(0, Math.min(1, Number(color.a ?? 1) * Number(opacity ?? 1)))
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
  if (a < 0.999) {
    return `${hex}${Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()}`
  }
  return hex
}

function gradientAngleFromHandles(handles) {
  if (!Array.isArray(handles) || handles.length < 2) return 180
  const start = handles[0]
  const end = handles[1]
  if (!start || !end) return 180
  const dx = Number(end.x ?? 0) - Number(start.x ?? 0)
  const dy = Number(end.y ?? 0) - Number(start.y ?? 0)
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return 180
  const deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90)
  return ((deg % 360) + 360) % 360
}

function mapFigmaBlendMode(mode) {
  switch (mode) {
    case 'DARKEN': return 'darken'
    case 'MULTIPLY': return 'multiply'
    case 'COLOR_BURN': return 'color-burn'
    case 'LIGHTEN': return 'lighten'
    case 'SCREEN': return 'screen'
    case 'COLOR_DODGE': return 'color-dodge'
    case 'OVERLAY': return 'overlay'
    case 'SOFT_LIGHT': return 'soft-light'
    case 'HARD_LIGHT': return 'hard-light'
    case 'DIFFERENCE': return 'difference'
    case 'EXCLUSION': return 'exclusion'
    case 'HUE': return 'hue'
    case 'SATURATION': return 'saturation'
    case 'COLOR': return 'color'
    case 'LUMINOSITY': return 'luminosity'
    default: return undefined
  }
}

function mapFigmaScaleMode(scaleMode) {
  switch (scaleMode) {
    case 'FIT': return 'fit'
    case 'CROP': return 'crop'
    case 'TILE': return 'tile'
    case 'STRETCH': return 'stretch'
    default: return 'fill'
  }
}

function mapFigmaPaints(paints, imageRefs) {
  if (!Array.isArray(paints)) return undefined
  const mapped = []
  for (const paint of paints) {
    if (!paint || paint.visible === false) continue
    const opacity = typeof paint.opacity === 'number' && paint.opacity < 0.999
      ? Number(paint.opacity.toFixed(3))
      : undefined
    const blendMode = mapFigmaBlendMode(paint.blendMode)
    if (paint.type === 'SOLID' && paint.color) {
      mapped.push({
        type: 'solid',
        color: rgbaToHex(paint.color, paint.opacity ?? 1),
        ...(blendMode ? { blendMode } : {}),
      })
    } else if (paint.type === 'GRADIENT_LINEAR' && Array.isArray(paint.gradientStops) && paint.gradientStops.length > 0) {
      mapped.push({
        type: 'linear',
        angle: gradientAngleFromHandles(paint.gradientHandlePositions),
        stops: paint.gradientStops.map(stop => ({
          offset: Number(Number(stop.position ?? 0).toFixed(3)),
          color: rgbaToHex(stop.color, 1),
        })),
        ...(opacity !== undefined ? { opacity } : {}),
        ...(blendMode ? { blendMode } : {}),
      })
    } else if (
      (paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND')
      && Array.isArray(paint.gradientStops)
      && paint.gradientStops.length > 0
    ) {
      const center = Array.isArray(paint.gradientHandlePositions) && paint.gradientHandlePositions[0]
        ? paint.gradientHandlePositions[0]
        : { x: 0.5, y: 0.5 }
      mapped.push({
        type: 'radial',
        cx: Number(Number(center.x ?? 0.5).toFixed(3)),
        cy: Number(Number(center.y ?? 0.5).toFixed(3)),
        radius: 0.5,
        stops: paint.gradientStops.map(stop => ({
          offset: Number(Number(stop.position ?? 0).toFixed(3)),
          color: rgbaToHex(stop.color, 1),
        })),
        ...(opacity !== undefined ? { opacity } : {}),
        ...(blendMode ? { blendMode } : {}),
      })
    } else if (paint.type === 'IMAGE' && typeof paint.imageRef === 'string' && paint.imageRef.trim()) {
      const ref = paint.imageRef.trim()
      if (imageRefs) imageRefs.add(ref)
      mapped.push({
        type: 'image',
        url: `__figma_image__:${ref}`,
        mode: mapFigmaScaleMode(paint.scaleMode),
        ...(opacity !== undefined ? { opacity } : {}),
        ...(blendMode ? { blendMode } : {}),
      })
    }
  }
  return mapped.length > 0 ? mapped : undefined
}

function mapFigmaStroke(node, imageRefs) {
  const strokePaints = mapFigmaPaints(node.strokes, imageRefs)
  if (!strokePaints) return undefined
  const weights = node.individualStrokeWeights
  let thickness
  if (weights && typeof weights === 'object') {
    const t = Number(weights.top ?? 0)
    const r = Number(weights.right ?? 0)
    const b = Number(weights.bottom ?? 0)
    const l = Number(weights.left ?? 0)
    if (t > 0 || r > 0 || b > 0 || l > 0) {
      thickness = (t === r && r === b && b === l) ? t : [t, r, b, l]
    }
  }
  if (thickness === undefined) {
    const w = Number(node.strokeWeight ?? 0)
    if (!(w > 0)) return undefined
    thickness = Number(w.toFixed(2))
  }
  const align = node.strokeAlign === 'INSIDE'
    ? 'inside'
    : node.strokeAlign === 'OUTSIDE'
      ? 'outside'
      : node.strokeAlign === 'CENTER'
        ? 'center'
        : undefined
  const join = node.strokeJoin === 'MITER'
    ? 'miter'
    : node.strokeJoin === 'BEVEL'
      ? 'bevel'
      : node.strokeJoin === 'ROUND'
        ? 'round'
        : undefined
  const cap = node.strokeCap === 'ROUND'
    ? 'round'
    : node.strokeCap === 'SQUARE'
      ? 'square'
      : undefined
  const dashPattern = Array.isArray(node.strokeDashes) && node.strokeDashes.length > 0
    ? node.strokeDashes.map(Number).filter(n => Number.isFinite(n) && n >= 0)
    : undefined
  return {
    thickness,
    fill: strokePaints,
    ...(align ? { align } : {}),
    ...(join ? { join } : {}),
    ...(cap ? { cap } : {}),
    ...(dashPattern && dashPattern.length > 0 ? { dashPattern } : {}),
  }
}

function mapFigmaEffects(effects) {
  if (!Array.isArray(effects) || effects.length === 0) return undefined
  const out = []
  for (const effect of effects) {
    if (!effect || effect.visible === false) continue
    const radius = Number(effect.radius ?? 0)
    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      out.push({
        type: 'shadow',
        ...(effect.type === 'INNER_SHADOW' ? { inner: true } : {}),
        offsetX: Number(effect.offset?.x ?? 0),
        offsetY: Number(effect.offset?.y ?? 0),
        blur: Math.max(0, radius),
        spread: Number(effect.spread ?? 0),
        color: effect.color ? rgbaToHex(effect.color, effect.color.a ?? 1) : '#00000040',
      })
    } else if (effect.type === 'LAYER_BLUR') {
      out.push({ type: 'blur', radius: Math.max(0, radius) })
    } else if (effect.type === 'BACKGROUND_BLUR') {
      out.push({ type: 'background_blur', radius: Math.max(0, radius) })
    }
  }
  return out.length > 0 ? out : undefined
}

function mapFigmaCornerRadius(node) {
  if (Array.isArray(node.rectangleCornerRadii) && node.rectangleCornerRadii.length === 4) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii.map(v => Math.max(0, Math.round(Number(v ?? 0))))
    if (tl === 0 && tr === 0 && br === 0 && bl === 0) return undefined
    if (tl === tr && tr === br && br === bl) return tl
    return [tl, tr, br, bl]
  }
  if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
    return Math.round(node.cornerRadius)
  }
  return undefined
}

function mapFigmaRichTextContent(node) {
  const chars = typeof node.characters === 'string' ? node.characters : ''
  if (!chars) return ''
  const overrides = Array.isArray(node.characterStyleOverrides) ? node.characterStyleOverrides : null
  const table = node.styleOverrideTable && typeof node.styleOverrideTable === 'object' ? node.styleOverrideTable : null
  if (!overrides || overrides.length === 0 || !table || Object.keys(table).length === 0) {
    return chars
  }
  const segments = []
  let currentId = overrides[0] ?? 0
  let start = 0
  for (let i = 1; i <= chars.length; i += 1) {
    const sid = i < chars.length ? (overrides[i] ?? 0) : -1
    if (sid !== currentId || i === chars.length) {
      const slice = chars.slice(start, i)
      if (slice.length > 0) {
        const ov = currentId > 0 ? table[String(currentId)] : null
        const seg = { text: slice }
        if (ov && typeof ov === 'object') {
          if (typeof ov.fontFamily === 'string' && ov.fontFamily.trim()) {
            seg.fontFamily = `${ov.fontFamily.trim()}, Inter, system-ui, sans-serif`
          }
          if (typeof ov.fontSize === 'number' && ov.fontSize > 0) {
            seg.fontSize = Math.round(ov.fontSize)
          }
          if (typeof ov.fontWeight === 'number' && ov.fontWeight > 0) {
            seg.fontWeight = ov.fontWeight
          }
          if (ov.italic === true) {
            seg.fontStyle = 'italic'
          }
          if (ov.textDecoration === 'UNDERLINE') seg.underline = true
          if (ov.textDecoration === 'STRIKETHROUGH') seg.strikethrough = true
          const ovFill = Array.isArray(ov.fills)
            ? ov.fills.find(p => p && p.visible !== false && p.type === 'SOLID' && p.color)
            : null
          if (ovFill?.color) {
            seg.fill = rgbaToHex(ovFill.color, ovFill.opacity ?? 1)
          }
        }
        segments.push(seg)
      }
      currentId = sid
      start = i
    }
  }
  const hasStyled = segments.some(s => (
    s.fontFamily !== undefined
    || s.fontSize !== undefined
    || s.fontWeight !== undefined
    || s.fontStyle !== undefined
    || s.fill !== undefined
    || s.underline !== undefined
    || s.strikethrough !== undefined
  ))
  return hasStyled ? segments : chars
}

export function mapFigmaNode(node, parentBox, idCounter, imageRefs) {
  if (!node || typeof node !== 'object' || node.visible === false || Number(node.opacity) === 0) return null
  const box = node.absoluteBoundingBox || node.absoluteRenderBounds || { x: 0, y: 0, width: 100, height: 100 }
  const x = Number(((Number(box.x ?? 0)) - (parentBox ? Number(parentBox.x ?? 0) : 0)).toFixed(2))
  const y = Number(((Number(box.y ?? 0)) - (parentBox ? Number(parentBox.y ?? 0) : 0)).toFixed(2))
  const width = Math.max(1, Number(Number(box.width ?? 100).toFixed(2)))
  const height = Math.max(1, Number(Number(box.height ?? 40).toFixed(2)))
  const id = `figma_${++idCounter.count}`
  const name = typeof node.name === 'string' && node.name.trim() ? node.name.trim() : node.type
  const fill = mapFigmaPaints(node.fills, imageRefs) || mapFigmaPaints(node.background, imageRefs)
  const stroke = mapFigmaStroke(node, imageRefs)
  const effects = mapFigmaEffects(node.effects)
  const cornerRadius = mapFigmaCornerRadius(node)
  const opacity = typeof node.opacity === 'number' && node.opacity < 0.999
    ? Number(node.opacity.toFixed(3))
    : undefined
  const rotation = typeof node.rotation === 'number' && Math.abs(node.rotation) > 0.01
    ? Number((-node.rotation * (180 / Math.PI)).toFixed(2))
    : undefined
  const blendMode = mapFigmaBlendMode(node.blendMode)
  const commonBase = {
    id,
    name,
    x,
    y,
    ...(opacity !== undefined ? { opacity } : {}),
    ...(rotation !== undefined ? { rotation } : {}),
    ...(blendMode ? { blendMode } : {}),
  }

  if (node.type === 'TEXT') {
    const style = node.style || {}
    const textGrowth = style.textAutoResize === 'WIDTH_AND_HEIGHT'
      ? 'auto'
      : style.textAutoResize === 'HEIGHT'
        ? 'fixed-width'
        : 'fixed-width-height'
    const letterSpacing = typeof style.letterSpacing === 'number' && Math.abs(style.letterSpacing) > 0.01
      ? Number(style.letterSpacing.toFixed(2))
      : undefined
    return {
      ...commonBase,
      type: 'text',
      width,
      height,
      content: mapFigmaRichTextContent(node),
      fontFamily: style.fontFamily ? `${style.fontFamily}, Inter, system-ui, sans-serif` : 'Inter, system-ui, sans-serif',
      fontSize: typeof style.fontSize === 'number' && style.fontSize > 0 ? Math.round(style.fontSize) : 16,
      fontWeight: typeof style.fontWeight === 'number' ? style.fontWeight : 400,
      ...(style.italic === true ? { fontStyle: 'italic' } : {}),
      ...(style.textDecoration === 'UNDERLINE' ? { underline: true } : {}),
      ...(style.textDecoration === 'STRIKETHROUGH' ? { strikethrough: true } : {}),
      ...(letterSpacing !== undefined ? { letterSpacing } : {}),
      lineHeight: typeof style.lineHeightPx === 'number' && style.fontSize > 0
        ? Number((style.lineHeightPx / style.fontSize).toFixed(2))
        : 1.4,
      textAlign: typeof style.textAlignHorizontal === 'string' ? style.textAlignHorizontal.toLowerCase() : 'left',
      ...(typeof style.textAlignVertical === 'string'
        ? { textAlignVertical: style.textAlignVertical === 'CENTER' ? 'middle' : style.textAlignVertical.toLowerCase() }
        : {}),
      textGrowth,
      fill: fill ?? [{ type: 'solid', color: '#111827' }],
      ...(stroke ? { stroke } : {}),
      ...(effects ? { effects } : {}),
    }
  }

  if (node.type === 'ELLIPSE') {
    const arc = node.arcData
    const innerRadius = arc && typeof arc.innerRadius === 'number' && arc.innerRadius > 0.001
      ? Number(arc.innerRadius.toFixed(3))
      : undefined
    return {
      ...commonBase,
      type: 'ellipse',
      width,
      height,
      ...(innerRadius !== undefined ? { innerRadius } : {}),
      ...(fill ? { fill } : {}),
      ...(stroke ? { stroke } : {}),
      ...(effects ? { effects } : {}),
    }
  }

  if (node.type === 'LINE') {
    return {
      ...commonBase,
      type: 'line',
      x1: x,
      y1: y,
      x2: Number((x + width).toFixed(2)),
      y2: Number((y + height).toFixed(2)),
      ...(stroke ? { stroke } : fill ? { stroke: { thickness: 1, fill } } : {}),
      ...(effects ? { effects } : {}),
    }
  }

  const rawChildren = Array.isArray(node.children) ? node.children : []
  const isVectorLike = node.type === 'VECTOR'
    || node.type === 'BOOLEAN_OPERATION'
    || node.type === 'STAR'
    || node.type === 'REGULAR_POLYGON'
  if (isVectorLike) {
    const fillGeo = Array.isArray(node.fillGeometry) ? node.fillGeometry.filter(g => g && typeof g.path === 'string' && g.path.trim()) : []
    const strokeGeo = Array.isArray(node.strokeGeometry) ? node.strokeGeometry.filter(g => g && typeof g.path === 'string' && g.path.trim()) : []
    if (fillGeo.length > 0 || strokeGeo.length > 0) {
      const useStrokeOutline = fillGeo.length === 0 && strokeGeo.length > 0
      const chosen = useStrokeOutline ? strokeGeo : fillGeo
      const d = chosen.map(g => g.path.trim()).join(' ')
      const fillRule = chosen[0]?.windingRule === 'EVENODD' ? 'evenodd' : undefined
      return {
        ...commonBase,
        type: 'path',
        width,
        height,
        d,
        ...(fillRule ? { fillRule } : {}),
        ...(useStrokeOutline
          ? { fill: stroke?.fill ?? fill }
          : {
              ...(fill ? { fill } : {}),
              ...(stroke ? { stroke } : {}),
            }),
        ...(effects ? { effects } : {}),
      }
    }
  }

  if (rawChildren.length === 0 && (node.type === 'RECTANGLE' || isVectorLike)) {
    return {
      ...commonBase,
      type: 'rectangle',
      width,
      height,
      ...(cornerRadius !== undefined ? { cornerRadius } : {}),
      ...(fill ? { fill } : {}),
      ...(stroke ? { stroke } : {}),
      ...(effects ? { effects } : {}),
    }
  }

  const children = []
  for (const child of rawChildren) {
    const mapped = mapFigmaNode(child, box, idCounter, imageRefs)
    if (mapped) children.push(mapped)
  }
  const layout = node.layoutMode === 'HORIZONTAL'
    ? 'horizontal'
    : node.layoutMode === 'VERTICAL'
      ? 'vertical'
      : 'none'
  const justifyContent = node.primaryAxisAlignItems === 'CENTER'
    ? 'center'
    : node.primaryAxisAlignItems === 'MAX'
      ? 'end'
      : node.primaryAxisAlignItems === 'SPACE_BETWEEN'
        ? 'space_between'
        : node.primaryAxisAlignItems === 'MIN'
          ? 'start'
          : undefined
  const alignItems = node.counterAxisAlignItems === 'CENTER'
    ? 'center'
    : node.counterAxisAlignItems === 'MAX'
      ? 'end'
      : node.counterAxisAlignItems === 'MIN'
        ? 'start'
        : undefined
  const gap = typeof node.itemSpacing === 'number' && node.itemSpacing > 0 && justifyContent !== 'space_between'
    ? Math.round(node.itemSpacing)
    : undefined
  const padT = Math.round(Number(node.paddingTop ?? 0))
  const padR = Math.round(Number(node.paddingRight ?? 0))
  const padB = Math.round(Number(node.paddingBottom ?? 0))
  const padL = Math.round(Number(node.paddingLeft ?? 0))
  const padding = (padT || padR || padB || padL) ? [padT, padR, padB, padL] : undefined
  const isGroup = node.type === 'GROUP'
  return {
    ...commonBase,
    type: isGroup ? 'group' : 'frame',
    width,
    height,
    ...(isGroup ? {} : { layout }),
    ...(gap !== undefined ? { gap } : {}),
    ...(padding !== undefined ? { padding } : {}),
    ...(justifyContent ? { justifyContent } : {}),
    ...(alignItems ? { alignItems } : {}),
    ...(cornerRadius !== undefined ? { cornerRadius } : {}),
    ...(node.clipsContent === true ? { clipContent: true } : { clipContent: false }),
    ...(node.type === 'COMPONENT' ? { reusable: true } : {}),
    ...(fill ? { fill } : {}),
    ...(stroke ? { stroke } : {}),
    ...(effects ? { effects } : {}),
    children,
  }
}

function guessImageMime(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) return 'image/webp'
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'
  return 'image/png'
}

async function resolveFigmaImageRefs(fileKey, headers, imageRefs, pages) {
  if (!imageRefs || imageRefs.size === 0) return
  try {
    const endpoint = `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/images`
    const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20_000) })
    if (!response.ok) return
    const payload = await response.json()
    const urlMap = payload?.meta?.images
    if (!urlMap || typeof urlMap !== 'object') return
    const resolvedDataUrls = new Map()
    const refsToFetch = [...imageRefs].filter(ref => typeof urlMap[ref] === 'string' && urlMap[ref]).slice(0, 48)
    await Promise.all(refsToFetch.map(async ref => {
      try {
        const imgUrl = urlMap[ref]
        const imgResp = await fetch(imgUrl, { redirect: 'follow', signal: AbortSignal.timeout(15_000) })
        if (!imgResp.ok) {
          resolvedDataUrls.set(ref, imgUrl)
          return
        }
        const bytes = Buffer.from(await imgResp.arrayBuffer())
        if (bytes.byteLength <= 6 * 1024 * 1024) {
          const mime = guessImageMime(bytes)
          resolvedDataUrls.set(ref, `data:${mime};base64,${bytes.toString('base64')}`)
        } else {
          resolvedDataUrls.set(ref, imgUrl)
        }
      } catch {
        if (typeof urlMap[ref] === 'string') resolvedDataUrls.set(ref, urlMap[ref])
      }
    }))
    const rewriteTree = nodes => {
      for (const node of nodes ?? []) {
        if (!node || typeof node !== 'object') continue
        for (const list of [node.fill, node.stroke?.fill]) {
          if (!Array.isArray(list)) continue
          for (const paint of list) {
            if (paint && paint.type === 'image' && typeof paint.url === 'string' && paint.url.startsWith('__figma_image__:')) {
              const ref = paint.url.slice('__figma_image__:'.length)
              paint.url = resolvedDataUrls.get(ref) || urlMap[ref] || ''
            }
          }
        }
        if (Array.isArray(node.children)) rewriteTree(node.children)
      }
    }
    for (const page of pages) {
      rewriteTree(page.children)
    }
  } catch {
    // Non-fatal: keep document structure if image meta fetch fails
  }
}

async function fetchFigmaApiDocument(figmaInfo, token) {
  const headers = { 'X-Figma-Token': token }
  const endpoint = figmaInfo.nodeId
    ? `https://api.figma.com/v1/files/${encodeURIComponent(figmaInfo.fileKey)}/nodes?ids=${encodeURIComponent(figmaInfo.nodeId)}&geometry=paths`
    : `https://api.figma.com/v1/files/${encodeURIComponent(figmaInfo.fileKey)}?geometry=paths`
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(30_000) })
  if (!response.ok) {
    throw new Error(`Figma API returned HTTP ${response.status} for file ${figmaInfo.fileKey}`)
  }
  const payload = await response.json()
  const idCounter = { count: 0 }
  const imageRefs = new Set()
  const pages = []
  let nodeCount = 0
  const countTree = items => items.reduce((sum, item) => sum + 1 + (Array.isArray(item.children) ? countTree(item.children) : 0), 0)

  if (figmaInfo.nodeId && payload.nodes) {
    const roots = []
    for (const entry of Object.values(payload.nodes)) {
      const docNode = entry?.document
      if (!docNode) continue
      if (docNode.type === 'CANVAS' && Array.isArray(docNode.children)) {
        for (const child of docNode.children) {
          const mapped = mapFigmaNode(child, null, idCounter, imageRefs)
          if (mapped) roots.push(mapped)
        }
      } else {
        const mapped = mapFigmaNode(docNode, null, idCounter, imageRefs)
        if (mapped) roots.push(mapped)
      }
    }
    nodeCount = countTree(roots)
    pages.push({ id: 'page_1', name: payload.name || figmaInfo.title || 'Page 1', children: roots })
  } else if (payload.document && Array.isArray(payload.document.children)) {
    for (const [index, canvas] of payload.document.children.entries()) {
      const children = []
      for (const child of canvas.children ?? []) {
        const mapped = mapFigmaNode(child, null, idCounter, imageRefs)
        if (mapped) children.push(mapped)
      }
      if (children.length === 0) continue
      nodeCount += countTree(children)
      pages.push({
        id: `page_${index + 1}`,
        name: canvas.name || `Page ${index + 1}`,
        children,
      })
    }
  }
  if (pages.length === 0 || nodeCount === 0) {
    throw new Error('Figma file returned no importable nodes')
  }
  await resolveFigmaImageRefs(figmaInfo.fileKey, headers, imageRefs, pages)
  const document = {
    version: '1.0',
    name: payload.name || figmaInfo.title || 'Figma Import',
    pages,
    children: pages[0].children,
    editorMeta: { activePageIndex: 0, preserveAuthoredGeometry: true },
  }
  return {
    ok: true,
    document,
    pageCount: pages.length,
    nodeCount,
    warnings: [],
  }
}

function discoverChromiumBinary() {
  if (process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER === '1') return null
  const candidates = [
    process.env.OPENPENCIL_CHROME_PATH,
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && existsSync(candidate.trim())) {
      return candidate.trim()
    }
  }
  return null
}

function guessMimeForPath(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case '.html':
    case '.htm': return 'text/html; charset=utf-8'
    case '.css': return 'text/css; charset=utf-8'
    case '.js':
    case '.mjs': return 'application/javascript; charset=utf-8'
    case '.json': return 'application/json; charset=utf-8'
    case '.svg': return 'image/svg+xml'
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.webp': return 'image/webp'
    case '.gif': return 'image/gif'
    case '.woff2': return 'font/woff2'
    case '.woff': return 'font/woff'
    case '.ttf': return 'font/ttf'
    default: return 'application/octet-stream'
  }
}

async function startLocalHtmlServer(htmlBytes, baseDir) {
  let rootReal = null
  if (baseDir) {
    try {
      rootReal = realpathSync(baseDir)
    } catch {
      rootReal = null
    }
  }
  const server = createServer((req, res) => {
    const rawUrl = (req.url || '/').split(/[?#]/)[0] || '/'
    if (rawUrl === '/' || rawUrl === '/__op_entry__.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(htmlBytes)
      return
    }
    if (!rootReal) {
      res.writeHead(404)
      res.end()
      return
    }
    try {
      const decoded = decodeURIComponent(rawUrl.replace(/^\/+/, ''))
      if (!decoded || decoded.includes('\0') || isAbsolute(decoded)) {
        res.writeHead(403)
        res.end()
        return
      }
      const candidate = realpathSync(resolve(rootReal, decoded))
      const rel = relative(rootReal, candidate)
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
        res.writeHead(403)
        res.end()
        return
      }
      const bytes = readFileSync(candidate)
      res.writeHead(200, { 'Content-Type': guessMimeForPath(candidate), 'Cache-Control': 'no-store' })
      res.end(bytes)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(0, '127.0.0.1', resolveListen)
  })
  const addr = server.address()
  return {
    url: `http://127.0.0.1:${addr.port}/__op_entry__.html`,
    close: () => new Promise(r => server.close(() => r())),
  }
}

async function captureHtmlSnapshotWithBrowser({
  htmlBytes,
  baseDir,
  targetUrl,
  viewportWidth = 1440,
  viewportHeight = 900,
  timeoutMs = 15_000,
}) {
  const chromeBinary = discoverChromiumBinary()
  if (!chromeBinary || typeof WebSocket !== 'function') return null
  const extractorScript = typeof DesignEngine.snapshot_extractor_script === 'function'
    ? DesignEngine.snapshot_extractor_script()
    : null
  if (!extractorScript) return null

  let localServer = null
  let userDataDir = null
  let child = null
  let ws = null
  try {
    const navigateUrl = targetUrl
      ? targetUrl
      : await (async () => {
          localServer = await startLocalHtmlServer(htmlBytes, baseDir)
          return localServer.url
        })()
    userDataDir = await mkdtemp(join(tmpdir(), 'op-headless-chrome-'))
    const vw = Math.max(320, Math.min(3840, Math.round(Number(viewportWidth) || 1440)))
    const vh = Math.max(320, Math.min(4096, Math.round(Number(viewportHeight) || 900)))
    child = spawn(
      chromeBinary,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--hide-scrollbars',
        `--user-data-dir=${userDataDir}`,
        `--window-size=${vw},${vh}`,
        '--remote-debugging-port=0',
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    )

    const browserWsUrl = await new Promise((resolveWs, rejectWs) => {
      const timer = setTimeout(() => rejectWs(new Error('Timed out waiting for DevTools listening endpoint')), 6000)
      let stderrText = ''
      child.stderr.on('data', chunk => {
        stderrText += chunk.toString('utf8')
        const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderrText)
        if (match) {
          clearTimeout(timer)
          resolveWs(match[1])
        }
      })
      child.once('error', err => {
        clearTimeout(timer)
        rejectWs(err)
      })
      child.once('exit', code => {
        clearTimeout(timer)
        rejectWs(new Error(`Headless browser exited early (${code})`))
      })
    })

    const httpBase = browserWsUrl.replace(/^ws:\/\//, 'http://').replace(/\/devtools\/browser\/.*$/, '')
    const targetsResp = await fetch(`${httpBase}/json/list`, { signal: AbortSignal.timeout(4000) })
    const targets = await targetsResp.json()
    const pageTarget = Array.isArray(targets)
      ? targets.find(t => t && t.type === 'page' && typeof t.webSocketDebuggerUrl === 'string')
      : null
    const targetWsUrl = pageTarget?.webSocketDebuggerUrl
    if (!targetWsUrl) return null

    ws = new WebSocket(targetWsUrl)
    await new Promise((resolveOpen, rejectOpen) => {
      const timer = setTimeout(() => rejectOpen(new Error('WebSocket open timeout')), 4000)
      ws.addEventListener('open', () => {
        clearTimeout(timer)
        resolveOpen()
      }, { once: true })
      ws.addEventListener('error', err => {
        clearTimeout(timer)
        rejectOpen(err)
      }, { once: true })
    })

    let nextMsgId = 1
    const pending = new Map()
    let loadFiredResolve = null
    const loadFiredPromise = new Promise(r => { loadFiredResolve = r })

    ws.addEventListener('message', event => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString('utf8'))
        if (msg.method === 'Page.loadEventFired' && loadFiredResolve) {
          loadFiredResolve()
        }
        if (typeof msg.id === 'number' && pending.has(msg.id)) {
          const entry = pending.get(msg.id)
          pending.delete(msg.id)
          if (msg.error) entry.reject(new Error(msg.error.message || 'CDP error'))
          else entry.resolve(msg.result)
        }
      } catch {
        // Ignore malformed CDP frames
      }
    })

    const cdpCall = (method, params = {}) => new Promise((resolveCall, rejectCall) => {
      const id = nextMsgId++
      const timer = setTimeout(() => {
        pending.delete(id)
        rejectCall(new Error(`CDP timeout: ${method}`))
      }, timeoutMs)
      pending.set(id, {
        resolve: res => {
          clearTimeout(timer)
          resolveCall(res)
        },
        reject: err => {
          clearTimeout(timer)
          rejectCall(err)
        },
      })
      ws.send(JSON.stringify({ id, method, params }))
    })

    await cdpCall('Page.enable')
    await cdpCall('Runtime.enable')
    await cdpCall('Emulation.setDeviceMetricsOverride', {
      width: vw,
      height: vh,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await cdpCall('Page.navigate', { url: navigateUrl })
    await Promise.race([
      loadFiredPromise,
      new Promise(r => setTimeout(r, Math.min(8000, timeoutMs))),
    ])

    // Wait for fonts and dynamic CSS (e.g., Tailwind CDN script) to settle, then expand viewport to full scrollHeight
    const measureResult = await cdpCall('Runtime.evaluate', {
      expression: `(async () => {
        try {
          if (document.fonts && document.fonts.ready) {
            await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
          }
        } catch {}
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 120));
        const bodyH = document.body ? document.body.scrollHeight : 0;
        const docH = document.documentElement ? document.documentElement.scrollHeight : 0;
        return Math.max(bodyH, docH, window.innerHeight || 900);
      })()`,
      awaitPromise: true,
      returnByValue: true,
    })
    const fullHeight = Number(measureResult?.result?.value) || vh
    if (fullHeight > vh && fullHeight <= 16_384) {
      await cdpCall('Emulation.setDeviceMetricsOverride', {
        width: vw,
        height: Math.ceil(fullHeight),
        deviceScaleFactor: 1,
        mobile: false,
      })
    }

    const evalSnapshot = await cdpCall('Runtime.evaluate', {
      expression: `(() => {
        globalThis.openpencilSnapshotOptions = { returnOnly: true };
        const snap = ${extractorScript};
        return snap ? JSON.stringify(snap) : null;
      })()`,
      returnByValue: true,
    })
    const snapshotJson = evalSnapshot?.result?.value
    return typeof snapshotJson === 'string' && snapshotJson.startsWith('{') ? snapshotJson : null
  } catch {
    return null
  } finally {
    try { ws?.close() } catch {}
    if (child && child.pid) {
      try { child.kill('SIGKILL') } catch {}
    }
    if (localServer) {
      try { await localServer.close() } catch {}
    }
    if (userDataDir) {
      try { await rm(userDataDir, { recursive: true, force: true }) } catch {}
    }
  }
}

function summarizeImportedDocument(document) {
  const roots = Array.isArray(document?.children)
    ? document.children
    : Array.isArray(document?.pages?.[0]?.children)
      ? document.pages[0].children
      : []
  let autoLayoutFrames = 0
  let semanticRoles = 0
  let iconFontNodes = 0
  const walk = nodes => {
    for (const node of nodes ?? []) {
      if (!node || typeof node !== 'object') continue
      if (node.type === 'frame' && (node.layout === 'horizontal' || node.layout === 'vertical')) {
        autoLayoutFrames += 1
      }
      if (typeof node.role === 'string' && node.role) {
        semanticRoles += 1
      }
      if (node.type === 'icon_font') {
        iconFontNodes += 1
      }
      if (Array.isArray(node.children)) walk(node.children)
    }
  }
  walk(roots)
  const variablesCount = document?.variables && typeof document.variables === 'object'
    ? Object.keys(document.variables).length
    : 0
  return { autoLayoutFrames, semanticRoles, iconFontNodes, variablesCount }
}

export async function convertHtmlToDocument({
  html,
  htmlPath,
  url,
  viewportWidth,
  viewportHeight,
  documentName,
  preferBrowser = true,
  allowLocalUrl = false,
} = {}) {
  let sourceBytes
  let resolvedName = documentName
  let baseUrl
  let baseDir = null
  let remoteUrl = null
  let resources = {}
  if (typeof html === 'string' && html.trim()) {
    sourceBytes = Buffer.from(html, 'utf8')
  } else if (typeof htmlPath === 'string' && htmlPath.trim()) {
    const fullPath = resolve(htmlPath.trim())
    sourceBytes = await readFile(fullPath)
    resolvedName ??= basename(fullPath, extname(fullPath)) || 'HTML Import'
    if (!(sourceBytes.length >= 4 && sourceBytes[0] === 0x50 && sourceBytes[1] === 0x4b)) {
      const text = new TextDecoder('utf-8').decode(sourceBytes)
      baseDir = dirname(fullPath)
      resources = collectLocalHtmlResources(text, baseDir)
      baseUrl = `${VIRTUAL_PROJECT_ORIGIN}document.html`
    }
  } else if (typeof url === 'string' && url.trim()) {
    const validated = validateExternalUrl(url.trim(), allowLocalUrl)
    remoteUrl = validated.href
    resolvedName ??= validated.hostname || 'HTML Import'
  } else {
    throw new Error('html, htmlPath, or url is required')
  }

  const isZip = sourceBytes && sourceBytes.length >= 4 && sourceBytes[0] === 0x50 && sourceBytes[1] === 0x4b
  const height = viewportHeight === undefined || viewportHeight === null || viewportHeight === ''
    ? undefined
    : Number(viewportHeight)
  const width = viewportWidth === undefined || viewportWidth === null || viewportWidth === ''
    ? 1440
    : Number(viewportWidth)

  if (preferBrowser && !isZip) {
    const snapshotJson = await captureHtmlSnapshotWithBrowser({
      htmlBytes: sourceBytes,
      baseDir,
      targetUrl: remoteUrl,
      viewportWidth: Number.isFinite(width) && width > 0 ? width : 1440,
      viewportHeight: Number.isFinite(height) && height > 0 ? height : 900,
    })
    if (snapshotJson) {
      try {
        const parsed = JSON.parse(DesignEngine.convert_snapshot_document(snapshotJson))
        if (parsed && parsed.ok && parsed.document) {
          if (resolvedName) parsed.document.name = resolvedName
          const summary = summarizeImportedDocument(parsed.document)
          return {
            ...parsed,
            renderMode: 'browser-snapshot',
            ...summary,
          }
        }
      } catch {
        // Fall through to static CSS importer if snapshot conversion fails
      }
    }
  }

  if (remoteUrl && !sourceBytes) {
    const fetched = await fetchRemoteHtmlWithResources(remoteUrl, { allowLocal: allowLocalUrl })
    sourceBytes = fetched.bytes
    baseUrl = fetched.finalUrl
    resources = fetched.resources
    resolvedName ??= new URL(fetched.finalUrl).hostname || 'HTML Import'
  }

  const raw = DesignEngine.convert_html_document(
    sourceBytes,
    resolvedName,
    baseUrl,
    Number.isFinite(height) && height > 0 ? height : undefined,
    Object.keys(resources).length > 0 ? JSON.stringify(resources) : undefined,
  )
  const parsed = JSON.parse(raw)
  if (parsed && parsed.document) {
    const summary = summarizeImportedDocument(parsed.document)
    return {
      ...parsed,
      renderMode: 'static-css',
      ...summary,
    }
  }
  return parsed
}

export async function convertFigmaToDocument({
  figPath,
  url,
  bytes,
  bytesBase64,
  fileName,
  figmaToken,
  allowLocalUrl = false,
} = {}) {
  let rawBytes = bytes
  let resolvedName = fileName
  if (!rawBytes && typeof bytesBase64 === 'string' && bytesBase64.trim()) {
    rawBytes = Buffer.from(bytesBase64.trim(), 'base64')
  }
  if (!rawBytes && typeof figPath === 'string' && figPath.trim()) {
    const fullPath = resolve(figPath.trim())
    rawBytes = await readFile(fullPath)
    resolvedName ??= basename(fullPath, extname(fullPath)) || 'Figma Import'
  }
  if (!rawBytes && typeof url === 'string' && url.trim()) {
    const figmaInfo = parseFigmaWebUrl(url.trim())
    if (figmaInfo) {
      const token = (figmaToken || process.env.FIGMA_TOKEN || process.env.FIGMA_ACCESS_TOKEN || '').trim()
      if (!token) {
        throw new Error(
          'Importing a figma.com design link requires a Figma Personal Access Token (pass figmaToken or set FIGMA_TOKEN), or export a local .fig file and pass its path.',
        )
      }
      return fetchFigmaApiDocument(figmaInfo, token)
    }
    const validated = validateExternalUrl(url.trim(), allowLocalUrl)
    const response = await fetch(validated, { redirect: 'follow', signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${validated.href}`)
    rawBytes = Buffer.from(await response.arrayBuffer())
    resolvedName ??= basename(validated.pathname, extname(validated.pathname)) || 'Figma Import'
  }
  if (!rawBytes) {
    throw new Error('figPath, url, or bytesBase64 is required')
  }
  const textSample = Buffer.from(rawBytes.subarray(0, Math.min(rawBytes.length, 2048))).toString('utf8').trimStart()
  if (textSample.startsWith('{') && !textSample.includes('FIGMA_DOCUMENT') && !textSample.includes('"type":"FIGMA"')) {
    const parsed = JSON.parse(Buffer.from(rawBytes).toString('utf8'))
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.children)) {
      return {
        ok: true,
        document: {
          ...parsed,
          editorMeta: { activePageIndex: 0, preserveAuthoredGeometry: true, ...parsed.editorMeta },
        },
        pageCount: Array.isArray(parsed.pages) ? parsed.pages.length : 1,
        nodeCount: parsed.children.length,
        warnings: [],
      }
    }
  }
  const raw = DesignEngine.convert_figma_document(rawBytes, resolvedName || 'Figma Import')
  return JSON.parse(raw)
}

export async function convertSnapshotToDocument({ snapshot, snapshotPath } = {}) {
  let content = snapshot
  if ((typeof content !== 'string' || !content.trim()) && typeof snapshotPath === 'string' && snapshotPath.trim()) {
    content = await readFile(resolve(snapshotPath.trim()), 'utf8')
  }
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('snapshot or snapshotPath is required')
  }
  return JSON.parse(DesignEngine.convert_snapshot_document(content))
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBytes, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([len, crcInput, crc])
}

export function encodeRgbaPng(width, height, rgba) {
  const w = Math.max(1, Math.min(4096, Math.round(width)))
  const h = Math.max(1, Math.min(4096, Math.round(height)))
  const stride = w * 4 + 1
  const raw = Buffer.alloc(stride * h)
  for (let y = 0; y < h; y += 1) {
    const rowStart = y * stride
    raw[rowStart] = 0
    const srcStart = y * w * 4
    rgba.copy(raw, rowStart + 1, srcStart, srcStart + w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const idat = deflateSync(raw, { level: 3 })
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function parseHexColor(raw) {
  if (typeof raw !== 'string') return null
  const hex = raw.trim().replace(/^#/, '')
  if (hex.length === 3) {
    return [
      Number.parseInt(hex[0] + hex[0], 16),
      Number.parseInt(hex[1] + hex[1], 16),
      Number.parseInt(hex[2] + hex[2], 16),
      255,
    ]
  }
  if (hex.length === 6) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      255,
    ]
  }
  if (hex.length === 8) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      Number.parseInt(hex.slice(6, 8), 16),
    ]
  }
  return null
}

function resolveVariableColorString(raw, variables) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('$')) return trimmed
  const varName = trimmed.slice(1)
  const def = variables && typeof variables === 'object' ? variables[varName] : undefined
  if (def && typeof def === 'object') {
    if (typeof def.value === 'string') return def.value
    if (Array.isArray(def.value) && def.value.length > 0 && typeof def.value[0]?.value === 'string') {
      return def.value[0].value
    }
  }
  return null
}

function firstSolidColor(fill, variables) {
  if (typeof fill === 'string') return parseHexColor(resolveVariableColorString(fill, variables))
  if (Array.isArray(fill)) {
    for (const item of fill) {
      if (item && typeof item === 'object' && item.visible !== false && item.enabled !== false && typeof item.color === 'string') {
        const parsed = parseHexColor(resolveVariableColorString(item.color, variables))
        if (parsed) return parsed
      }
    }
  } else if (fill && typeof fill === 'object' && typeof fill.color === 'string') {
    return parseHexColor(resolveVariableColorString(fill.color, variables))
  }
  return null
}

function activePageNodes(document) {
  if (!document || typeof document !== 'object') return []
  const pages = Array.isArray(document.pages) ? document.pages : null
  if (pages && pages.length > 0) {
    const idx = Math.max(0, Math.min(pages.length - 1, Number(document.editorMeta?.activePageIndex ?? 0) || 0))
    const page = pages[idx]
    if (page && Array.isArray(page.children)) return page.children
  }
  return Array.isArray(document.children) ? document.children : []
}

function renderDocumentPreviewPng(document, layoutTree, requestedNodeId) {
  const styleById = new Map()
  const collectStyles = nodes => {
    for (const node of nodes ?? []) {
      if (!node || typeof node !== 'object') continue
      if (typeof node.id === 'string') styleById.set(node.id, node)
      if (Array.isArray(node.children)) collectStyles(node.children)
    }
  }
  const roots = activePageNodes(document)
  collectStyles(roots)

  const layoutRoots = Array.isArray(layoutTree)
    ? layoutTree
    : Array.isArray(layoutTree?.layout)
      ? layoutTree.layout
      : layoutTree && typeof layoutTree === 'object' && typeof layoutTree.id === 'string'
        ? [layoutTree]
        : []

  const findLayoutNode = (items, id) => {
    for (const item of items ?? []) {
      if (!item || typeof item !== 'object') continue
      if (item.id === id) return item
      const child = findLayoutNode(item.children, id)
      if (child) return child
    }
    return null
  }

  const targetLayout = (!requestedNodeId || requestedNodeId === 'root')
    ? layoutRoots[0]
    : (findLayoutNode(layoutRoots, requestedNodeId) ?? layoutRoots[0])
  const targetDocNode = targetLayout?.id ? styleById.get(targetLayout.id) : roots[0]
  const nodeId = targetLayout?.id ?? targetDocNode?.id ?? 'root'
  const rawW = Number(targetLayout?.width ?? targetDocNode?.width ?? 1440)
  const rawH = Number(targetLayout?.height ?? targetDocNode?.height ?? 900)
  const logicalWidth = Number.isFinite(rawW) && rawW > 0 ? Math.min(3840, Math.max(64, Math.round(rawW))) : 1440
  const logicalHeight = Number.isFinite(rawH) && rawH > 0 ? Math.min(3840, Math.max(64, Math.round(rawH))) : 900
  const scale = Math.min(1, 720 / Math.max(logicalWidth, logicalHeight))
  const bmpW = Math.max(64, Math.round(logicalWidth * scale))
  const bmpH = Math.max(64, Math.round(logicalHeight * scale))
  const rgba = Buffer.alloc(bmpW * bmpH * 4)

  const docVariables = document && typeof document === 'object' && document.variables && typeof document.variables === 'object'
    ? document.variables
    : null
  const bg = firstSolidColor(targetDocNode?.fill, docVariables) ?? [244, 240, 232, 255]
  for (let i = 0; i < bmpW * bmpH * 4; i += 4) {
    rgba[i] = bg[0]
    rgba[i + 1] = bg[1]
    rgba[i + 2] = bg[2]
    rgba[i + 3] = 255
  }

  const fillRect = (x, y, w, h, color) => {
    if (!color) return
    const x0 = Math.max(0, Math.min(bmpW, Math.round(x * scale)))
    const y0 = Math.max(0, Math.min(bmpH, Math.round(y * scale)))
    const x1 = Math.max(x0, Math.min(bmpW, Math.round((x + w) * scale)))
    const y1 = Math.max(y0, Math.min(bmpH, Math.round((y + h) * scale)))
    const alpha = (color[3] ?? 255) / 255
    for (let py = y0; py < y1; py += 1) {
      for (let px = x0; px < x1; px += 1) {
        const idx = (py * bmpW + px) * 4
        rgba[idx] = Math.round(color[0] * alpha + rgba[idx] * (1 - alpha))
        rgba[idx + 1] = Math.round(color[1] * alpha + rgba[idx + 1] * (1 - alpha))
        rgba[idx + 2] = Math.round(color[2] * alpha + rgba[idx + 2] * (1 - alpha))
        rgba[idx + 3] = 255
      }
    }
  }

  const originX = Number(targetLayout?.x ?? 0) || 0
  const originY = Number(targetLayout?.y ?? 0) || 0
  const paintLayoutTree = (item, parentX = 0, parentY = 0) => {
    if (!item || typeof item !== 'object') return
    const docNode = styleById.get(item.id)
    if (docNode?.visible === false) return
    const relX = Number(item.x ?? docNode?.x ?? 0) || 0
    const relY = Number(item.y ?? docNode?.y ?? 0) || 0
    const absX = item === targetLayout ? 0 : (relX - originX + parentX * 0)
    const absY = item === targetLayout ? 0 : (relY - originY + parentY * 0)
    const w = Number(item.width ?? docNode?.width ?? 0) || 0
    const h = Number(item.height ?? docNode?.height ?? 0) || 0
    const fill = firstSolidColor(docNode?.fill, docVariables)
    if (w > 0 && h > 0) {
      if (docNode?.type === 'text' || item.type === 'text') {
        const textColor = fill ?? [23, 25, 29, 255]
        const barH = Math.max(4, Math.min(h, Number(docNode?.fontSize ?? 16) * 0.65))
        fillRect(absX, absY + Math.max(0, (h - barH) / 2), w * 0.85, barH, [textColor[0], textColor[1], textColor[2], 190])
      } else if (fill) {
        fillRect(absX, absY, w, h, fill)
      } else if (docNode?.type === 'image' || item.type === 'image') {
        fillRect(absX, absY, w, h, [214, 211, 209, 255])
      }
    }
    if (Array.isArray(item.children)) {
      for (const child of item.children) paintLayoutTree(child, absX, absY)
    }
  }

  if (targetLayout) paintLayoutTree(targetLayout)
  return {
    nodeId,
    width: bmpW,
    height: bmpH,
    bytes: encodeRgbaPng(bmpW, bmpH, rgba),
  }
}

function healOperationsParents(operations, document) {
  if (typeof operations !== 'string' || !operations.trim()) return operations
  const roots = activePageNodes(document)
  if (roots.length === 0) return operations
  const containerIds = new Set()
  const leafParentMap = new Map()
  const nameToContainerId = new Map()
  const walk = (nodes, parentContainerId) => {
    for (const node of nodes ?? []) {
      if (!node || typeof node !== 'object' || typeof node.id !== 'string') continue
      const isContainer = node.type === 'frame' || node.type === 'group' || Array.isArray(node.children)
      if (isContainer) {
        containerIds.add(node.id)
        if (typeof node.name === 'string' && node.name.trim()) {
          const key = node.name.trim().toLowerCase()
          if (!nameToContainerId.has(key)) nameToContainerId.set(key, node.id)
        }
        if (Array.isArray(node.children)) walk(node.children, node.id)
      } else if (parentContainerId) {
        leafParentMap.set(node.id, parentContainerId)
      }
    }
  }
  const rootFrame = roots.find(r => r && (r.type === 'frame' || r.type === 'group')) ?? roots[0]
  const rootId = typeof rootFrame?.id === 'string' ? rootFrame.id : null
  walk(roots, rootId)

  const lines = operations.split('\n')
  const definedBindings = new Set()
  for (const line of lines) {
    const match = /^\s*([A-Za-z_]\w*)\s*=\s*[ICKRMG]\s*\(/.exec(line)
    if (match) definedBindings.add(match[1])
  }

  const resolveParentToken = rawToken => {
    const trimmed = rawToken.trim()
    const unquoted = trimmed.replace(/^["']|["']$/g, '')
    if (definedBindings.has(unquoted)) {
      return unquoted
    }
    if (containerIds.has(unquoted)) {
      return JSON.stringify(unquoted)
    }
    if (
      !unquoted
      || unquoted === 'null'
      || unquoted === 'undefined'
      || unquoted === '0'
      || unquoted === 'root'
      || unquoted === 'document'
    ) {
      return rawToken
    }
    if (leafParentMap.has(unquoted)) {
      return JSON.stringify(leafParentMap.get(unquoted))
    }
    const byName = nameToContainerId.get(unquoted.toLowerCase())
    if (byName) {
      return JSON.stringify(byName)
    }
    if (rootId && /^n\d+$/i.test(unquoted)) {
      return JSON.stringify(rootId)
    }
    return rawToken
  }

  return lines.map(line => {
    const insertMatch = /^(\s*(?:[A-Za-z_]\w*\s*=\s*)?I\s*\(\s*)([^,]+)(,.*)$/s.exec(line)
    if (insertMatch) {
      return `${insertMatch[1]}${resolveParentToken(insertMatch[2])}${insertMatch[3]}`
    }
    const kitMatch = /^(\s*(?:[A-Za-z_]\w*\s*=\s*)?K\s*\(\s*(?:"[^"]*"|'[^']*')\s*,\s*)([^,)]+)(.*)$/s.exec(line)
    if (kitMatch) {
      return `${kitMatch[1]}${resolveParentToken(kitMatch[2])}${kitMatch[3]}`
    }
    return line
  }).join('\n')
}

export class EngineSession {
  #store
  #engine
  #selectedIds = []
  #activePageId = null
  #closed = false

  constructor(document) {
    this.#store = new DocumentStore(document)
    this.#engine = this.#loadEngine(document)
  }

  snapshot() {
    return this.#store.snapshot()
  }

  replace(document, baseVersion, { metadataOnly = false } = {}) {
    this.#assertOpen()
    if (baseVersion !== this.#store.snapshot().version) {
      return this.#store.replace(document, baseVersion, { metadataOnly })
    }
    const next = metadataOnly
      ? { ...this.#store.snapshot().document, editorMeta: document.editorMeta }
      : document
    const engine = this.#loadEngine(next)
    try {
      const result = this.#store.replace(next, baseVersion, { metadataOnly })
      if (result.ok && metadataOnly) {
        this.#engine.update_editor_meta(JSON.stringify(JSON.parse(engine.document_json()).editorMeta))
        this.#applySelectionToEngine(this.#engine, next)
        engine.free()
      } else if (result.ok) {
        this.#engine.free()
        this.#engine = engine
      } else {
        engine.free()
      }
      return result
    } catch (error) {
      engine.free()
      throw error
    }
  }

  callTool(rawName, args = {}) {
    this.#assertOpen()
    const name = String(rawName ?? '').replace(/^(?:synapse_|openpencil_)/, '')
    let normalizedArgs = { ...args }
    try {
      if (name === 'get_screenshot') {
        const layoutReply = JSON.parse(this.#engine.call_tool('snapshot_layout', JSON.stringify({ maxDepth: 12 })))
        const layoutTree = layoutReply?.structuredContent ?? {}
        const rendered = renderDocumentPreviewPng(
          this.#store.snapshot().document,
          layoutTree,
          typeof normalizedArgs.nodeId === 'string' ? normalizedArgs.nodeId.trim() : 'root',
        )
        const base64 = rendered.bytes.toString('base64')
        const metadata = {
          nodeId: rendered.nodeId,
          format: 'png',
          width: rendered.width,
          height: rendered.height,
        }
        return {
          isError: false,
          content: [
            { type: 'image', data: base64, mimeType: 'image/png' },
            { type: 'text', text: JSON.stringify(metadata) },
          ],
          structuredContent: metadata,
        }
      }
      let batchVariables = normalizedArgs.variables && typeof normalizedArgs.variables === 'object'
        ? { ...normalizedArgs.variables }
        : {}
      let batchThemes = normalizedArgs.themes && typeof normalizedArgs.themes === 'object'
        ? { ...normalizedArgs.themes }
        : {}
      delete normalizedArgs.variables
      delete normalizedArgs.themes
      if (name === 'batch_design' && typeof normalizedArgs.script === 'string' && normalizedArgs.script.trim() !== '') {
        if (
          (typeof normalizedArgs.operations === 'string' && normalizedArgs.operations.trim() !== '')
          || (typeof normalizedArgs.nodes_json === 'string' && normalizedArgs.nodes_json.trim() !== '')
        ) {
          return { isError: true, content: [{ type: 'text', text: 'Provide only one of script, operations, or nodes_json' }] }
        }
        const expanded = expandScriptWithVariables(normalizedArgs.script)
        delete normalizedArgs.script
        normalizedArgs.operations = expanded.operations
        batchVariables = { ...batchVariables, ...expanded.variables }
        batchThemes = { ...batchThemes, ...expanded.themes }
      }
      if (name === 'batch_design') {
        const hasVars = Object.keys(batchVariables).length > 0
        const hasThemes = Object.keys(batchThemes).length > 0
        const beforeVarsDoc = (hasVars || hasThemes) ? this.#engine.document_json() : null
        if (hasThemes) {
          this.#engine.call_tool('set_themes', JSON.stringify({ themes: batchThemes, replace: false }))
        }
        if (hasVars) {
          this.#engine.call_tool('set_variables', JSON.stringify({ variables: batchVariables, replace: false }))
        }
        if ((hasVars || hasThemes) && (!normalizedArgs.operations || normalizedArgs.operations.trim() === '')) {
          const afterVarsDoc = this.#engine.document_json()
          if (beforeVarsDoc !== afterVarsDoc) {
            const snapshot = this.#store.snapshot()
            const document = JSON.parse(afterVarsDoc)
            const merged = {
              ...snapshot.document,
              ...document,
              editorMeta: { ...snapshot.document.editorMeta, ...document.editorMeta },
            }
            this.#store.replace(merged, snapshot.version)
          }
          const value = {
            results: [],
            variablesUpdated: Object.keys(batchVariables).length,
            themesUpdated: Object.keys(batchThemes).length,
          }
          return {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify(value) }],
            structuredContent: value,
          }
        }
      }
      if (name === 'batch_design' && typeof normalizedArgs.operations === 'string' && normalizedArgs.operations.trim() !== '') {
        normalizedArgs.operations = healOperationsParents(normalizedArgs.operations, this.#store.snapshot().document)
      } else if (name === 'import_svg' && !normalizedArgs.svg && (normalizedArgs.svgPath || normalizedArgs.svg_path)) {
        const svgPath = resolve(String(normalizedArgs.svgPath ?? normalizedArgs.svg_path))
        normalizedArgs.svg = readFileSync(svgPath, 'utf8')
      } else if (name === 'import_web_snapshot' && !normalizedArgs.snapshot && (normalizedArgs.snapshotPath || normalizedArgs.snapshot_path)) {
        const snapshotPath = resolve(String(normalizedArgs.snapshotPath ?? normalizedArgs.snapshot_path))
        normalizedArgs.snapshot = readFileSync(snapshotPath, 'utf8')
      } else if (name === 'import_html' && !normalizedArgs.html && (normalizedArgs.htmlPath || normalizedArgs.html_path)) {
        const htmlPath = resolve(String(normalizedArgs.htmlPath ?? normalizedArgs.html_path))
        const rawBytes = readFileSync(htmlPath)
        const docName = normalizedArgs.documentName || basename(htmlPath, extname(htmlPath))
        if (rawBytes.length >= 4 && rawBytes[0] === 0x50 && rawBytes[1] === 0x4b) {
          const height = normalizedArgs.viewportHeight === undefined ? undefined : Number(normalizedArgs.viewportHeight)
          const converted = JSON.parse(
            DesignEngine.convert_html_document(
              rawBytes,
              docName,
              undefined,
              Number.isFinite(height) && height > 0 ? height : undefined,
              undefined,
            ),
          )
          const current = this.#store.snapshot()
          const replaced = this.replace(converted.document, current.version)
          if (!replaced.ok) {
            return { isError: true, content: [{ type: 'text', text: 'Failed to apply imported HTML zip document' }] }
          }
          const value = {
            wrote: 'true',
            nodeCount: String(converted.nodeCount),
            warnings: converted.warnings ?? [],
          }
          return {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify(value) }],
            structuredContent: value,
          }
        }
        const html = new TextDecoder('utf-8').decode(rawBytes)
        const resources = collectLocalHtmlResources(html, dirname(htmlPath))
        normalizedArgs.html = html
        normalizedArgs.documentName ??= docName
        if (Object.keys(resources).length > 0) {
          normalizedArgs.resourcesJson = JSON.stringify(resources)
        }
      } else if (name === 'import_figma' && !normalizedArgs.bytesBase64 && (normalizedArgs.figPath || normalizedArgs.filePath || normalizedArgs.fig_path)) {
        const figPath = resolve(String(normalizedArgs.figPath ?? normalizedArgs.filePath ?? normalizedArgs.fig_path))
        normalizedArgs.bytesBase64 = readFileSync(figPath).toString('base64')
        normalizedArgs.fileName ??= basename(figPath, extname(figPath))
      }
      if (name === 'import_figma' && normalizedArgs.bytesBase64 && !normalizedArgs.parent && !normalizedArgs.pageId) {
        const current = this.#store.snapshot()
        const isEmpty = (!Array.isArray(current.document.children) || current.document.children.length === 0)
          && (!Array.isArray(current.document.pages) || current.document.pages.every(p => !Array.isArray(p.children) || p.children.length === 0))
        if (isEmpty) {
          const rawBytes = Buffer.from(String(normalizedArgs.bytesBase64).trim(), 'base64')
          const converted = JSON.parse(
            DesignEngine.convert_figma_document(rawBytes, normalizedArgs.fileName || 'Figma Import'),
          )
          const replaced = this.replace(converted.document, current.version)
          if (!replaced.ok) {
            return { isError: true, content: [{ type: 'text', text: 'Failed to apply imported Figma document' }] }
          }
          const value = {
            wrote: 'true',
            pageCount: converted.pageCount,
            nodeCount: converted.nodeCount,
            warnings: converted.warnings ?? [],
          }
          return {
            isError: false,
            content: [{ type: 'text', text: JSON.stringify(value) }],
            structuredContent: value,
          }
        }
      }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] }
    }
    return this.#invokeEngineTool(name, normalizedArgs)
  }

  async callToolAsync(rawName, args = {}) {
    this.#assertOpen()
    const name = String(rawName ?? '').replace(/^(?:synapse_|openpencil_)/, '')
    if (name === 'import_html_url' && typeof args.url === 'string' && args.url.trim()) {
      try {
        const snapshotJson = await captureHtmlSnapshotWithBrowser({
          targetUrl: validateExternalUrl(args.url.trim()).href,
          viewportWidth: args.viewportWidth ?? 1440,
          viewportHeight: args.viewportHeight ?? 900,
        })
        if (snapshotJson) {
          return this.#invokeEngineTool('import_web_snapshot', {
            ...args,
            snapshot: snapshotJson,
          })
        }
        const fetched = await fetchRemoteHtmlWithResources(args.url.trim())
        return this.#invokeEngineTool('import_html_url', {
          ...args,
          html: fetched.html,
          baseUrl: fetched.finalUrl,
          sourceUrl: fetched.finalUrl,
          ...(Object.keys(fetched.resources).length > 0 ? { resourcesJson: JSON.stringify(fetched.resources) } : {}),
        })
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] }
      }
    }
    if (name === 'import_figma' && typeof args.url === 'string' && args.url.trim() && !args.bytesBase64) {
      try {
        const converted = await convertFigmaToDocument({
          url: args.url.trim(),
          fileName: args.fileName,
          figmaToken: args.figmaToken,
        })
        const current = this.#store.snapshot()
        const replaced = this.replace(converted.document, current.version)
        if (!replaced.ok) {
          return { isError: true, content: [{ type: 'text', text: 'Failed to apply imported Figma document' }] }
        }
        const value = {
          wrote: 'true',
          pageCount: converted.pageCount,
          nodeCount: converted.nodeCount,
          warnings: converted.warnings ?? [],
        }
        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(value) }],
          structuredContent: value,
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] }
      }
    }
    return this.callTool(name, args)
  }

  #invokeEngineTool(name, args) {
    const before = this.#engine.document_json()
    const result = JSON.parse(this.#engine.call_tool(name, JSON.stringify(args)))
    const after = this.#engine.document_json()
    if (name === 'clear_selection') {
      this.#selectedIds = []
    } else if (name === 'set_selection_set' || name === 'select_nodes' || name === 'select_by_type') {
      const sel = JSON.parse(this.#engine.call_tool('get_selection', JSON.stringify({ readDepth: 0 })))?.structuredContent
      if (Array.isArray(sel?.selectedIds)) this.#selectedIds = sel.selectedIds
    }
    if (before !== after) {
      const snapshot = this.#store.snapshot()
      const document = JSON.parse(after)
      const merged = {
        ...snapshot.document,
        ...document,
        editorMeta: { ...snapshot.document.editorMeta, ...document.editorMeta },
      }
      this.#store.replace(merged, snapshot.version)
      if (this.#selectedIds.length > 0 && name !== 'clear_selection') {
        this.#applySelectionToEngine(this.#engine, merged)
      }
    }
    if (name === 'get_selection' && !result.isError && Array.isArray(result.structuredContent?.nodes) && result.structuredContent.nodes.length > 0) {
      try {
        const layoutReply = JSON.parse(this.#engine.call_tool('snapshot_layout', JSON.stringify({ maxDepth: 16 })))
        const layoutById = new Map()
        const parentById = new Map()
        const indexLayout = (items, parent = null) => {
          for (const item of items ?? []) {
            if (!item || typeof item !== 'object') continue
            if (typeof item.id === 'string') {
              layoutById.set(item.id, item)
              if (parent && typeof parent.id === 'string') {
                parentById.set(item.id, { id: parent.id, name: parent.name ?? '', type: parent.type ?? 'frame' })
              }
            }
            if (Array.isArray(item.children)) indexLayout(item.children, item)
          }
        }
        indexLayout(layoutReply?.structuredContent?.layout)
        const enrichNode = node => {
          if (!node || typeof node !== 'object' || typeof node.id !== 'string') return node
          const layout = layoutById.get(node.id)
          const parent = parentById.get(node.id)
          const next = { ...node }
          if (typeof next.width === 'string') next.sizingWidth = next.width
          if (typeof next.height === 'string') next.sizingHeight = next.height
          if (layout) {
            if (typeof layout.x === 'number' && Number.isFinite(layout.x)) next.x = Math.round(layout.x)
            if (typeof layout.y === 'number' && Number.isFinite(layout.y)) next.y = Math.round(layout.y)
            if (typeof layout.width === 'number' && Number.isFinite(layout.width)) next.width = Math.round(layout.width)
            if (typeof layout.height === 'number' && Number.isFinite(layout.height)) next.height = Math.round(layout.height)
          }
          if (parent) {
            next.parentId = parent.id
            if (parent.name) next.parentName = parent.name
          }
          if (Array.isArray(next.children)) {
            next.children = next.children.map(enrichNode)
          }
          return next
        }
        result.structuredContent.nodes = result.structuredContent.nodes.map(enrichNode)
        result.content = [{ type: 'text', text: JSON.stringify(result.structuredContent) }]
      } catch {
        // Keep un-enriched selection if layout snapshot fails
      }
    }
    return result
  }

  listTools() {
    this.#assertOpen()
    return JSON.parse(this.#engine.tools_json())
  }

  getSelection() {
    this.#assertOpen()
    const result = JSON.parse(this.#engine.call_tool('get_selection', JSON.stringify({ readDepth: 0 })))
    const content = result.structuredContent ?? {}
    return {
      selectedIds: Array.isArray(content.selectedIds) ? content.selectedIds : [],
      activePageId: typeof content.activePageId === 'string' ? content.activePageId : null,
    }
  }

  setSelection(body) {
    this.#assertOpen()
    if (!body || typeof body !== 'object' || !Array.isArray(body.selectedIds)) {
      throw new Error('Missing selectedIds array')
    }
    const ids = body.selectedIds.filter(id => typeof id === 'string' && id.trim() !== '').map(id => id.trim())
    const pageId = typeof body.activePageId === 'string' && body.activePageId.trim() !== ''
      ? body.activePageId.trim()
      : undefined
    this.#selectedIds = ids
    if (pageId !== undefined) this.#activePageId = pageId
    this.#applySelectionToEngine(this.#engine, this.#store.snapshot().document)
    return { ok: true }
  }

  #applySelectionToEngine(engine, document) {
    if (this.#activePageId !== null) {
      const pages = document?.pages
      if (Array.isArray(pages)) {
        const index = pages.findIndex(page => page && page.id === this.#activePageId)
        if (index >= 0) {
          engine.call_tool('set_active_page', JSON.stringify({ index: String(index) }))
        }
      }
    }
    engine.call_tool('set_selection_set', JSON.stringify({ node_ids: this.#selectedIds.join(',') }))
    const sel = JSON.parse(engine.call_tool('get_selection', JSON.stringify({ readDepth: 0 })))?.structuredContent
    if (Array.isArray(sel?.selectedIds)) {
      this.#selectedIds = sel.selectedIds
    }
  }

  close() {
    if (!this.#closed) {
      this.#closed = true
      this.#engine.free()
    }
  }

  #loadEngine(document) {
    const engine = new DesignEngine()
    try {
      engine.load_document(JSON.stringify(document))
      if (this.#selectedIds.length > 0 || this.#activePageId !== null) {
        this.#applySelectionToEngine(engine, document)
      }
      return engine
    } catch (error) {
      engine.free()
      throw error
    }
  }

  #assertOpen() {
    if (this.#closed) throw new Error('Design session is closed')
  }
}