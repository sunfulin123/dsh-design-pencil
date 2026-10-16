//! The embedded JavaScript prelude evaluated before every sandboxed script
//! (split out of `script_runner.rs` at the 800-line cap). It defines the
//! `I(parent, obj)` / `K(...)` / `U(nodeId, patch)` recorders plus their
//! normalization helpers (centered-frame expansion, text defaults, icon-name
//! canonicalization, divider re-parenting, foreground-contrast repair), and
//! stubs the unsupported ops + `console`.

pub(super) const PRELUDE: &str = r##"
var __cjkText = /(?:\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul})/u;
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
var __SPACING_GRID = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96, 112, 120, 128, 160];
var __RADIUS_SCALE = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 999, 9999];
var __FONT_SCALE = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 42, 48, 56, 64, 72];
function __snapToScale(val, scale, stepFallback) {
  if (typeof val !== "number" || !Number.isFinite(val)) return val;
  if (val <= 0) return 0;
  var best = scale[0];
  var bestDiff = Math.abs(val - best);
  for (var i = 1; i < scale.length; i++) {
    var diff = Math.abs(val - scale[i]);
    if (diff < bestDiff) {
      best = scale[i];
      bestDiff = diff;
    }
  }
  if (stepFallback > 0 && val > scale[scale.length - 1]) {
    return Math.round(val / stepFallback) * stepFallback;
  }
  return best;
}
function __snapSpacingValue(val) {
  if (typeof val === "number" && Number.isFinite(val)) {
    return __snapToScale(val, __SPACING_GRID, 8);
  }
  if (Array.isArray(val)) {
    return val.map(function (item) {
      return typeof item === "number" && Number.isFinite(item) ? __snapToScale(item, __SPACING_GRID, 8) : item;
    });
  }
  return val;
}
function __snapCornerRadius(val) {
  if (typeof val === "number" && Number.isFinite(val)) {
    if (val >= 100) return val >= 999 ? val : 999;
    return __snapToScale(val, __RADIUS_SCALE, 4);
  }
  if (Array.isArray(val)) {
    return val.map(function (item) {
      return typeof item === "number" && Number.isFinite(item) ? __snapCornerRadius(item) : item;
    });
  }
  return val;
}
function __snapFontSize(val) {
  if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) return 16;
  return __snapToScale(val, __FONT_SCALE, 4);
}
function __normalizeAestheticProps(obj, isPatch) {
  if (typeof __preserveAuthoredGeometry !== "undefined" && __preserveAuthoredGeometry === true) return obj;
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  var out = Object.assign({}, obj);
  if (__hasOwn(out, "gap") && typeof out.gap === "number") {
    out.gap = __snapSpacingValue(out.gap);
  }
  if (__hasOwn(out, "padding")) {
    out.padding = __snapSpacingValue(out.padding);
  }
  if (__hasOwn(out, "cornerRadius")) {
    out.cornerRadius = __snapCornerRadius(out.cornerRadius);
  }
  if (__hasOwn(out, "fontSize") && typeof out.fontSize === "number") {
    out.fontSize = __snapFontSize(out.fontSize);
  }
  if (!isPatch && Array.isArray(out.children)) {
    out.children = out.children.map(function (c) {
      return __normalizeAestheticProps(c, false);
    });
  }
  return out;
}
function __parseOpaqueHex(value) {
  if (typeof value !== "string") return null;
  var hex = value.trim();
  var digits;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    digits = hex.slice(1).replace(/./g, function (ch) { return ch + ch; });
  } else if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    digits = hex.slice(1);
  } else if (/^#[0-9a-fA-F]{8}$/.test(hex) && hex.slice(7).toLowerCase() === "ff") {
    digits = hex.slice(1, 7);
  } else {
    return null;
  }
  return {
    color: hex,
    rgb: [
      parseInt(digits.slice(0, 2), 16),
      parseInt(digits.slice(2, 4), 16),
      parseInt(digits.slice(4, 6), 16)
    ]
  };
}
function __opaqueSolidFill(fill, nodeOpacity) {
  if (typeof nodeOpacity === "number" && nodeOpacity !== 1) return null;
  var paint = fill;
  var shape = "object";
  if (typeof fill === "string") {
    var direct = __parseOpaqueHex(fill);
    return direct == null ? null : { color: direct.color, rgb: direct.rgb, shape: "string" };
  }
  if (Array.isArray(fill)) {
    if (fill.length !== 1) return null;
    paint = fill[0];
    shape = "array";
  }
  if (paint == null || typeof paint !== "object" || Array.isArray(paint)) return null;
  if (typeof paint.type !== "string" || paint.type.toLowerCase() !== "solid") return null;
  if (paint.visible === false || paint.enabled === false) return null;
  if (typeof paint.opacity === "number" && paint.opacity !== 1) return null;
  var parsed = __parseOpaqueHex(paint.color);
  return parsed == null ? null : { color: parsed.color, rgb: parsed.rgb, shape: shape };
}
function __relativeLuminance(rgb) {
  function channel(value) {
    var s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}
function __contrastRatio(a, b) {
  var left = __parseOpaqueHex(a);
  var right = __parseOpaqueHex(b);
  if (left == null || right == null) return null;
  var l1 = __relativeLuminance(left.rgb);
  var l2 = __relativeLuminance(right.rgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function __replaceSolidFill(fill, color) {
  if (typeof fill === "string") return color;
  if (Array.isArray(fill)) {
    var items = fill.slice();
    items[0] = Object.assign({}, items[0], {color: color});
    return items;
  }
  return Object.assign({}, fill, {color: color});
}
function __normalizeForegroundContrast(obj, background) {
  if (background == null || obj == null || typeof obj !== "object") return obj;
  var threshold = obj.type === "text" ? 4.5 : (obj.type === "icon_font" ? 3.0 : null);
  if (threshold == null || !__hasOwn(obj, "fill")) return obj;
  var foreground = __opaqueSolidFill(obj.fill, obj.opacity);
  if (foreground == null) return obj;
  var current = __contrastRatio(foreground.color, background);
  if (current == null || current >= threshold) return obj;
  var dark = __contrastRatio("#17191D", background);
  var light = __contrastRatio("#FAF8F3", background);
  var replacement = dark >= light ? "#17191D" : "#FAF8F3";
  return Object.assign({}, obj, {fill: __replaceSolidFill(obj.fill, replacement)});
}
function __isDivider(obj) {
  if (obj == null || typeof obj !== "object" || typeof obj.name !== "string") return false;
  var name = obj.name.toLowerCase();
  var explicitName = name.indexOf("divider") !== -1
    || name.indexOf("separator") !== -1
    || name.indexOf("分隔") !== -1
    || /rule(?:$|[^a-z])/.test(name);
  return explicitName
    && obj.width === "fill_container"
    && typeof obj.height === "number"
    && obj.height >= 0
    && obj.height <= 2;
}
function __canonicalIconFontName(name) {
  switch (name) {
    case "magnifying-glass": return "search";
    case "snow": return "snowflake";
    case "drop": return "droplet";
    case "cup": return "coffee";
    case "table-lamp": return "lamp-desk";
    default: return name;
  }
}
globalThis.I = function (parent, obj) {
  var recorded = __normalizeAestheticProps(obj, false);
  if (recorded != null && typeof recorded === "object" && recorded.type === "frame" && recorded.layout === "center") {
    var centeredFrame = {layout: "vertical"};
    if (!__hasOwn(recorded, "alignItems")) centeredFrame.alignItems = "center";
    if (!__hasOwn(recorded, "justifyContent")) centeredFrame.justifyContent = "center";
    recorded = Object.assign({}, recorded, centeredFrame);
  } else if (recorded != null && typeof recorded === "object" && recorded.type === "text") {
    var defaults = {};
    if (!Object.prototype.hasOwnProperty.call(recorded, "fontFamily")) defaults.fontFamily = "Inter";
    if (!Object.prototype.hasOwnProperty.call(recorded, "fontSize")) defaults.fontSize = 16;
    if (!Object.prototype.hasOwnProperty.call(recorded, "lineHeight")) {
      defaults.lineHeight = 1.5;
    } else if (typeof recorded.lineHeight === "number" && recorded.lineHeight < 1.3 && __hasCjkContent(recorded.content)) {
      defaults.lineHeight = 1.5;
    }
    if (typeof recorded.height === "number" && recorded.textGrowth !== "fixed-width-height") {
      defaults.height = "fit_content";
    }
    if (Object.keys(defaults).length > 0) recorded = Object.assign({}, recorded, defaults);
  } else if (recorded != null && typeof recorded === "object" && recorded.type === "icon_font" && typeof recorded.iconFontName === "string") {
    var canonicalIconFontName = __canonicalIconFontName(recorded.iconFontName);
    if (canonicalIconFontName !== recorded.iconFontName) {
      recorded = Object.assign({}, recorded, {iconFontName: canonicalIconFontName});
    }
  }
  var effectiveParent = parent == null ? "null" : String(parent);
  var directParent = __insertBindings[effectiveParent];
  if (__isDivider(recorded) && directParent != null && directParent.layout === "horizontal") {
    effectiveParent = directParent.parent;
  }
  var effectiveParentMeta = __insertBindings[effectiveParent];
  var inheritedBackground = effectiveParentMeta == null ? null : effectiveParentMeta.background;
  recorded = __normalizeForegroundContrast(recorded, inheritedBackground);
  var binding = __record(effectiveParent, JSON.stringify(recorded));
  var background = inheritedBackground;
  var isForegroundNode = recorded != null
    && typeof recorded === "object"
    && (recorded.type === "text" || recorded.type === "icon_font");
  if (!isForegroundNode && recorded != null && typeof recorded === "object" && __hasOwn(recorded, "fill")) {
    var ownBackground = __opaqueSolidFill(recorded.fill, recorded.opacity);
    background = ownBackground == null ? null : ownBackground.color;
  }
  var layout = recorded != null && typeof recorded === "object" && typeof recorded.layout === "string"
    ? recorded.layout.toLowerCase()
    : null;
  __insertBindings[binding] = {parent: effectiveParent, background: background, layout: layout};
  return binding;
};
globalThis.K = function (kitComponentId, parent, overrides) {
  return __recordK(JSON.stringify(String(kitComponentId)), parent == null ? "null" : String(parent), JSON.stringify(overrides == null ? {} : __normalizeAestheticProps(overrides, true)));
};
globalThis.U = function (nodeId, patch) {
  __recordU(JSON.stringify(String(nodeId)), JSON.stringify(patch == null ? {} : __normalizeAestheticProps(patch, true)));
  return nodeId;
};
globalThis.UI = {
  Button: function (parent, props) {
    var p = props || {};
    var variant = p.variant || "primary";
    var size = p.size || "md";
    var height = size === "lg" ? 48 : 44;
    var padX = size === "lg" ? 24 : 16;
    var bg = p.fill || (variant === "secondary" ? "#F5F5F4" : variant === "outline" ? "#FFFFFF" : "$--accent");
    var fg = p.textColor || (variant === "secondary" || variant === "outline" ? "$--text-primary" : "$--text-on-accent");
    var btn = globalThis.I(parent, {
      type: "frame",
      name: p.name || (p.label ? String(p.label) + " Button" : "Button"),
      role: "button",
      width: p.width || "fit_content",
      minWidth: Math.max(44, p.minWidth || 96),
      height: height,
      layout: "horizontal",
      gap: 8,
      padding: [0, padX],
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: p.cornerRadius != null ? p.cornerRadius : (size === "lg" ? 12 : 8),
      fill: Array.isArray(bg) ? bg : [{ type: "solid", color: bg }],
      ...(variant === "outline" ? { stroke: { thickness: 1, fill: [{ type: "solid", color: p.borderColor || "$--border" }] } } : {})
    });
    if (p.icon) {
      globalThis.I(btn, {
        type: "icon_font",
        name: String(p.icon) + " icon",
        iconFontName: String(p.icon),
        width: 18,
        height: 18,
        fill: [{ type: "solid", color: fg }]
      });
    }
    globalThis.I(btn, {
      type: "text",
      name: "Button Label",
      content: String(p.label != null ? p.label : "Action"),
      fontSize: size === "lg" ? 16 : 14,
      fontWeight: 600,
      lineHeight: 1.4,
      fill: [{ type: "solid", color: fg }]
    });
    return btn;
  },
  IconButton: function (parent, props) {
    var p = props || {};
    var size = Math.max(44, p.size || 44);
    var iconSize = p.iconSize || 20;
    var btn = globalThis.I(parent, {
      type: "frame",
      name: p.name || (String(p.icon || "icon") + " button"),
      role: "icon-button",
      width: size,
      height: size,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: p.cornerRadius != null ? p.cornerRadius : 8,
      ...(p.fill ? { fill: Array.isArray(p.fill) ? p.fill : [{ type: "solid", color: p.fill }] } : {})
    });
    globalThis.I(btn, {
      type: "icon_font",
      name: String(p.icon || "sparkles") + " icon",
      iconFontName: String(p.icon || "sparkles"),
      width: iconSize,
      height: iconSize,
      fill: [{ type: "solid", color: p.color || "$--text-primary" }]
    });
    return btn;
  },
  Card: function (parent, props) {
    var p = props || {};
    var bg = p.fill || "$--bg-panel";
    var border = p.borderColor || "$--border";
    return globalThis.I(parent, {
      type: "frame",
      name: p.name || "Card",
      role: p.role || "card",
      width: p.width || "fill_container",
      height: p.height || "fit_content",
      layout: p.layout || "vertical",
      gap: p.gap != null ? p.gap : 16,
      padding: p.padding != null ? p.padding : 24,
      cornerRadius: p.cornerRadius != null ? p.cornerRadius : 16,
      fill: Array.isArray(bg) ? bg : [{ type: "solid", color: bg }],
      ...(p.bordered === false ? {} : { stroke: { thickness: 1, fill: [{ type: "solid", color: border }] } })
    });
  },
  Input: function (parent, props) {
    var p = props || {};
    var box = globalThis.I(parent, {
      type: "frame",
      name: p.name || "Input Field",
      role: "searchbox",
      width: p.width || "fill_container",
      height: Math.max(44, p.height || 44),
      layout: "horizontal",
      gap: 8,
      padding: [0, 12],
      alignItems: "center",
      cornerRadius: p.cornerRadius != null ? p.cornerRadius : 8,
      fill: [{ type: "solid", color: p.fill || "$--bg-panel" }],
      stroke: { thickness: 1, fill: [{ type: "solid", color: p.borderColor || "$--border" }] }
    });
    if (p.icon) {
      globalThis.I(box, {
        type: "icon_font",
        name: String(p.icon) + " icon",
        iconFontName: String(p.icon),
        width: 18,
        height: 18,
        fill: [{ type: "solid", color: p.mutedColor || "$--text-muted" }]
      });
    }
    globalThis.I(box, {
      type: "text",
      name: "Input Placeholder",
      content: String(p.placeholder || p.label || "Search..."),
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.4,
      fill: [{ type: "solid", color: p.mutedColor || "$--text-muted" }]
    });
    return box;
  },
  Badge: function (parent, props) {
    var p = props || {};
    var bg = p.fill || "$--accent-highlight";
    var fg = p.textColor || "$--accent";
    var badge = globalThis.I(parent, {
      type: "frame",
      name: p.name || "Badge",
      width: "fit_content",
      height: 28,
      layout: "horizontal",
      gap: 4,
      padding: [4, 12],
      alignItems: "center",
      justifyContent: "center",
      cornerRadius: p.cornerRadius != null ? p.cornerRadius : 999,
      fill: Array.isArray(bg) ? bg : [{ type: "solid", color: bg }]
    });
    globalThis.I(badge, {
      type: "text",
      name: "Badge Label",
      content: String(p.label != null ? p.label : "New"),
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.3,
      fill: [{ type: "solid", color: fg }]
    });
    return badge;
  },
  NavItem: function (parent, props) {
    var p = props || {};
    var active = p.active === true;
    var row = globalThis.I(parent, {
      type: "frame",
      name: p.name || (String(p.label || "Nav") + " Row"),
      role: "nav-link",
      width: p.width || "fill_container",
      minWidth: 44,
      height: Math.max(44, p.height || 44),
      layout: "horizontal",
      gap: 12,
      padding: p.padding || [0, 12],
      alignItems: "center",
      cornerRadius: p.cornerRadius != null ? p.cornerRadius : 8,
      ...(active ? {
        fill: [{ type: "solid", color: p.activeFill || "#F3F0EA" }],
        stroke: { thickness: 1, fill: [{ type: "solid", color: p.activeBorder || "#E2DDD5" }] }
      } : {})
    });
    if (p.icon) {
      globalThis.I(row, {
        type: "icon_font",
        name: String(p.icon) + " icon",
        iconFontName: String(p.icon),
        width: 18,
        height: 18,
        fill: [{ type: "solid", color: active ? (p.activeColor || "$--text-primary") : (p.color || "$--text-muted") }]
      });
    }
    globalThis.I(row, {
      type: "text",
      name: String(p.label || "Item") + " label",
      content: String(p.label || "Item"),
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      lineHeight: 1.4,
      fill: [{ type: "solid", color: active ? (p.activeColor || "$--text-primary") : (p.color || "$--text-muted") }]
    });
    return row;
  },
  SectionHeader: function (parent, props) {
    var p = props || {};
    var header = globalThis.I(parent, {
      type: "frame",
      name: p.name || "Section Header",
      width: "fill_container",
      height: "fit_content",
      layout: p.subtitle ? "vertical" : "horizontal",
      gap: p.subtitle ? 8 : 16,
      justifyContent: p.subtitle ? "start" : "space_between",
      alignItems: p.subtitle ? "start" : "center"
    });
    globalThis.I(header, {
      type: "text",
      name: "Section Title",
      content: String(p.title || "Section"),
      width: p.subtitle ? "fill_container" : "fit_content",
      fontSize: p.fontSize || 32,
      fontWeight: 700,
      lineHeight: 1.2,
      fill: [{ type: "solid", color: p.color || "$--text-primary" }]
    });
    if (p.subtitle) {
      globalThis.I(header, {
        type: "text",
        name: "Section Subtitle",
        content: String(p.subtitle),
        width: "fill_container",
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5,
        fill: [{ type: "solid", color: p.mutedColor || "$--text-muted" }]
      });
    }
    return header;
  }
};
function __unsupported(op) {
  return function () {
    throw new Error("OP_SCRIPT_MODE_UNSUPPORTED: " + op + "() is unavailable in direct QuickJS; use only I(), K(), and authorized U() calls");
  };
}
globalThis.C = __unsupported("C");
globalThis.D = __unsupported("D");
globalThis.M = __unsupported("M");
globalThis.R = __unsupported("R");
globalThis.G = __unsupported("G");
var __noop = function () {};
globalThis.console = { log: __noop, warn: __noop, error: __noop, info: __noop, debug: __noop };
"##;
