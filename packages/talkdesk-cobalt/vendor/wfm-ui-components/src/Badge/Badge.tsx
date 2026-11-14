import React from 'react';
import BadgeContainer from '@talkdesk/cobalt-marketplace-react-badge-container';
import type { BadgeContainerProps } from '@talkdesk/cobalt-marketplace-react-badge-container';
import type { CardinalPoint } from '@talkdesk/cobalt-react-position-hook';

/**
 * Semantic status for the badge — maps to Cobalt Tag color tokens.
 * Aligned with Talkdesk status vocabulary (success / warning / danger / info).
 */
export type BadgeStatus = 'default' | 'success' | 'warning' | 'danger' | 'info';

/** WFM size token → Cobalt Tag size */
export type BadgeSize = 'tiny' | 'small' | 'medium' | 'large';

const STATUS_TO_COLOR: Record<BadgeStatus, BadgeContainerProps['color']> = {
  default: 'light-gray',
  success: 'light-green',
  warning: 'light-yellow',
  danger: 'red',
  info: 'light-blue',
};

type BadgeNumberMode = {
  /** Numeric count shown on the badge (hidden when 0) */
  count?: number;
  /** Cap value — displays `+N` when count exceeds this */
  maxCount?: number;
  content?: never;
};

type BadgeContentMode = {
  /** Custom ReactNode displayed inside the badge (mutually exclusive with `count`) */
  content?: React.ReactNode;
  count?: never;
  maxCount?: never;
};

type BadgeMode = BadgeNumberMode | BadgeContentMode;

export type BadgeProps = BadgeMode & {
  /** Semantic status — controls the Cobalt Tag color */
  status?: BadgeStatus;
  /** Badge size — uses Cobalt Tag size tokens: `tiny | small | medium | large` */
  size?: BadgeSize;
  /** Horizontal offset between badge and anchor edge (px) */
  gapX?: number;
  /** Vertical offset between badge and anchor edge (px) */
  gapY?: number;
  /** Cardinal point on the child element where the badge originates */
  originPosition?: CardinalPoint;
  /** Cardinal point direction the badge floats toward */
  directionPosition?: CardinalPoint;
  /** The element the badge is anchored to */
  children: React.ReactNode;
  /** QA selector attribute */
  'data-qa'?: string;
  /** Component identification attribute */
  'data-component'?: string;
};

export const Badge: React.FC<BadgeProps> = ({
  status = 'danger',
  size = 'tiny',
  count,
  maxCount,
  content,
  gapX,
  gapY,
  originPosition,
  directionPosition,
  children,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMBadge',
}) => {
  const badgeMode =
    content !== undefined
      ? ({ badgeContent: content } as const)
      : ({ badgeNumber: count, badgeMaxNumber: maxCount } as const);

  return (
    <BadgeContainer
      color={STATUS_TO_COLOR[status]}
      data-component={dataComponent}
      data-qa={dataQa}
      directionPosition={directionPosition}
      gapX={gapX}
      gapY={gapY}
      originPosition={originPosition}
      size={size}
      {...badgeMode}
    >
      {children}
    </BadgeContainer>
  );
};
