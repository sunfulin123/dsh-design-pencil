import React from 'react';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';
import { cssVar, useTheme } from '@talkdesk/cobalt-react-theme-provider';

export type ToolbarWrapperProps = {
  /**
   * Content anchored to the left side of the toolbar — typically a record
   * count summary, breadcrumb, or date/navigation controls.
   */
  start?: React.ReactNode;
  /**
   * Content anchored to the right side of the toolbar — typically search
   * inputs, filter buttons, and action buttons.
   */
  end?: React.ReactNode;
  /**
   * When true, renders a 1 px top border above the toolbar.
   * Defaults to `false`.
   */
  isTopBordered?: boolean;
  /**
   * When true, renders a 1 px bottom border below the toolbar that visually
   * separates it from the content area below. Defaults to `true`.
   */
  isBottomBordered?: boolean;
  /**
   * Horizontal padding token (Cobalt Space 0–12, 4 px grid).
   * Defaults to `4` (16 px).
   */
  paddingX?: number | string;
  /**
   * Vertical padding token (Cobalt Space 0–12, 4 px grid).
   * Defaults to `2` (8 px).
   */
  paddingY?: number | string;
  'data-qa'?: string;
  'data-component'?: string;
};

export const ToolbarWrapper: React.FC<ToolbarWrapperProps> = ({
  start,
  end,
  isTopBordered = false,
  isBottomBordered = true,
  paddingX = 6,
  paddingY = 2,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMToolbarWrapper',
}) => {
  const theme = useTheme();

  return (
    // Outer Box provides the gray100 background and acts as the flex-shrink:0
    // container so the toolbar never collapses when placed inside AppPage.
    <div
      data-co-surface="1"
      data-component={dataComponent}
      data-qa={dataQa}
      style={{
        backgroundColor: cssVar(theme.surfaceElevation1, theme.gray2),
        flexShrink: 0,
        width: '100%',
      }}
    >
      {isTopBordered && <Divider />}
      <Flex
        alignY="center"
        paddingX={paddingX as never}
        paddingY={paddingY as never}
        style={{ minHeight: 48 }}
        width="100%"
      >
        {/* Left slot — grows to fill available space */}
        <Flex grow alignY="center" gap={3}>
          {start}
        </Flex>

        {/* Right slot — shrinks to fit content, never wraps */}
        {end && (
          <Flex alignY="center" gap={2} style={{ flexShrink: 0 }}>
            {end}
          </Flex>
        )}
      </Flex>

      {isBottomBordered && <Divider />}
    </div>
  );
};
