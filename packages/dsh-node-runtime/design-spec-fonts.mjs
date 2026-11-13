/**
 * Extract DESIGN-specified heading/display and body/UI font families from `document.designMd`.
 *
 * Supports structured `designMd.typography`, YAML frontmatter `typography:` blocks,
 * and Markdown `## Typography` sections (role bullets, font-family tables, and
 * hierarchy font columns) while strictly ignoring non-typography prose sections.
 */

const GENERIC_FAMILY = /^(?:system-ui|ui-sans-serif|ui-serif|ui-monospace|sans-serif|serif|monospace|cursive|fantasy|-apple-system|blinkmacsystemfont)$/iu;
const NON_FONT_TOKEN = /^(?:none|default|system|sans|serif|mono|monospace|regular|normal|medium|semibold|bold|black|light|thin|italic|px|rem|em|auto|inherit|initial|fallback|fallbacks|display|heading|headings|headline|title|body|ui|text|base|universal)$/iu;
const NUMERIC_UNIT = /^\d+(?:\.\d+)?(?:px|rem|em|pt|%|vh|vw|ch|ex|x|w)?$/iu;
const PROSE_LEADING = /^(?:a|an|the|no|all|any|every|each|use|used|using|set|same|see|custom|primary|secondary|single|full|full-width|two|three|four)\b/iu;
const PROSE_WORDS = /\b(?:in|on|at|with|for|from|by|to|into|over|under|panel|panels|hero|card|cards|section|sections|button|buttons|layout|width|height|weight|weights|tracking|leading|size|sizes|italic|variants?|features?|tokens?|scale|table|column|columns|row|rows)\b/iu;
const HEADING_ROLE = /\b(?:display|hero|heading|headings|headline|title|h[1-3])\b/iu;
const BODY_ROLE = /\b(?:body|ui|base|primary|text|default|universal|workhorse|paragraph|sans)\b/iu;
const MONO_OR_DECOR_ROLE = /\b(?:mono|monospace|code|script|cursive|eyebrow|kicker|caption|legal|secondary)\b/iu;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function familyKey(family) {
  return family.trim().toLowerCase();
}

export function concreteFamilies(stack) {
  if (typeof stack !== 'string') return [];
  return stack
    .split(',')
    .map((part) => part.trim().replace(/^['"`]+|['"`]+$/gu, '').trim())
    .filter((part) => part !== '' && !GENERIC_FAMILY.test(part));
}

export function isValidFontFamilyName(raw) {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 44 || !/[A-Za-z]/u.test(trimmed)) return false;
  if (NON_FONT_TOKEN.test(trimmed) || NUMERIC_UNIT.test(trimmed) || PROSE_LEADING.test(trimmed) || PROSE_WORDS.test(trimmed)) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9 .+-]*$/u.test(trimmed)) return false;
  const words = trimmed.split(/\s+/u);
  if (words.length > 4) return false;
  return true;
}

function parseFontStackValue(raw) {
  if (typeof raw !== 'string') return undefined;
  let cleaned = raw.trim();
  const codeSpans = [...cleaned.matchAll(/`([^`]+)`/gu)].map((m) => m[1].trim());
  if (codeSpans.length > 0) {
    cleaned = codeSpans
      .filter((span) => !span.startsWith('--') && !NUMERIC_UNIT.test(span))
      .join(', ');
  } else {
    cleaned = cleaned
      .replace(/\*\*|_/gu, '')
      .replace(/\([^)]*\)/gu, '')
      .split(/\s+[—–]\s+|\s+-\s+(?=[a-z])/u)[0] ?? '';
  }
  cleaned = cleaned
    .replace(/\bwith\s+fallbacks?\s*:\s*/giu, ', ')
    .replace(/\bfallbacks?\s*:\s*/giu, ', ')
    .replace(/^['"]+|['"]+$/gu, '')
    .trim();
  const concrete = concreteFamilies(cleaned).filter(isValidFontFamilyName);
  if (concrete.length === 0) return undefined;
  const primary = concrete[0];
  const hasGeneric = cleaned
    .split(',')
    .some((part) => GENERIC_FAMILY.test(part.trim().replace(/^['"`]+|['"`]+$/gu, '')));
  const stackParts = [...concrete];
  if (hasGeneric) stackParts.push('sans-serif');
  return { primary, stack: stackParts.join(', ') };
}

