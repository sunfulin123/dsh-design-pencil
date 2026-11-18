/** Explicit text fallbacks for imports; retain the source family as first choice. */
const GENERIC_FAMILY =
  /(?:^|,)\s*(?:sans-serif|serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|BlinkMacSystemFont)\s*(?:,|$)/i;

/** Recognize icon families and private-use glyphs. This predicate also runs in the browser. */
export function isIconFontGlyph(family, text = '') {
  return (
    /material[\s_-]+(?:icons|symbols)|font\s*awesome|(?:^|[\s_'"-])(?:icons?|symbols?|dingbats?|icomoon|ionicons|glyphicons|octicons)(?:$|[\s_'"-])/i.test(family) ||
    /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(text)
  );
}

/** Only imported text changes; icon ligatures/private glyphs never get a prose substitute. */
export function withHtmlFontDefaults(value, iconContext = false) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) withHtmlFontDefaults(item, iconContext);
    return;
  }
  const family = value.fontFamily ?? value.styles?.['font-family'] ?? '';
  const content = typeof value.content === 'string' ? value.content : (value.text ?? '');
  const icon = iconContext || value.type === 'icon_font' || isIconFontGlyph(family, content);
  for (const [key, item] of Object.entries(value)) {
    if ((key === 'fontFamily' || key === 'font-family') && typeof item === 'string') {
      if (!icon && !item.startsWith('$') && !isIconFontGlyph(item) && !GENERIC_FAMILY.test(item)) {
        value[key] = item.trim() ? `${item}, Inter, sans-serif` : 'Inter, sans-serif';
      }
    } else if (item && typeof item === 'object') withHtmlFontDefaults(item, icon);
  }
}
