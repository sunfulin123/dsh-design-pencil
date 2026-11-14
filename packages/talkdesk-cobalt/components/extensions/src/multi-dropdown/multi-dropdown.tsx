/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import CobaltMultiDropdown, {
  Option,
  Search,
  OnChangeOption,
} from '@talkdesk/cobalt-marketplace-react-multi-dropdown';
import Box from '@talkdesk/cobalt-react-box';
import Button from '@talkdesk/cobalt-react-button';
import { Text } from '@talkdesk/cobalt-react-typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MultiDropdownOptionValue = string | number;

/**
 * Context object passed to a custom option renderer. Use `onToggle` to
 * add/remove this option from the current selection.
 */
export type MultiDropdownOptionRenderContext = {
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Toggle this option in or out of the selection. */
  onToggle: () => void;
};

export type MultiDropdownOption = {
  /** Unique value submitted on selection. */
  value: MultiDropdownOptionValue;
  /** Display label shown in the list and as a tag in the trigger. */
  label: string;
  /** Prevents the option from being toggled when true. */
  disabled?: boolean;
  /** Optional secondary line shown below the label (built-in renderer only). */
  description?: string;
  /** Optional icon shown to the left of the label (built-in renderer only). */
  icon?: JSX.Element;
  /** Optional content rendered to the right of the label (built-in renderer only). */
  right?: React.ReactNode;
  /** Draw a divider below this option (built-in renderer only). */
  borderBottom?: boolean;
  /**
   * Custom renderer for this option's row. Replaces the default Cobalt
   * `Option` rendering — the consumer is responsible for the entire row
   * markup and must call `ctx.onToggle()` to add/remove the option from
   * the selection.
   */
  render?: (ctx: MultiDropdownOptionRenderContext) => React.ReactNode;
};

export type MultiDropdownMessages = {
  /** Placeholder shown on the trigger when nothing is selected. Default: `'Select options'`. */
  placeholder?: string;
  /** Search input placeholder. Default: `'Search'`. */
  searchPlaceholder?: string;
  /** Text shown when search returns no matches. Default: `'No results found'`. */
  noResults?: string;
  /** Label for the "Select all" row (only when `renderSelectAll` is `true`). Default: `'Select all'`. */
  selectAll?: string;
  /** Text shown in the list while a server-side search request is in flight. Default: `'Searching…'`. */
  searching?: string;
  /** Label on the "load more" button. Default: `'Load more…'`. */
  loadMore?: string;
  /** Label on the "load more" button while a request is in flight. Default: `'Loading…'`. */
  loading?: string;
};

