/** Explicit text fallbacks for imports; retain the source family as first choice. */
const ICON_FAMILY =
  /material\s+(?:icons|symbols)|font\s*awesome|fontawesome|(?:^|[\s_-])(?:icons?|symbols?|dingbats?|icomoon|ionicons|glyphicons|octicons)(?:$|[\s_-])/i;
const GENERIC_FAMILY =
  /(?:^|,)\s*(?:sans-serif|serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|BlinkMacSystemFont)\s*(?:,|$)/i;
const PRIVATE_GLYPH = /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u;

/** Only imported text changes; icon ligatures/private glyphs never get a prose substitute. */
export function withHtmlFontDefaults(value, iconContext = false) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) withHtmlFontDefaults(item, iconContext);
    return;
  }
  const family = value.fontFamily ?? value.styles?.['font-family'] ?? '';
  const content = typeof value.content === 'string' ? value.content : (value.text ?? '');
  const icon =
    iconContext ||
    value.type === 'icon_font' ||
    ICON_FAMILY.test(family) ||
    PRIVATE_GLYPH.test(content);
  for (const [key, item] of Object.entries(value)) {
    if ((key === 'fontFamily' || key === 'font-family') && typeof item === 'string') {
      if (!icon && !item.startsWith('$') && !ICON_FAMILY.test(item) && !GENERIC_FAMILY.test(item)) {
        value[key] = item.trim() ? `${item}, Inter, sans-serif` : 'Inter, sans-serif';
      }
    } else if (item && typeof item === 'object') withHtmlFontDefaults(item, icon);
  }
}