function extractYamlTypography(raw) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(raw);
  if (!fm) return {};
  const lines = fm[1].split(/\r?\n/u);
  let inTypo = false;
  let currentRole = '';
  let heading;
  let body;
  let fallbackAny;
  for (const line of lines) {
    if (/^typography\s*:\s*$/u.test(line)) {
      inTypo = true;
      currentRole = '';
      continue;
    }
    if (!inTypo) continue;
    if (/^[A-Za-z0-9_-]+\s*:/u.test(line)) break;
    const roleMatch = /^  ([A-Za-z0-9_-]+)\s*:\s*(.*)$/u.exec(line);
    if (roleMatch) {
      currentRole = roleMatch[1];
      if (roleMatch[2].trim()) {
        const direct = parseFontStackValue(roleMatch[2]);
        if (direct && !MONO_OR_DECOR_ROLE.test(currentRole)) {
          if (HEADING_ROLE.test(currentRole)) heading ??= direct;
          else if (BODY_ROLE.test(currentRole)) body ??= direct;
          fallbackAny ??= direct;
        }
      }
      continue;
    }
    const familyMatch = /^\s{4,}fontFamily\s*:\s*(.+)$/u.exec(line);
    if (familyMatch) {
      const cleaned = familyMatch[1].replace(/\s+#.*$/u, '').trim();
      const parsed = parseFontStackValue(cleaned);
      if (!parsed || MONO_OR_DECOR_ROLE.test(currentRole)) continue;
      if (HEADING_ROLE.test(currentRole)) heading ??= parsed;
      else if (BODY_ROLE.test(currentRole)) body ??= parsed;
      fallbackAny ??= parsed;
    }
  }
  return { heading: heading ?? fallbackAny, body: body ?? fallbackAny };
}

function extractTypographyMarkdownSection(raw) {
  const withoutFm = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/u, '');
  const sections = withoutFm.split(/^##\s+/mu);
  for (const section of sections.slice(1)) {
    const firstLine = section.split(/\r?\n/u)[0] ?? '';
    if (/\btypography\b/iu.test(firstLine)) return section;
  }
  // Short custom DESIGN.md without `##` sections: scan only explicit `Heading Font:` / `Body Font:` lines.
  return /^##\s+/mu.test(withoutFm) ? '' : withoutFm;
}

