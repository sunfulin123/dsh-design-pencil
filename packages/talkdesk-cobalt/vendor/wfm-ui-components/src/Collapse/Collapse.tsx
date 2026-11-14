import React from 'react';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Typography } from '../Typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CollapseSize = 'small' | 'medium';

export type CollapseProps = {
  /** Header label rendered in the trigger row. */
  title: React.ReactNode;
  /** Body content revealed when expanded. */
  children: React.ReactNode;

  /**
   * Controlled open state. Pair with `onOpenChange` to control externally.
   * When omitted, the component is uncontrolled and uses `defaultOpen`.
   */
  open?: boolean;
  /** Initial open state for the uncontrolled mode. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Called whenever the user toggles the panel. */
  onOpenChange?: (open: boolean) => void;

  /** Disables the trigger and dims the header. */
  disabled?: boolean;

  /** Animation duration in ms. Defaults to `240`. */
  duration?: number;
  /** Header density. `'small'` uses 12px vertical padding; `'medium'` uses 16px. Defaults to `'medium'`. */
  size?: CollapseSize;

  /** Optional content rendered to the right of the title (before the chevron). */
  extra?: React.ReactNode;

  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

let nextId = 0;

const useStableId = (prefix: string): string => {
  const ref = React.useRef<string | null>(null);

  if (ref.current === null) {
    nextId += 1;
    ref.current = `${prefix}-${nextId}`;
  }

  return ref.current;
};

// eslint-disable-next-line complexity
export const Collapse: React.FC<CollapseProps> = ({
  title,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  duration = 240,
  size = 'medium',
  extra,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMCollapse',
}) => {
  const theme = useTheme();

  const isControlled = typeof openProp === 'boolean';
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen);
  const open = isControlled ? (openProp as boolean) : internalOpen;

  const panelId = useStableId('wfm-collapse-panel');

  const toggle = (): void => {
    if (disabled) return;
    const next = !open;

    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  // Uses the modern `grid-template-rows: 0fr → 1fr` trick so we get a smooth
  // height animation without measuring the child or using max-height hacks.
  // The inner wrapper sets `min-height: 0` + `overflow: hidden` so children
  // can collapse below their natural height.
  const headerPaddingY = size === 'small' ? '3' : '4';

  return (
    <Box
      data-component={dataComponent}
      data-qa={dataQa}
      style={{
        border: `1px solid ${theme.gray4}`,
        borderRadius: 4,
        backgroundColor: theme.surfaceElevation1,
        opacity: disabled ? 0.6 : 1,
      }}
      width="100%"
    >
      {/* ── Header / trigger ── */}
      {/*
        Native <button> is avoided because the header may contain interactive
        children via `extra` (chip, badge, secondary button); a nested
        <button> inside <button> is invalid HTML. Use ARIA + key handlers.
      */}
      <Flex
        alignY="center"
        aria-controls={panelId}
        aria-disabled={disabled || undefined}
        aria-expanded={open}
        as="div"
        data-qa={dataQa ? `${dataQa}-trigger` : undefined}
        gap="3"
        paddingX="4"
        paddingY={headerPaddingY}
        role="button"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        }}
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <Box grow>
          {typeof title === 'string' ? (
            <Typography variant="body-emphasis">{title}</Typography>
          ) : (
            title
          )}
        </Box>
        {extra && (
          <Flex
            alignY="center"
            // Stop bubbling so clicks on extras (e.g. a button) don't toggle.
            onClick={(e) => e.stopPropagation()}
          >
            {extra}
          </Flex>
        )}
        <Icon
          color={theme.gray11}
          name="chevron_down"
          size="small"
          style={{
            transition: `transform ${duration}ms ease`,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </Flex>

      {/* ── Animated body ── */}
      <Box
        aria-hidden={!open}
        as="section"
        data-qa={dataQa ? `${dataQa}-panel` : undefined}
        // Hide content from AT when collapsed.
        id={panelId}
        // grid-template-rows trick: 0fr → 1fr animates the row track height.
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: `grid-template-rows ${duration}ms ease`,
        }}
      >
        <Box style={{ minHeight: 0, overflow: 'hidden' }}>
          <Box
            paddingX="4"
            paddingY="4"
            style={{ borderTop: `1px solid ${theme.gray4}` }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
