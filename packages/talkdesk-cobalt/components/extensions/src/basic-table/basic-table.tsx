/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Skeleton } from '@talkdesk/cobalt-react-skeleton';
import React, { useMemo, useRef } from 'react';
import { BadRequestWidget, NoResultsWidget } from '@talkdesk/cobalt-marketplace-react-empty-widget';
import Pagination from '@talkdesk/cobalt-marketplace-react-pagination';
import Tooltip, { PositionCenterTop } from '@talkdesk/cobalt-marketplace-react-tooltip';
import Box from '@talkdesk/cobalt-react-box';
import Button from '@talkdesk/cobalt-react-button';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import Table, {
  Head,
  Body,
  Row,
  ExpandableRow,
  HeadCell,
  Cell,
} from '@talkdesk/cobalt-react-table';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Text } from '@talkdesk/cobalt-react-typography';
import styles from './basic-table.module.css';
import {
  useTableLayoutMeasure,
  getAvailableHeight,
  getConstrainedHeight,
  type TableLayoutMeasure,
} from './table-layout-measure';

const DEFAULT_MAX_PAGES = 9;
const DEFAULT_LOADING_ROWS = 5;
const DEFAULT_PAGINATION_HEIGHT = 50;
const MIN_TABLE_BODY_HEIGHT = 200;