function extractMarkdownTypography(raw) {
  const section = extractTypographyMarkdownSection(raw);
  if (!section) return {};
  let heading;
  let body;
  let fallbackAny;
  let subheading = '';
  let tableHeaderCols = null;

  for (const line of section.split(/\r?\n/u)) {
    const h3 = /^###\s+(.+)$/u.exec(line);
    if (h3) {
      subheading = h3[1].trim();
      tableHeaderCols = null;
      continue;
    }
    // Markdown tables inside Typography (e.g. `| Role | Family | Usage |` or `| Role | Font | Size |`)
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length >= 2) {
        if (cells.every((c) => /^[-:]+$/u.test(c))) continue;
        if (tableHeaderCols === null) {
          tableHeaderCols = cells.map((c) => c.toLowerCase());
          continue;
        }
        const fontColIdx = tableHeaderCols.findIndex((col) => col === 'family' || col === 'font' || col === 'typeface' || col === 'font family');
        if (fontColIdx > 0 && fontColIdx < cells.length) {
          const roleCell = cells[0];
          const parsed = parseFontStackValue(cells[fontColIdx]);
          if (parsed && !MONO_OR_DECOR_ROLE.test(roleCell)) {
            if (HEADING_ROLE.test(roleCell)) heading ??= parsed;
            else if (BODY_ROLE.test(roleCell)) body ??= parsed;
            fallbackAny ??= parsed;
          }
        }
      }
      continue;
    }
    tableHeaderCols = null;

    // Role-labeled bullet: `- **Display**: Kraken-Brand...` or `- **Primary:** SoDoSans...`
    const labeled = /^\s*(?:[-*]\s*)?\*{0,2}([A-Za-z][A-Za-z0-9 /&+-]{1,28}?)\*{0,2}\s*:\s*\*{0,2}\s*(.+)$/u.exec(line);
    if (labeled) {
      const role = labeled[1].trim();
      const value = labeled[2].trim();
      if (!MONO_OR_DECOR_ROLE.test(role) && !/\b(?:weight|size|feature|openType|italic|fallback)\b/iu.test(role)) {
        const hasBoth = HEADING_ROLE.test(role) && BODY_ROLE.test(role);
        if (hasBoth || HEADING_ROLE.test(role) || BODY_ROLE.test(role) || /\bfont\b/iu.test(role)) {
          const parsed = parseFontStackValue(value);
          if (parsed) {
            if (hasBoth || /\b(?:universal|primary)\b/iu.test(role)) {
              heading ??= parsed;
              body ??= parsed;
            } else if (HEADING_ROLE.test(role)) {
              heading ??= parsed;
            } else {
              body ??= parsed;
            }
            fallbackAny ??= parsed;
            continue;
          }
        }
      }
    }

    // Direct font-family bullet under `### Font Family` / `### Font Families`: `- **Manuka** (...) — ...`
    if (/\bfont\s+famil/iu.test(subheading)) {
      const boldBullet = /^\s*[-*]\s+\*\*([^*]+)\*\*(.*)$/u.exec(line);
      if (boldBullet) {
        const namePart = boldBullet[1].replace(/\s+at\s+\w+\s+weights?$/iu, '').trim();
        const rest = boldBullet[2] ?? '';
        if (!MONO_OR_DECOR_ROLE.test(namePart) && !/\bmono(?:space|spaced)?\b/iu.test(rest)) {
          const parsed = parseFontStackValue(namePart);
          if (parsed) {
            if (/\b(?:display|headline|wordmark)\b/iu.test(rest) && !heading) heading = parsed;
            else if (!body) body = parsed;
            fallbackAny ??= parsed;
          }
        }
      }
    }
  }
  return { heading: heading ?? fallbackAny, body: body ?? heading ?? fallbackAny };
}

/** Extract DESIGN-specified primary/body and heading/display font families from `document.designMd`. */
export function extractDesignSpecFonts(document) {
  const designMd = isRecord(document?.designMd) ? document.designMd : undefined;
  if (!designMd) return { bodyFont: undefined, headingFont: undefined, families: [] };
  const typo = isRecord(designMd.typography) ? designMd.typography : undefined;
  const raw = typeof designMd.raw === 'string' ? designMd.raw : '';

  const fromStructHeading = parseFontStackValue(typo?.headings);
  const fromStructBody = parseFontStackValue(typo?.body) ?? parseFontStackValue(typo?.fontFamily);
  const fromYaml = raw ? extractYamlTypography(raw) : {};
  const fromMd = raw ? extractMarkdownTypography(raw) : {};

  const resolvedHeading = fromStructHeading ?? fromYaml.heading ?? fromMd.heading ?? fromStructBody ?? fromYaml.body ?? fromMd.body;
  const resolvedBody = fromStructBody ?? fromYaml.body ?? fromMd.body ?? resolvedHeading;

  const families = [];
  for (const entry of [resolvedHeading, resolvedBody]) {
    if (entry?.primary && !families.some((existing) => familyKey(existing) === familyKey(entry.primary))) {
      families.push(entry.primary);
    }
  }
  return {
    bodyFont: resolvedBody?.stack,
    headingFont: resolvedHeading?.stack,
    families,
  };
}
