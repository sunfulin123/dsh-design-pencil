/* eslint-disable no-plusplus */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import StatefulPopup from '@talkdesk/cobalt-marketplace-react-stateful-popup';
import Button from '@talkdesk/cobalt-react-button';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import Tag from '@talkdesk/cobalt-react-tag';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Text } from '@talkdesk/cobalt-react-typography';

export type FilterOption = {
  id: string;
  value: string;
};

export type FilterGroup = {
  label: string;
  key: string;
  options: FilterOption[];
};

export type FilterToolbarProps = {
  filters: FilterGroup[];
  onDeleteTag: (filterKey: string, optionId: string) => void;
  onClearAll: () => void;
  /**
   * Hard cap on tags considered per group before dynamic overflow applies.
   * Tags beyond this limit are always hidden in the overflow popup.
   * When omitted, all tags are considered and only overflow due to container width.
   */
  maxRender?: number;
  filtersLabel?: string;
  clearAllLabel?: string;
  /** Renders a 1 px Cobalt Divider above the toolbar. Defaults to `false`. */
  isTopDivider?: boolean;
  /** Renders a 1 px Cobalt Divider below the toolbar. Defaults to `false`. */
  isBottomDivider?: boolean;
  'data-qa'?: string;
  'data-component'?: string;
};

// ─── overflow calculation constants ──────────────────────────────────────────

const PLUS_TAG_WIDTH = 50;
const GAP = 8;

const calculateVisibleCount = (
  container: HTMLElement,
  effectiveTotal: number,
  alwaysHasOverflow: boolean
): number => {
  const containerWidth = container.clientWidth;
  const tagEls = container.querySelectorAll<HTMLElement>('[data-tag]');

  const totalWidth = Array.from(tagEls).reduce(
    (acc, el, i) => (i === 0 ? el.clientWidth : acc + GAP + el.clientWidth),
    0
  );

  const needsCheck =
    totalWidth > containerWidth ||
    (alwaysHasOverflow && totalWidth + GAP + PLUS_TAG_WIDTH > containerWidth);

  if (!needsCheck) return effectiveTotal;

  let total = 0;
  let count = 0;

  for (let i = 0; i < effectiveTotal; i++) {
    const el = tagEls[i];

    if (!el) break;
    const tagWidth = el.clientWidth + GAP;
    const needsPlusSpace = i < effectiveTotal - 1 || alwaysHasOverflow;

    if (
      total + tagWidth + (needsPlusSpace ? PLUS_TAG_WIDTH + GAP : 0) >
      containerWidth
    )
      break;
    total += tagWidth;
    count++;
  }

  return count;
};

// ─── OverflowTagGroup ─────────────────────────────────────────────────────────

type OverflowTagGroupProps = {
  groupKey: string;
  tags: FilterOption[];
  maxRender?: number;
  onDeleteTag: (optionId: string) => void;
  dataQa?: string;
};