// ---------------------------------------------------------------------------
// useTableLayoutMeasure — keep body height math aligned with the wrapper.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// TableLoading — skeleton rows
// ---------------------------------------------------------------------------
const TableLoading = ({ cols, rows = DEFAULT_LOADING_ROWS }: { cols: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <Row key={i} data-qa={`table-loading-${i}`}>
        {Array.from({ length: cols }, (_c, j) => (
          <Cell key={j}>
            <Box padding={4}>
              <Skeleton variant="text" width="100%" />
            </Box>
          </Cell>
        ))}
      </Row>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Messages / i18n
// ---------------------------------------------------------------------------
export type BasicTableMessages = {
  noResultsTitle?: string;
  noResultsMessage?: string;
  noResultsAlt?: string;
  badRequestTitle?: string;
  badRequestMessage?: string;
  badRequestAlt?: string;
  refresh?: string;
  paginationPrevious?: string;
  paginationNext?: string;
};

const DEFAULT_MESSAGES: Required<BasicTableMessages> = {
  noResultsTitle: 'No results found',
  noResultsMessage: 'Try adjusting your search or filters.',
  noResultsAlt: 'No results',
  badRequestTitle: 'Something went wrong',
  badRequestMessage: 'An error occurred while loading data.',
  badRequestAlt: 'Error',
  refresh: 'Refresh',
  paginationPrevious: 'Previous',
  paginationNext: 'Next',
};

const buildTranslator =
  (messages: Required<BasicTableMessages>) =>
  (key: string): string => {
    const map: Record<string, string> = {
      'global:emptyWidget.noResults.title': messages.noResultsTitle,
      'global:emptyWidget.noResults.message': messages.noResultsMessage,
      'global:emptyWidget.noResults.alt': messages.noResultsAlt,
      'global:emptyWidget.badRequest.title': messages.badRequestTitle,
      'global:emptyWidget.badRequest.message': messages.badRequestMessage,
      'global:emptyWidget.badRequest.alt': messages.badRequestAlt,
      'global:refresh': messages.refresh,
    };

    return map[key] ?? key;
  };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
  UNSORTED = '',
}

/** Column width: a percentage multiple of 5 (5–100), 33, 66, or 'min' for content-fit. */
export type ColumnWidth =
  | 'min'
  | 5
  | 10
  | 15
  | 20
  | 25
  | 30
  | 33
  | 35
  | 40
  | 45
  | 50
  | 55
  | 60
  | 65
  | 66
  | 70
  | 75
  | 80
  | 85
  | 90
  | 95
  | 100;

export type BasicTableBaseType = {
  id?: string;
  [key: string]: any;
};

export type BasicTableColumn<T extends BasicTableBaseType> = {
  /** Column key — maps to a field on data rows. */
  key: keyof T;
  /** Column header label. */
  title: React.ReactNode | string;
  /** Whether this column is sortable. */
  sortable?: boolean;
  /** Tooltip text shown on an info icon next to the column header. */
  tooltip?: string;
  /** Column width as a percentage (multiples of 5, or 33/66) or 'min' for content-fit. */
  width?: ColumnWidth;
  /** Custom cell renderer. Receives the full row and its index. */
  render?: (row: T, index: number) => React.ReactNode;
};

export type BasicTableProps<T extends BasicTableBaseType> = {
  /** Column definitions. */
  headers: Array<BasicTableColumn<T>>;
  /** Row data. Each item should have a unique `id`. */
  data: Array<T>;
  /** Current active page (1-based). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called when the user clicks a page number. */
  onPageClick: (page: number) => void;
  /** Shows animated skeleton rows while data is loading. */
  isFetching?: boolean;
  /** Shows the error/bad-request widget. */
  isRequestError?: boolean;
  /** Initial sort state keyed by column key. */
  defaultSort?: Record<string, SortDirection>;
  /** Called whenever the sort state changes. */
  onSortClick?: (sort: Record<string, SortDirection>) => void;
  /** Called when the user clicks Refresh on the error widget. */
  onRefresh?: () => void;
  /** Replaces the default "no results" widget when data is empty. */
  emptyStateComponent?: React.ReactNode;
  /** Content rendered as the first row inside the table body, above the data rows. */
  messageComponent?: React.ReactNode;
  /** When provided, each row becomes expandable. Called with the row and index; return the panel content. */
  renderExpandedRow?: (row: T, index: number) => React.ReactNode;
  /** Allow sorting by multiple columns simultaneously. */
  isMultiSorting?: boolean;
  /** Maximum number of page buttons shown in the paginator. Default: 9. */
  maxPagesCount?: number;
  /** Extra bottom padding (px) subtracted from the table body height calculation. */
  padding?: number;
  /** Override display strings for empty states, error widget, and pagination labels. */
  messages?: BasicTableMessages;
  /** Called when the user clicks the Add button in the empty state. When omitted, the button is not shown. */
  onAdd?: () => void;
  /** Label for the Add button in the empty state. Default: 'Add'. */
  addLabel?: string;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const BasicTableInner = <T extends BasicTableBaseType>({
  isFetching,
  isRequestError,
  currentPage = 1,
  totalPages,
  maxPagesCount = DEFAULT_MAX_PAGES,
  onPageClick,
  onSortClick,
  onRefresh,
  defaultSort = {},
  headers,
  data,
  emptyStateComponent,
  isMultiSorting,
  padding = 0,
  messages,
  messageComponent,
  renderExpandedRow,
  onAdd,
  addLabel = 'Add',
  'data-qa': dataQa = 'basic-table',
  'data-component': dataComponent = 'WFMBasicTable',
}: BasicTableProps<T>) => {
  const theme = useTheme();

  const [sort, setSort] = React.useState<Record<string, SortDirection>>(defaultSort);

  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(() => new Set());

  const handleExpandToggle = React.useCallback((rowKey: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  }, []);

  const ref = useRef<HTMLDivElement>();
  const bodyRef = useRef<HTMLDivElement>();
  const paginationRef = useRef<HTMLDivElement>();

  const [tableLayoutMeasure, setTableLayoutMeasure] = React.useState<TableLayoutMeasure>({
    bodyTop: 0,
    wrapperBottom: 0,
    paginationHeight: 0,
  });

  const t = buildTranslator({ ...DEFAULT_MESSAGES, ...messages });
  const msg = { ...DEFAULT_MESSAGES, ...messages };

  const isShowPagination = useMemo(
    () => totalPages > 1 && !isFetching && !isRequestError,
    [totalPages, isFetching, isRequestError],
  );

  useTableLayoutMeasure({
    bodyRef,
    paginationRef,
    setLayoutMeasure: setTableLayoutMeasure,
    wrapperRef: ref,
  });

  const bodyStyle = useMemo(() => {
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    const { bodyTop, paginationHeight, wrapperBottom } = tableLayoutMeasure;

    const paginationH = isShowPagination ? paginationHeight || DEFAULT_PAGINATION_HEIGHT : 0;

    const wrapperHeight = getAvailableHeight({
      end: wrapperBottom,
      padding,
      paginationHeight: paginationH,
      start: bodyTop,
    });

    const viewportHeight =
      inIframe || typeof window === 'undefined'
        ? null
        : getAvailableHeight({
            end: window.innerHeight,
            padding,
            paginationHeight: paginationH,
            start: bodyTop,
          });

    const calcPx = getConstrainedHeight(wrapperHeight, viewportHeight);

    if (calcPx > MIN_TABLE_BODY_HEIGHT) {
      return {
        height: `${calcPx}px`,
        overflowY: 'auto' as const,
      };
    }

    return {
      height: 'auto' as const,
      overflowY: 'visible' as const,
    };
  }, [tableLayoutMeasure, isShowPagination, padding]);

  const handleSort = (key: string, direction?: SortDirection) => {
    const next =
      direction ??
      (sort[key] === SortDirection.ASC
        ? SortDirection.DESC
        : sort[key] === SortDirection.DESC
          ? SortDirection.UNSORTED
          : SortDirection.ASC);

    setSort((prev) => {
      const resolvedDirection = prev[key] === next ? SortDirection.UNSORTED : next;

      const newSort = isMultiSorting
        ? { ...prev, [key]: resolvedDirection }
        : { [key]: resolvedDirection };

      onSortClick?.(newSort);

      return newSort;
    });
  };

  const totalCols = headers.length + (renderExpandedRow ? 1 : 0);

  const rows = useMemo(() => {
    if (isFetching) {
      return <TableLoading cols={totalCols} />;
    }
    if (isRequestError) {
      return (
        <Row>
          <Cell>
            <div className={styles.stateInner}>
              <BadRequestWidget t={t} onRefresh={onRefresh} />
            </div>
          </Cell>
        </Row>
      );
    }
    if (data.length === 0) {
      return (
        <Row>
          <Cell>
            <div className={styles.stateInner}>
              {emptyStateComponent ?? (
                <Flex alignX="center" direction="column" gap="4">
                  <NoResultsWidget t={t} />
                  {onAdd && (
                    <Button type="primary" onClick={onAdd}>
                      <Flex alignY="center" gap="2">
                        <Icon name="add" size="small" />
                        {addLabel}
                      </Flex>
                    </Button>
                  )}
                </Flex>
              )}
            </div>
          </Cell>
        </Row>
      );
    }

    return data.map((row, index) => {
      const rowKey = String(row.id ?? index);

      const cells = headers.map((header) => (
        <Cell key={header.key as string} width={header.width as any}>
          {header.render ? (
            header.render(row, index)
          ) : (
            <Text className={styles.ellipsis} weight="light">
              {row[header.key]}
            </Text>
          )}
        </Cell>
      ));

      if (renderExpandedRow) {
        const isExpanded = expandedRows.has(rowKey);

        return (
          <ExpandableRow
            key={rowKey}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={renderExpandedRow(row, index) as any}
            expanded={isExpanded}
            onClick={() => handleExpandToggle(rowKey)}
          >
            <Cell style={{ flex: '0 0 40px', minWidth: 40 }}>
              <Flex alignX="center" alignY="center" height="100%">
                <Icon
                  name={isExpanded ? 'expand_less' : 'expand_more'}
                  size="small"
                  style={{ color: theme.gray10 }}
                />
              </Flex>
            </Cell>
            {cells}
          </ExpandableRow>
        );
      }

      return <Row key={rowKey}>{cells}</Row>;
    });
  }, [
    data,
    headers,
    totalCols,
    isFetching,
    isRequestError,
    onRefresh,
    onAdd,
    addLabel,
    emptyStateComponent,
    renderExpandedRow,
    expandedRows,
    handleExpandToggle,
    t,
    theme.gray10,
  ]);

  return (
    <Flex
      className={styles.wrapper}
      data-co-surface="1"
      data-component={dataComponent}
      data-qa={dataQa}
      direction="column"
      forwardedRef={ref}
    >
      <Box className={styles.tableArea}>
        <Table>
          <Head>
            <Row>
              {renderExpandedRow && <HeadCell style={{ flex: '0 0 40px', minWidth: 40 }} />}
              {headers.map((header) => (
                <HeadCell key={header.key as string} width={header.width as any}>
                  <Flex alignY="center">
                    {typeof header.title === 'string' ? (
                      <Text
                        className={styles.ellipsis}
                        style={{
                          cursor: header.sortable ? 'pointer' : 'default',
                        }}
                        weight="medium"
                        onClick={() => header.sortable && handleSort(header.key as string)}
                      >
                        {header.title}
                      </Text>
                    ) : (
                      header.title
                    )}
                    {header.tooltip && (
                      <Tooltip
                        content={
                          // span with explicit width forces the popup to wrap text naturally.
                          // Cobalt Box is a flex container and squashes inline children to 1 char wide;
                          // a plain span avoids that constraint.
                          <span
                            style={{
                              display: 'block',
                              maxWidth: 300,
                              minWidth: 120,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              fontSize: 12,
                              lineHeight: '18px',
                            }}
                          >
                            {header.tooltip}
                          </span>
                        }
                        position={PositionCenterTop}
                        variation="dark"
                      >
                        <Icon
                          name="info_outline"
                          size="tiny"
                          style={{ color: theme.secondary11, marginLeft: 4 }}
                        />
                      </Tooltip>
                    )}
                    {header.sortable && (
                      <span className={styles.sortArrows}>
                        <span
                          className={[
                            styles.sortDropUp,
                            sort[header.key as string] === SortDirection.ASC && styles.sortActive,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-qa={`sort-${header.key as string}-asc`}
                          onClick={() => handleSort(header.key as string, SortDirection.ASC)}
                        />
                        <span
                          className={[
                            styles.sortDropDown,
                            sort[header.key as string] === SortDirection.DESC && styles.sortActive,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-qa={`sort-${header.key as string}-desc`}
                          onClick={() => handleSort(header.key as string, SortDirection.DESC)}
                        />
                      </span>
                    )}
                  </Flex>
                </HeadCell>
              ))}
            </Row>
          </Head>
          <Body
            // @ts-ignore
            forwardedRef={bodyRef}
            style={bodyStyle}
          >
            {messageComponent && (
              <Row>
                <Cell>{messageComponent}</Cell>
              </Row>
            )}
            {rows}
          </Body>
        </Table>
      </Box>
      {isShowPagination && (
        <Box className={styles.pagination} forwardedRef={paginationRef}>
          <Pagination
            currentPage={currentPage}
            maxPagesCount={maxPagesCount}
            nextLabel={msg.paginationNext}
            previousLabel={msg.paginationPrevious}
            totalPages={totalPages}
            onPageClick={onPageClick}
          />
        </Box>
      )}
    </Flex>
  );
};

export const BasicTable = BasicTableInner as <T extends BasicTableBaseType>(
  props: BasicTableProps<T>,
) => React.ReactElement;
