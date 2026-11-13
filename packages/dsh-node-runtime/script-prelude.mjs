export const SCRIPT_PRELUDE = `
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
  if (__preserveAuthoredGeometry === true) return obj;
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  if (isPatch) return Object.assign({}, obj);
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
function __applyNodeDefaults(node) {
  if (node == null || typeof node !== "object" || Array.isArray(node)) return node;
  var recorded = node;
  if (recorded.type === "frame" && recorded.layout === "center") {
    var centeredFrame = {layout: "vertical"};
    if (!__hasOwn(recorded, "alignItems")) centeredFrame.alignItems = "center";
    if (!__hasOwn(recorded, "justifyContent")) centeredFrame.justifyContent = "center";
    recorded = Object.assign({}, recorded, centeredFrame);
  } else if (recorded.type === "text") {
    var defaults = {};
    var bodyFallback = (typeof __defaultFontFamily === "string" && __defaultFontFamily)
      ? __defaultFontFamily
      : "Inter, system-ui, sans-serif";
    var headingFallback = (typeof __headingFontFamily === "string" && __headingFontFamily)
      ? __headingFontFamily
      : bodyFallback;
    var resolvedFontSize = __hasOwn(recorded, "fontSize") && typeof recorded.fontSize === "number" ? recorded.fontSize : 16;
    if (!__hasOwn(recorded, "fontFamily")) {
      defaults.fontFamily = resolvedFontSize >= 24 ? headingFallback : bodyFallback;
    } else if (recorded.fontFamily === "Inter") {
      defaults.fontFamily = "Inter, system-ui, sans-serif";
    }
    if (!__hasOwn(recorded, "fontSize")) defaults.fontSize = 16;
    if (!__hasOwn(recorded, "lineHeight")) {
      defaults.lineHeight = 1.5;
    } else if (typeof recorded.lineHeight === "number" && recorded.lineHeight < 1.3 && __hasCjkContent(recorded.content)) {
      defaults.lineHeight = 1.5;
    }
    if (typeof recorded.height === "number" && recorded.textGrowth !== "fixed-width-height") {
      defaults.height = "fit_content";
    }
    if (Object.keys(defaults).length > 0) recorded = Object.assign({}, recorded, defaults);
  } else if (recorded.type === "icon_font") {
    var iconDefaults = {};
    if (typeof recorded.iconFontName === "string") {
      var canonical = __canonicalIconFontName(recorded.iconFontName);
      if (canonical !== recorded.iconFontName) iconDefaults.iconFontName = canonical;
    }
    if (typeof recorded.width !== "number" || !(recorded.width > 0)) iconDefaults.width = 20;
    if (typeof recorded.height !== "number" || !(recorded.height > 0)) iconDefaults.height = 20;
    if (Object.keys(iconDefaults).length > 0) recorded = Object.assign({}, recorded, iconDefaults);
  }
  if (Array.isArray(recorded.children)) {
    recorded = Object.assign({}, recorded, {
      children: recorded.children.map(__applyNodeDefaults)
    });
  }
  return recorded;
}
globalThis.I = function (parent, obj) {
  var recorded = __applyNodeDefaults(__normalizeAestheticProps(obj, false));
  var effectiveParent = parent == null ? "null" : JSON.stringify(String(parent));
  return __record(effectiveParent, JSON.stringify(recorded));
};
globalThis.K = function (kitComponentId, parent, overrides) {
  return __recordK(JSON.stringify(String(kitComponentId)), parent == null ? "null" : JSON.stringify(String(parent)), JSON.stringify(overrides == null ? {} : __normalizeAestheticProps(overrides, true)));
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
  var rawName = String(name == null ? "" : name).trim().replace(/^[$]/, "");
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
globalThis.C = function (sourceId, parent, overrides) {
  return __recordC(
    JSON.stringify(String(sourceId)),
    parent == null ? "null" : JSON.stringify(String(parent)),
    JSON.stringify(overrides == null ? {} : __normalizeAestheticProps(overrides, true))
  );
};
globalThis.R = function (targetId, nodeObj) {
  return __recordR(
    JSON.stringify(String(targetId)),
    JSON.stringify(nodeObj == null ? {} : __applyNodeDefaults(__normalizeAestheticProps(nodeObj, false)))
  );
};
function __unsupported(op) {
  return function () {
    throw new Error("OP_SCRIPT_MODE_UNSUPPORTED: " + op + "() is unavailable in direct QuickJS; use I(), K(), C(), R(), M(), D(), and U()");
  };
}
globalThis.G = __unsupported("G");
var __noop = function () {};
globalThis.console = { log: __noop, warn: __noop, error: __noop, info: __noop, debug: __noop };
`;
