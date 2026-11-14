import React, { useMemo } from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { PopupTrigger } from '../popup-trigger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Visual emphasis of the chips. Mapped to Cobalt `Tag` colors. */
export type ChipGroupColor = 'default' | 'info' | 'theme';

/** Chip size. Mirrors the Cobalt `Tag` size scale used by WFM. */
export type ChipGroupSize = 'tiny' | 'small' | 'medium';

export type ChipGroupItem = {
  /** Unique identifier — used as React `key` and inside `data-qa` selectors. */
  id: string;
  /** Plain text label. Always required so the popup and `title` tooltip have a string fallback. */
  label: string;
  /**
   * Optional custom render content (e.g. icon + label). When omitted the chip
   * renders `label` as plain text.
   */
  content?: React.ReactNode;
};

export type ChipGroupProps = {
  /** Chips to render, in order. */
  items: ChipGroupItem[];
  /** Maximum chips shown inline before the rest collapse into a `+N` overflow chip. Defaults to `2`. */
  maxVisible?: number;
  /** Visual color for the chips. Defaults to `'default'`. */
  color?: ChipGroupColor;
  /** Chip size. Defaults to `'small'`. */
  size?: ChipGroupSize;
  /** Maximum width of an individual inline chip. Truncates with ellipsis. Defaults to `120`. */
  maxChipWidth?: number | string;
  /**
   * What the overflow popup lists.
   *  - `'all'` (default) — shows every chip, useful for quick re-scanning of the full set.
   *  - `'hidden'` — shows only the chips that did not fit inline.
   */
  popupContent?: 'all' | 'hidden';
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<ChipGroupColor, 'light-gray' | 'light-blue' | 'theme'> = {
  default: 'light-gray',
  info: 'light-blue',
  theme: 'theme',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ChipGroup: React.FC<ChipGroupProps> = React.memo(
  ({
    items,
    maxVisible = 2,
    color = 'default',
    size = 'small',
    maxChipWidth = 120,
    popupContent = 'all',
    'data-qa': dataQa,
    'data-component': dataComponent = 'WFMChipGroup',
  }) => {
    const tagColor = COLOR_MAP[color];

    const visibleItems = useMemo(() => items.slice(0, maxVisible), [items, maxVisible]);

    const hiddenItems = useMemo(
      () => (items.length > maxVisible ? items.slice(maxVisible) : []),
      [items, maxVisible],
    );

    const hiddenCount = hiddenItems.length;
    const popupItems = popupContent === 'hidden' ? hiddenItems : items;

    return (
      <Flex
        alignY="center"
        data-component={dataComponent}
        data-qa={dataQa}
        gap="1"
        width="fit-content"
      >
        {visibleItems.map((chip) => (
          <Tag
            key={chip.id}
            color={tagColor}
            data-qa={dataQa ? `${dataQa}-${chip.id}` : undefined}
            size={size}
            style={{
              maxWidth: maxChipWidth,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={chip.label}
          >
            {chip.content ?? chip.label}
          </Tag>
        ))}

        {hiddenCount > 0 && (
          <PopupTrigger
            content={
              <Flex wrap gap="1">
                {popupItems.map((chip) => (
                  <Tag
                    key={chip.id}
                    color={tagColor}
                    data-qa={dataQa ? `${dataQa}-popup-${chip.id}` : undefined}
                    size={size}
                  >
                    {chip.content ?? chip.label}
                  </Tag>
                ))}
              </Flex>
            }
            contentPadding="2"
            data-qa={dataQa ? `${dataQa}-popup` : undefined}
            direction="NW"
            origin="SW"
            size="small"
          >
            <Tag
              color="theme"
              data-qa={dataQa ? `${dataQa}-overflow` : undefined}
              size={size}
              style={{ cursor: 'pointer' }}
            >
              +{hiddenCount}
            </Tag>
          </PopupTrigger>
        )}
      </Flex>
    );
  },
);

ChipGroup.displayName = 'ChipGroup';
