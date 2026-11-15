import { Skeleton } from '@talkdesk/cobalt-react-skeleton';
import React from 'react';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Heading, Text, type HeadingType, type TextType } from '@talkdesk/cobalt-react-typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Semantic role of the text. Each variant maps to either a Cobalt `Heading`
 * (heading-class roles) or a Cobalt `Text` (body-class roles).
 *
 * Sizes follow the WFM type scale (style-standard §3.2):
 *  - `'page-title'`     → 28px heading (page-level)
 *  - `'section-title'`  → 24px heading (major section)
 *  - `'card-title'`     → 18px heading (local block title)
 *  - `'body-large'`     → 16px text (limited emphasis in spacious layouts)
 *  - `'body'`           → 14px regular text (default)
 *  - `'body-emphasis'`  → 14px medium-weight text
 *  - `'caption'`        → 12px text (helper / metadata)
 */
export type TypographyVariant =
  | 'page-title'
  | 'section-title'
  | 'card-title'
  | 'body-large'
  | 'body'
  | 'body-emphasis'
  | 'caption';

/** Heading semantic level — maps to `<h1>`–`<h6>`. */
export type TypographyLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Text weight — only applies to body / caption variants. */
export type TypographyWeight = 'light' | 'regular' | 'medium' | 'inherit';

/** Font family — `'mono'` switches to Roboto Mono for machine-readable values. */
export type TypographyFont = 'sans' | 'mono';

/**
 * Semantic color tone — resolved internally via `useTheme()` so callers
 * don't need to import the theme hook for the most common cases. For any
 * other color, pass a raw `color` string (still prefer a `useTheme()` token).
 */
export type TypographyTone =
  | 'default'
  | 'subdued'
  | 'primary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'inverse';

/**
 * Loading state. Renders an animated Cobalt skeleton at full width.
 *  - `true` — single line skeleton
 *  - `number` — multi-line skeleton (text variants only; falls back to single line for headings)
 *  - `false` / `undefined` — render real content
 */
export type TypographyLoading = boolean | number;

export type TypographyProps = {
  /** Children to render inside the typography element. */
  children?: React.ReactNode;
  /** Semantic role. Defaults to `'body'`. Drives whether `Heading` or `Text` is rendered. */
  variant?: TypographyVariant;
  /** Native Cobalt heading scale override; ignored for body/caption variants. */
  scale?: 'large' | 'medium' | 'small';
  /**
   * Override the semantic heading level (`<h1>`–`<h6>`) without changing the
   * visual size. Heading variants only — ignored for text variants.
   *
   * Use when the page outline doesn't match the visual hierarchy
   * (e.g. a 24px section that should still be `<h3>` for screen readers).
   */
  asLevel?: TypographyLevel;
  /**
   * Override the font weight. Text variants only — ignored for headings.
   * Defaults come from `variant`: `'body-emphasis'` → `'medium'`, others → `'regular'`.
   */
  weight?: TypographyWeight;
  /** Font family. `'mono'` (Roboto Mono) is for IDs, timestamps, and code-like values. Defaults to `'sans'`. */
  font?: TypographyFont;
  /**
   * Semantic color tone resolved internally via `useTheme()`. Takes
   * precedence over `color` when both are set.
   */
  tone?: TypographyTone;
  /** Raw text color. Use `useTheme()` tokens. Overridden by `tone` when both are set. */
  color?: React.CSSProperties['color'];
  /** Truncate overflowing content with an ellipsis. */
  truncated?: boolean;
  /** Horizontal alignment. Ignored when `inline` is `true` (text variants only). */
  textAlign?: React.CSSProperties['textAlign'];
  /** Render text variants inline (`<span>` instead of `<p>`). Ignored for heading variants. */
  inline?: boolean;
  /** Loading state — renders an animated full-width skeleton instead of the real content. */
  loading?: TypographyLoading;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------

type HeadingConfig = {
  kind: 'heading';
  level: TypographyLevel;
  scale: 'large' | 'medium' | 'small';
};

type TextConfig = {
  kind: 'text';
  size: 'small' | 'medium';
  weight: 'light' | 'regular' | 'medium';
};

const VARIANT_CONFIG: Record<TypographyVariant, HeadingConfig | TextConfig> = {
  'page-title': { kind: 'heading', level: 1, scale: 'large' },
  'section-title': { kind: 'heading', level: 2, scale: 'medium' },
  'card-title': { kind: 'heading', level: 4, scale: 'small' },
  // `body-large` reuses Cobalt `Text size="medium"` and forces 16px via inline style.
  'body-large': { kind: 'text', size: 'medium', weight: 'regular' },
  body: { kind: 'text', size: 'medium', weight: 'regular' },
  'body-emphasis': { kind: 'text', size: 'medium', weight: 'medium' },
  caption: { kind: 'text', size: 'small', weight: 'regular' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const useToneColor = (
  tone: TypographyTone | undefined,
  fallback: React.CSSProperties['color'] | undefined,
): React.CSSProperties['color'] | undefined => {
  const theme = useTheme();

  if (!tone) return fallback;
  switch (tone) {
    case 'default':
      return theme.textDefault;
    case 'subdued':
      return theme.gray10;
    case 'primary':
      return theme.primary11;
    case 'error':
      return theme.textError;
    case 'success':
      return theme.success10;
    case 'warning':
      return theme.warning10;
    case 'info':
      return theme.info10;
    case 'inverse':
      return theme.primaryContrast;
    default:
      return fallback;
  }
};

// `body-large` is a 16px text role that Cobalt does not expose directly via a
// preset — apply the size override via inline style so the rest of the API
// stays uniform.
const BODY_LARGE_STYLE: React.CSSProperties = { fontSize: 16 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  scale,
  asLevel,
  weight,
  font = 'sans',
  tone,
  color,
  truncated,
  textAlign,
  inline,
  loading,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMTypography',
}) => {
  const config = VARIANT_CONFIG[variant];
  const resolvedColor = useToneColor(tone, color);
  if (loading) {
    const lines = typeof loading === 'number' ? Math.max(1, Math.floor(loading)) : 1;
    return (
      <span role="status" aria-label="Loading" data-component={dataComponent} data-qa={dataQa}>
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} variant="text" width="100%" />
        ))}
      </span>
    );
  }

  if (config.kind === 'heading') {
    return (
      <Heading
        asLevel={asLevel}
        color={resolvedColor}
        data-component={dataComponent}
        data-qa={dataQa}
        level={config.level}
        scale={scale ?? config.scale}
        textAlign={textAlign}
        truncated={truncated}
      >
        {children}
      </Heading>
    );
  }

  const resolvedWeight = weight ?? config.weight;
  const extraStyle = variant === 'body-large' ? BODY_LARGE_STYLE : undefined;

  // Cobalt `Text` forbids `textAlign` when `inline` is true. Honour that here.
  if (inline) {
    return (
      <Text
        inline
        color={resolvedColor}
        data-component={dataComponent}
        data-qa={dataQa}
        font={font}
        size={config.size}
        style={extraStyle}
        truncated={truncated}
        weight={resolvedWeight}
      >
        {children}
      </Text>
    );
  }

  return (
    <Text
      color={resolvedColor}
      data-component={dataComponent}
      data-qa={dataQa}
      font={font}
      size={config.size}
      style={extraStyle}
      textAlign={textAlign}
      truncated={truncated}
      weight={resolvedWeight}
    >
      {children}
    </Text>
  );
};

// Re-export underlying Cobalt element types for ref consumers.
export type { HeadingType, TextType };
