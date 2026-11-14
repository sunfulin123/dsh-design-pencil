import React from 'react';
import Box from '@talkdesk/cobalt-react-box';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Cobalt spacing token: each step = 4px. `'0'` removes the space entirely. */
export type CardSpace =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

export type CardProps = {
  children: React.ReactNode;

  // ---- Padding -----------------------------------------------------------
  /** All-sides padding. Defaults to `'4'` (16px). Overridden by `paddingX` / `paddingY`. */
  padding?: CardSpace;
  /** Horizontal padding override. */
  paddingX?: CardSpace;
  /** Vertical padding override. */
  paddingY?: CardSpace;

  // ---- Margin ------------------------------------------------------------
  /** All-sides margin. Overridden by `marginX` / `marginY`. */
  margin?: CardSpace;
  /** Horizontal margin override. */
  marginX?: CardSpace;
  /** Vertical margin override. */
  marginY?: CardSpace;

  // ---- Size --------------------------------------------------------------
  /** Card width. Defaults to `'100%'` so the card fills its parent. */
  width?: React.CSSProperties['width'];
  /** Card height. */
  height?: React.CSSProperties['height'];

  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Card: React.FC<CardProps> = ({
  children,
  padding = '4',
  paddingX,
  paddingY,
  margin,
  marginX,
  marginY,
  width = '100%',
  height,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMCard',
}) => {
  const toPx = (token: CardSpace | undefined): string | undefined =>
    token === undefined ? undefined : `${Number(token) * 4}px`;

  // Box does not expose margin props, so margin is applied via `style`.
  // The exact box-shadow string mirrors the legacy shared/Card.tsx so the
  // visual outline is identical.
  const hasAxisMargin = marginX !== undefined || marginY !== undefined;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--background-color, var(--background-color))',
    borderRadius: 'var(--card-border-radius, var(--border-radius-xsmall, 4px))',
    boxShadow:
      'var(--shadow-1, var(--shadow-level-1, 0 1px 2px) rgba(0, 0, 0, 0.4)), inset 0 0 0 var(--border-width-base, 1px) var(--secondary-4, transparent)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    margin: hasAxisMargin ? undefined : toPx(margin),
    marginLeft: toPx(marginX),
    marginRight: toPx(marginX),
    marginTop: toPx(marginY),
    marginBottom: toPx(marginY),
  };

  return (
    <Box
      data-co-surface="1"
      data-component={dataComponent}
      data-qa={dataQa}
      height={height}
      padding={paddingX || paddingY ? undefined : padding}
      paddingX={paddingX}
      paddingY={paddingY}
      style={cardStyle}
      width={width}
    >
      {children}
    </Box>
  );
};