export type MultiDropdownProps = {
  /** Currently selected option values. */
  value?: MultiDropdownOptionValue[];
  /** Options to render in the list. */
  options: MultiDropdownOption[];
  /** Called with the new array of selected values whenever the selection changes. */
  onChange: (value: MultiDropdownOptionValue[]) => void;
  /**
   * Global custom renderer applied to every option that does not define its
   * own `render`. Receives `{ selected, onToggle }`.
   */
  renderOption?: (
    option: MultiDropdownOption,
    ctx: MultiDropdownOptionRenderContext,
  ) => React.ReactNode;
  /** Enables the built-in client-side search filter. Default: `false`. */
  searchable?: boolean;
  /**
   * Called with the current search query whenever the user types. When provided,
   * client-side filtering is disabled — the parent controls `options` (server-side
   * search). Implies `searchable`.
   */
  onSearch?: (query: string) => void;
  /**
   * When true, shows `messages.searching` instead of `messages.noResults`.
   * Use this to indicate that a server-side search request is in flight.
   */
  isSearching?: boolean;
  /** Whether more options are available beyond the current list. Shows the "load more" button when true. */
  hasMore?: boolean;
  /** Indicates an in-flight load-more request. Disables the button and shows the loading label. */
  isLoadingMore?: boolean;
  /** Called when the user clicks the "load more" button. */
  onLoadMore?: () => void;
  /** Renders a "Select all" row at the top of the list. Default: `false`. */
  renderSelectAll?: boolean;
  /** Allows tags to be removed individually directly from the trigger. Default: `false`. */
  dismissValues?: boolean;
  /** Maximum number of selected tags shown in the trigger before collapsing into "+N". */
  maxVisibleValues?: number;
  /** Cobalt input and selected-tag size. */
  inputSize?: React.ComponentProps<typeof CobaltMultiDropdown>['inputSize'];
  /** Override the placeholder text size independently of selected tags. */
  placeholderSize?: React.ComponentProps<typeof Text>['size'];
  /** Height of the dropdown trigger. */
  height?: React.CSSProperties['height'];
  /** Class applied to the outer dropdown container. */
  className?: string;
  /** Disables interaction when true. */
  disabled?: boolean;
  /** Shows a loading state on the trigger. */
  loading?: boolean;
  /** Marks the trigger as in an error state. */
  error?: boolean;
  /** Customise visible text strings. All fields are optional — defaults are provided. */
  messages?: MultiDropdownMessages;
  /** ID of the visible label that names the dropdown trigger. */
  'aria-labelledby'?: string;
  'data-qa'?: string;
  'data-component'?: string;
  /**
   * Also opens the list when the container the dropdown renders into is
   * clicked, not only the trigger inside it. The trigger stops its own click
   * from bubbling, so this never toggles twice. Default: `false`.
   */
  openOnContainerClick?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CobaltSelectedOption = {
  title: string | number;
  value: string | number;
};

export const MultiDropdown: React.FC<MultiDropdownProps> = ({
  value = [],
  options,
  onChange,
  renderOption,
  searchable = false,
  onSearch,
  isSearching = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  renderSelectAll = false,
  dismissValues = false,
  maxVisibleValues,
  inputSize,
  placeholderSize,
  height,
  className,
  disabled = false,
  loading = false,
  error = false,
  messages,
  'aria-labelledby': ariaLabelledBy,
  'data-qa': dataQa,
  'data-component': dataComponent = 'MultiDropdown',
  openOnContainerClick = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [accessibleContainer, setAccessibleContainer] = React.useState<HTMLDivElement | null>(null);

  const handleContainerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (ariaLabelledBy) setAccessibleContainer(node);
    },
    [ariaLabelledBy],
  );

  // Cobalt 3.2 forwards HTML props to its outer div, not its role=button
  // trigger, and focuses an aria-hidden input on open. Its public API has no
  // trigger-props slot, so adapt the existing trigger only for labelled callers.
  React.useEffect(() => {
    if (!ariaLabelledBy) return undefined;

    const trigger = accessibleContainer?.querySelector<HTMLElement>('[role="button"]');

    if (!trigger) return undefined;

    const hiddenInput = trigger.querySelector<HTMLInputElement>('input[aria-hidden="true"]');

    const previousLabel = trigger.getAttribute('aria-labelledby');
    const previousTabIndex = trigger.getAttribute('tabindex');
    const previousDisabled = trigger.getAttribute('aria-disabled');
    const previousInputTabIndex = hiddenInput?.getAttribute('tabindex') ?? null;

    trigger.setAttribute('aria-labelledby', ariaLabelledBy);
    trigger.tabIndex = disabled || loading ? -1 : 0;
    trigger.setAttribute('aria-disabled', String(disabled || loading));
    if (hiddenInput) hiddenInput.tabIndex = -1;

    return () => {
      const restoreAttribute = (
        element: HTMLElement,
        name: string,
        attributeValue: string | null,
      ) => {
        if (attributeValue === null) element.removeAttribute(name);
        else element.setAttribute(name, attributeValue);
      };

      restoreAttribute(trigger, 'aria-labelledby', previousLabel);
      restoreAttribute(trigger, 'tabindex', previousTabIndex);
      restoreAttribute(trigger, 'aria-disabled', previousDisabled);
      if (hiddenInput) restoreAttribute(hiddenInput, 'tabindex', previousInputTabIndex);
    };
  }, [accessibleContainer, ariaLabelledBy, disabled, loading]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ariaLabelledBy || disabled || loading) return;

    const trigger = containerRef.current?.querySelector<HTMLElement>('[role="button"]');

    if (event.target !== trigger) return;
    if (!['Enter', ' ', 'ArrowDown'].includes(event.key)) return;

    event.preventDefault();
    if (event.key === 'ArrowDown' && trigger.getAttribute('data-co-focus') === 'true') return;
    trigger.click();
  };

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!ariaLabelledBy || disabled || loading) return;

    const trigger = containerRef.current?.querySelector<HTMLElement>('[role="button"]');

    if (event.target === trigger?.querySelector('input[aria-hidden="true"]')) {
      trigger.focus();
    }
  };

  /**
   * The trigger lives inside the Cobalt component, so a click on the container
   * it renders into would otherwise do nothing. Forward those clicks to the
   * trigger: the trigger stops its own clicks from bubbling, and clicks coming
   * from the portalled list are outside the container, so neither reaches here.
   */
  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;

    if (!container || !container.contains(event.target as Node)) return;
    if ((event.target as HTMLElement).closest('[role="button"]')) return;

    container.querySelector<HTMLElement>('[role="button"]')?.click();
  };

  const {
    placeholder = 'Select options',
    searchPlaceholder = 'Search',
    noResults = 'No results found',
    selectAll = 'Select all',
    searching = 'Searching…',
    loadMore = 'Load more…',
    loading: loadingLabel = 'Loading…',
  } = messages ?? {};

  const isSearchEnabled = searchable || Boolean(onSearch);

  // Map our public option shape to the Cobalt OptionSelected shape used for
  // `items` / `selectedValues` / the array passed to `onChange`.
  const items = React.useMemo<CobaltSelectedOption[]>(
    () => options.map((o) => ({ title: o.label, value: o.value })),
    [options],
  );

  const selectedValues = React.useMemo<CobaltSelectedOption[]>(
    () =>
      options
        .filter((o) => value.includes(o.value))
        .map((o) => ({ title: o.label, value: o.value })),
    [options, value],
  );

  const renderLoadMore = () =>
    hasMore && onLoadMore ? (
      <Box paddingX="4" paddingY="2">
        {/* onMouseDown prevents the dropdown from closing before onClick fires */}
        <Button
          data-qa={dataQa ? `${dataQa}-load-more` : null}
          disabled={isLoadingMore}
          shape="full-width"
          size="small"
          variation="transparent"
          onClick={() => onLoadMore()}
          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
        >
          {isLoadingMore ? loadingLabel : loadMore}
        </Button>
      </Box>
    ) : null;

  const renderRows = (rows: MultiDropdownOption[], onClick: OnChangeOption) =>
    rows.map((option) => {
      const isSelected = value.includes(option.value);

      // Toggle the option in/out of the current selection by handing the
      // full new array to the dropdown's onClick (which fires onChange).
      const onToggle = () => {
        if (option.disabled) return;

        const next = isSelected
          ? selectedValues.filter((s) => s.value !== option.value)
          : [...selectedValues, { title: option.label, value: option.value }];

        onClick(next);
      };

      const ctx = { selected: isSelected, onToggle };

      if (option.render) {
        return (
          <div key={option.value} data-qa={dataQa ? `${dataQa}-option-${option.value}` : null}>
            {option.render(ctx)}
          </div>
        );
      }

      if (renderOption) {
        return (
          <div key={option.value} data-qa={dataQa ? `${dataQa}-option-${option.value}` : null}>
            {renderOption(option, ctx)}
          </div>
        );
      }

      return (
        <Option
          key={option.value}
          borderBottom={option.borderBottom}
          data-qa={dataQa ? `${dataQa}-option-${option.value}` : null}
          description={option.description}
          disabled={option.disabled}
          icon={option.icon}
          right={option.right}
          selected={isSelected}
          title={option.label}
          value={option.value}
          onClick={onClick}
        />
      );
    });

  return (
    <CobaltMultiDropdown
      aria-labelledby={ariaLabelledBy}
      className={className}
      customValue={
        placeholderSize && selectedValues.length === 0 ? (
          <Text inline color="var(--text-placeholder, var(--gray-500))" size={placeholderSize}>
            {placeholder}
          </Text>
        ) : undefined
      }
      data-component={dataComponent}
      data-qa={dataQa}
      disabled={disabled}
      dismissValues={dismissValues}
      error={error}
      forwardedRef={handleContainerRef}
      height={height}
      inputSize={inputSize}
      items={items}
      loading={loading}
      maxVisibleValues={maxVisibleValues}
      messages={{ placeholder, selectAll }}
      renderSelectAll={renderSelectAll}
      searchable={isSearchEnabled}
      selectedValues={selectedValues}
      onChange={(opts) => onChange(opts.map((o) => o.value as MultiDropdownOptionValue))}
      onClick={openOnContainerClick ? handleContainerClick : undefined}
      onFocusCapture={ariaLabelledBy ? handleFocusCapture : undefined}
      onKeyDown={ariaLabelledBy ? handleKeyDown : undefined}
    >
      {
        // @ts-ignore: cobalt-marketplace-react-multi-dropdown render-prop generic
        ({ onClick }) => {
          if (isSearchEnabled) {
            return (
              <Search
                data-qa={dataQa ? `${dataQa}-search` : null}
                messages={{
                  noResults: isSearching ? searching : noResults,
                  placeholder: searchPlaceholder,
                }}
                onSearch={null}
              >
                {(query: string) => {
                  onSearch?.(query);

                  if (onSearch) {
                    return (
                      <>
                        {renderRows(options, onClick)}
                        {renderLoadMore()}
                      </>
                    );
                  }

                  const filtered = query
                    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
                    : options;

                  return (
                    <>
                      {renderRows(filtered, onClick)}
                      {renderLoadMore()}
                    </>
                  );
                }}
              </Search>
            );
          }

          return (
            <>
              {renderRows(options, onClick)}
              {renderLoadMore()}
            </>
          );
        }
      }
    </CobaltMultiDropdown>
  );
};