const OverflowTagGroup: React.FC<OverflowTagGroupProps> = ({
  groupKey,
  tags,
  maxRender,
  onDeleteTag,
  dataQa,
}) => {
  const theme = useTheme();

  const effectiveTotal =
    typeof maxRender === 'number'
      ? Math.min(maxRender, tags.length)
      : tags.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCount, setVisibleCount] = useState(effectiveTotal);
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const scheduleRecalc = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setIsResizing(true), 500);
  }, []);

  // Phase 2: tags are reset to effectiveTotal and rendered — now measure and trim
  useEffect(() => {
    if (!isResizing) return;
    const container = containerRef.current;

    if (!container) return;
    const alwaysHasOverflow = tags.length > effectiveTotal;

    const count = calculateVisibleCount(
      container,
      effectiveTotal,
      alwaysHasOverflow
    );

    setVisibleCount(count);
    setIsResizing(false);
    setIsLoading(false);
  }, [isResizing, effectiveTotal, tags.length]);

  // Phase 1: on tags / size change, reset to full render then schedule measurement
  useEffect(() => {
    const container = containerRef.current;

    if (!container || tags.length === 0) return;

    const recalc = () => {
      setIsLoading(true);
      setVisibleCount(effectiveTotal); // render all so DOM widths are measurable
      scheduleRecalc();
    };

    recalc();
    window.addEventListener('resize', recalc);

    // eslint-disable-next-line consistent-return
    return () => {
      window.removeEventListener('resize', recalc);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tags), effectiveTotal, scheduleRecalc]);

  const hiddenCount = tags.length - visibleCount;
  const hiddenTags = tags.slice(visibleCount);

  return (
    <Flex
      alignY="center"
      data-qa={dataQa ? `${dataQa}-${groupKey}-options` : undefined}
      forwardedRef={containerRef}
      gap="2"
      style={{ flexWrap: 'nowrap', overflow: 'hidden', position: 'relative' }}
    >
      {tags.slice(0, visibleCount).map((tag) => (
        <Tag
          key={tag.id}
          data-tag
          color="light-gray"
          data-qa={dataQa ? `${dataQa}-${groupKey}-${tag.id}` : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          <Text style={{ whiteSpace: 'nowrap' }}>{tag.value}</Text>
          <Icon
            data-qa={
              dataQa ? `${dataQa}-${groupKey}-remove-${tag.id}` : undefined
            }
            name="close"
            size="micro"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => onDeleteTag(tag.id)}
          />
        </Tag>
      ))}

      {/* Loading overlay — covers tags while DOM measurement is in progress */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: theme.gray2,
            borderRadius: 4,
          }}
        />
      )}

      {/* Overflow badge — shown after measurement completes */}
      {hiddenCount > 0 && !isLoading && (
        <StatefulPopup
          keepOpen
          direction="S"
          target={
            <Tag
              color="theme"
              size="medium"
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              +{hiddenCount}
            </Tag>
          }
          width="350px"
        >
          <Flex
            wrap
            gap="2"
            paddingX="3"
            paddingY="3"
            style={{ maxHeight: '150px', overflowY: 'auto' }}
            width="100%"
          >
            {hiddenTags.map((tag) => (
              <Tag
                key={tag.id}
                color="light-gray"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Text style={{ whiteSpace: 'nowrap' }}>{tag.value}</Text>
                <Icon
                  name="close"
                  size="micro"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => onDeleteTag(tag.id)}
                />
              </Tag>
            ))}
          </Flex>
        </StatefulPopup>
      )}
    </Flex>
  );
};

// ─── FilterToolbar ────────────────────────────────────────────────────────────

const FilterToolbarInner: React.FC<FilterToolbarProps> = ({
  filters,
  onDeleteTag,
  onClearAll,
  maxRender,
  filtersLabel = 'Filters',
  clearAllLabel = 'Clear All',
  isTopDivider = false,
  isBottomDivider = false,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMFilterToolbar',
}) => {
  const theme = useTheme();
  const activeGroups = filters.filter((g) => g.options.length > 0);

  if (activeGroups.length === 0) return null;

  return (
    <div
      data-component={dataComponent}
      data-qa={dataQa}
      style={{ flexShrink: 0, width: '100%' }}
    >
      {isTopDivider && <Divider />}
      <Flex
        alignX="space-between"
        alignY="center"
        backgroundColor={theme.gray2}
        gap="2"
        paddingX="6"
        paddingY="2"
        style={{ flexShrink: 0 }}
        width="100%"
      >
        <Flex
          alignX="start"
          alignY="center"
          data-qa={dataQa ? `${dataQa}-filters` : undefined}
          gap="2"
          width="100%"
        >
          <Text color={theme.secondary12} style={{ whiteSpace: 'nowrap' }}>
            {filtersLabel}:
          </Text>
          {activeGroups.map((group) => (
            <Flex
              key={group.key}
              alignY="center"
              data-qa={dataQa ? `${dataQa}-${group.key}` : undefined}
              gap="2"
              style={{
                // Each group claims an equal share of available width, matching FiltersToolbarV2
                maxWidth: `calc(100% / ${activeGroups.length} - 8px)`,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <Text color={theme.gray10} style={{ whiteSpace: 'nowrap' }}>
                {group.label}
              </Text>
              {/* Re-mount OverflowTagGroup when group count changes so widths are recalculated */}
              <OverflowTagGroup
                key={`${group.key}-${activeGroups.length}`}
                dataQa={dataQa}
                groupKey={group.key}
                maxRender={maxRender}
                tags={group.options}
                onDeleteTag={(optionId) => onDeleteTag(group.key, optionId)}
              />
            </Flex>
          ))}
        </Flex>
        <Button
          data-qa={dataQa ? `${dataQa}-clear-all` : undefined}
          size="small"
          type="secondary"
          onClick={onClearAll}
        >
          {clearAllLabel}
        </Button>
      </Flex>
      {isBottomDivider && <Divider />}
    </div>
  );
};

export const FilterToolbar = memo(
  FilterToolbarInner,
  (prev, next) =>
    JSON.stringify(prev.filters) === JSON.stringify(next.filters) &&
    prev.onClearAll === next.onClearAll &&
    prev.onDeleteTag === next.onDeleteTag &&
    prev.maxRender === next.maxRender &&
    prev.isTopDivider === next.isTopDivider &&
    prev.isBottomDivider === next.isBottomDivider
);
