/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import CobaltDropdown, {
  Option,
} from '@talkdesk/cobalt-marketplace-react-dropdown';
import {
  OnChangeOption,
  Search,
} from '@talkdesk/cobalt-marketplace-react-dropdown-utils';
import Box from '@talkdesk/cobalt-react-box';
import Button from '@talkdesk/cobalt-react-button';
import { Name as IconName } from '@talkdesk/cobalt-react-icon';
import { Text } from '@talkdesk/cobalt-react-typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DropdownOptionValue = string | number;

/** Trigger height. `'small'` matches `DatePicker`/`Input` `size="small"`. Default: `'medium'`. */
export type DropdownSize = 'small' | 'medium';

/**
 * Context object passed to a custom option renderer. Use `onSelect` to commit
 * the option as the dropdown's selected value (closes the dropdown by default).
 */
export type DropdownOptionRenderContext = {
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Commit selection — closes the dropdown and fires `onChange`. */
  onSelect: () => void;
};

export type DropdownOption = {
  /** Unique value submitted on selection. */
  value: DropdownOptionValue;
  /** Display label shown in the list and on the trigger. */
  label: string;
  /** Prevents the option from being selected when true. */
  disabled?: boolean;
  /** Optional secondary line shown below the label (built-in renderer only). */
  description?: string;
  /** Optional Cobalt icon name shown to the left of the label (built-in renderer only). */
  icon?: IconName | JSX.Element;
  /** Optional content rendered to the right of the label (built-in renderer only). */
  right?: React.ReactNode;
  /** Draw a divider below this option (built-in renderer only). */
  borderBottom?: boolean;
  /**
   * Custom renderer for this option's row. When provided, replaces the default
   * Cobalt `Option` rendering — the consumer is responsible for the entire
   * option row markup and must call `ctx.onSelect()` to commit the selection.
   */
  render?: (ctx: DropdownOptionRenderContext) => React.ReactNode;
};

export type DropdownMessages = {
  /** Placeholder shown on the trigger when no value is selected. Default: `'Select an option'`. */
  placeholder?: string;
  /** Search input placeholder. Default: `'Search'`. */
  searchPlaceholder?: string;
  /** Text shown when search returns no matches. Default: `'No results found'`. */
  noResults?: string;
  /** Text shown in the list while a server-side search request is in flight. Default: `'Searching…'`. */
  searching?: string;
  /** Label on the "load more" button. Default: `'Load more…'`. */
  loadMore?: string;
  /** Label on the "load more" button while a request is in flight. Default: `'Loading…'`. */
  loading?: string;
};

export type DropdownProps = {
  /** Currently selected option value. */
  value?: DropdownOptionValue | null;
  /** Options to render in the list. */
  options: DropdownOption[];
  /** Called with the selected value when the user picks an option. */
  onChange: (value: DropdownOptionValue) => void;
  /**
   * Global custom renderer applied to every option that does not define its
   * own `render`. Useful for theming the whole list (e.g. avatar rows, swatch
   * rows). The consumer must call `ctx.onSelect()` to commit the selection.
   */
  renderOption?: (
    option: DropdownOption,
    ctx: DropdownOptionRenderContext
  ) => React.ReactNode;
  /** Enables the built-in client-side search filter. Default: `false`. */
  searchable?: boolean;
  /**
   * Called with the current search query whenever the user types. When provided,
   * client-side filtering is disabled — the parent controls `options`
   * (server-side search). Implies `searchable`.
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
  /** Trigger size. Use `'small'` to align with `DatePicker`/`Input size="small"` in toolbars. Default: `'medium'`. */
  size?: DropdownSize;
  /** Disables interaction when true. */
  disabled?: boolean;
  /** Shows a loading state on the trigger. */
  loading?: boolean;
  /** Marks the trigger as in an error state. */
  error?: boolean;
  /** Customise visible text strings. All fields are optional — defaults are provided. */
  messages?: DropdownMessages;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  renderOption,
  searchable = false,
  onSearch,
  isSearching = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  size = 'medium',
  disabled = false,
  loading = false,
  error = false,
  messages,
  'data-qa': dataQa,
  'data-component': dataComponent = 'Dropdown',
}) => {
  const {
    placeholder = 'Select an option',
    searchPlaceholder = 'Search',
    noResults = 'No results found',
    searching = 'Searching…',
    loadMore = 'Load more…',
    loading: loadingLabel = 'Loading…',
  } = messages ?? {};

  const isSearchEnabled = searchable || Boolean(onSearch);
  const selectedOption = options.find((o) => o.value === value);

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

  const renderRows = (rows: DropdownOption[], onClick: OnChangeOption) =>
    rows.map((option) => {
      const isSelected = option.value === value;

      // Always commit selection through the dropdown's onClick so the
      // dropdown closes and `onChange` fires through the Cobalt pipeline.
      const onSelect = () => {
        if (option.disabled) return;
        onClick({ value: option.value, title: option.label });
      };

      const ctx = { selected: isSelected, onSelect };

      if (option.render) {
        return (
          <div
            // Custom render path: the consumer fully controls the row markup.
            // We wrap with a div for stable key + data-qa scoping, but do not
            // attach click handlers so the renderer can opt-in via ctx.onSelect.
            key={option.value}
            data-qa={dataQa ? `${dataQa}-option-${option.value}` : null}
          >
            {option.render(ctx)}
          </div>
        );
      }

      if (renderOption) {
        return (
          <div
            key={option.value}
            data-qa={dataQa ? `${dataQa}-option-${option.value}` : null}
          >
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
          onClick={(o) => onClick({ value: o.value, title: o.title })}
        />
      );
    });

  return (
    <CobaltDropdown
      data-component={dataComponent}
      data-qa={dataQa}
      disabled={disabled}
      error={error}
      inputSize={size}
      loading={loading}
      searchable={isSearchEnabled}
      value={
        selectedOption ? (
          <Text inline>{selectedOption.label}</Text>
        ) : (
          <Text color="var(--text-placeholder)">{placeholder}</Text>
        )
      }
      onChange={(option) => onChange(option.value as DropdownOptionValue)}
    >
      {
        // @ts-ignore: cobalt-marketplace-react-dropdown render-prop generic
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
                    ? options.filter((o) =>
                        o.label.toLowerCase().includes(query.toLowerCase())
                      )
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
    </CobaltDropdown>
  );
};
