import React from 'react';
import Box from '@talkdesk/cobalt-react-box';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';

// Space token values accepted by Cobalt Box / Flex (4 px grid, 0–12)
type Space =
  | 0
  | '0'
  | 1
  | '1'
  | 2
  | '2'
  | 3
  | '3'
  | 4
  | '4'
  | 5
  | '5'
  | 6
  | '6'
  | 7
  | '7'
  | 8
  | '8'
  | 9
  | '9'
  | 10
  | '10'
  | 11
  | '11'
  | 12
  | '12';

// ─── Prop types ────────────────────────────────────────────────────────────

export type AppPageHeaderProps = {
  /** Header content — page title, breadcrumbs, or action bars. */
  children?: React.ReactNode;
  /**
   * When true, renders a 1 px bottom border between the header and the main
   * area. Defaults to `true`.
   */
  isBordered?: boolean;
  /** Horizontal padding token (Cobalt Space 0–12, 4 px grid). Defaults to `6` (24 px). */
  paddingX?: Space;
  /** Vertical padding token (Cobalt Space 0–12, 4 px grid). Defaults to `4` (16 px). */
  paddingY?: Space;
  'data-qa'?: string;
};

export type AppPageMainProps = {
  /** Should contain `AppPageAside` and/or `AppPageContent`. Aside is optional. */
  children?: React.ReactNode;
  'data-qa'?: string;
};

export type AppPageAsideProps = {
  /** Sidebar content. Scrolls vertically when it overflows. */
  children?: React.ReactNode;
  /**
   * Aside panel width. Accepts any valid CSS width value (string) or pixel
   * number. Passed directly to the Cobalt Box `width` prop. Defaults to `240`.
   */
  width?: string | number;
  /**
   * When true, renders a 1 px right border between the aside and the content
   * area. Defaults to `true`.
   */
  isBordered?: boolean;
  /** Horizontal padding token (Cobalt Space 0–12, 4 px grid). Defaults to `4` (16 px). */
  paddingX?: Space;
  /** Vertical padding token (Cobalt Space 0–12, 4 px grid). Defaults to `4` (16 px). */
  paddingY?: Space;
  'data-qa'?: string;
};

export type AppPageContentProps = {
  /** Main content. Scrolls vertically when it overflows. */
  children?: React.ReactNode;
  /**
   * Optional node rendered **below** the scrollable area — stays pinned at the
   * bottom even when the content is taller than the viewport. Pass an
   * `<AppPageContentFooter>` here.
   */
  footer?: React.ReactNode;
  /** Horizontal padding token (Cobalt Space 0–12, 4 px grid). Defaults to `6` (24 px). */
  paddingX?: Space;
  /** Vertical padding token (Cobalt Space 0–12, 4 px grid). Defaults to `4` (16 px). */
  paddingY?: Space;
  'data-qa'?: string;
};

export type AppPageFooterProps = {
  /** Footer content — action bars, save/cancel buttons, status text. */
  children?: React.ReactNode;
  /**
   * When true, renders a 1 px top border between the main area and the footer.
   * Defaults to `true`.
   */
  isBordered?: boolean;
  /** Horizontal padding token (Cobalt Space 0–12, 4 px grid). Defaults to `6` (24 px). */
  paddingX?: Space;
  /** Vertical padding token (Cobalt Space 0–12, 4 px grid). Defaults to `4` (16 px). */
  paddingY?: Space;
  'data-qa'?: string;
};

export type AppPageProps = {
  /**
   * Should contain `AppPageHeader` and `AppPageMain`. Both are optional so
   * the root can be used as a flexible shell.
   */
  children?: React.ReactNode;
  'data-qa'?: string;
  'data-component'?: string;
};

// ─── Sub-components ────────────────────────────────────────────────────────

export const AppPageHeader: React.FC<AppPageHeaderProps> = ({
  children,
  isBordered = true,
  paddingX = 6,
  paddingY = 4,
  'data-qa': dataQa,
}) => (
  // Outer Box is the flex item in AppPage's column (flexShrink:0).
  // Inner Box carries the padding. Divider sits below it as a block child,
  // producing the bottom border without affecting AppPageMain's height.
  <Box data-qa={dataQa} width="100%" style={{ flexShrink: 0 }}>
    <Box grow paddingX={paddingX} paddingY={paddingY} style={{ flexShrink: 0 }}>
      {children}
    </Box>
    {isBordered && <Divider />}
  </Box>
);

export const AppPageMain: React.FC<AppPageMainProps> = ({ children, 'data-qa': dataQa }) => (
  // Flex grow fills the remaining height. min-height: 0 is required by the
  // CSS flexbox spec — without it the area grows beyond the viewport when
  // content is tall.
  <Flex data-qa={dataQa} height="100%" style={{ minHeight: 0, overflow: 'hidden' }} width="100%">
    {children}
  </Flex>
);

export const AppPageAside: React.FC<AppPageAsideProps> = ({
  children,
  width = 240,
  isBordered = true,
  paddingX = 4,
  paddingY = 4,
  'data-qa': dataQa,
}) => (
  // Outer Box is the flex item in AppPageMain's row (flexShrink:0, fixed width).
  // scrollable enables overflow:auto. Divider sits as a sibling after the content Box.
  <Flex data-qa={dataQa} height="100%" style={{ flexShrink: 0 }} width={width}>
    <Flex grow scrollable height="100%">
      <Flex grow paddingX={paddingX} paddingY={paddingY}>
        {children}
      </Flex>
    </Flex>
    {isBordered && <Divider vertical />}
  </Flex>
);

export const AppPageContent: React.FC<AppPageContentProps> = ({
  children,
  footer,
  paddingX = 6,
  paddingY = 4,
  'data-qa': dataQa,
}) => (
  // Flex direction="column" creates the vertical stack:
  //   ① Box grow scrollable — the actual scrollable content area
  //   ② footer slot (optional) — pinned, never scrolls
  // min-width:0 prevents content overflow in the parent flex row;
  // overflow:hidden clips the scroll region cleanly.
  <Flex
    grow
    data-qa={dataQa}
    direction="column"
    height="100%"
    style={{ minWidth: 0, overflow: 'hidden' }}
  >
    <Box grow scrollable height="100%" paddingX={paddingX} paddingY={paddingY} width="100%">
      {children}
    </Box>
    {footer}
  </Flex>
);

// ─── Footer sub-components ─────────────────────────────────────────────────

export const AppPageFooter: React.FC<AppPageFooterProps> = ({
  children,
  isBordered = true,
  paddingX = 6,
  paddingY = 4,
  'data-qa': dataQa,
}) => (
  // Outer Box sits as a flex item inside AppPage's column (flexShrink:0 —
  // never squashed by AppPageMain). Divider is the top border.
  <Box data-qa={dataQa} style={{ flexShrink: 0 }} width="100%">
    {isBordered && <Divider />}
    <Box paddingX={paddingX} paddingY={paddingY} width="100%">
      {children}
    </Box>
  </Box>
);

// ─── Root component ────────────────────────────────────────────────────────

export const AppPage: React.FC<AppPageProps> = ({
  children,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMAppPage',
}) => (
  // Flex direction="column" creates the vertical stack. overflow:hidden must
  // be set via style — Cobalt Flex has no overflow prop.
  <Flex
    grow
    data-component={dataComponent}
    data-qa={dataQa}
    direction="column"
    height="100%"
    style={{ overflow: 'hidden', minHeight: 0, minWidth: 0 }}
  >
    {children}
  </Flex>
);
