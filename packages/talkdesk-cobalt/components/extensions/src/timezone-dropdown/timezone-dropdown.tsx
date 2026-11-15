/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PopupDismissBoundary } from '../internal/popup-dismiss-boundary';
import React, { useState } from 'react';
import CobaltDropdown, { Option } from '@talkdesk/cobalt-marketplace-react-dropdown';
import {
  GroupOptions,
  Search,
  useDropdown,
} from '@talkdesk/cobalt-marketplace-react-dropdown-utils';
import StatefulButton from '@talkdesk/cobalt-marketplace-react-stateful-button';
import Box from '@talkdesk/cobalt-react-box';
import { Text } from '@talkdesk/cobalt-react-typography';
import timezones from './timezones.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimezoneDropdownMessages = {
  /** Placeholder text shown in the search input. Default: `'Search'`. */
  searchPlaceholder?: string;
  /** Text shown when the search query matches nothing. Default: `'No results found'`. */
  noResults?: string;
  /** Placeholder shown on the dropdown trigger when no value is selected. Default: `'Select timezone'`. */
  placeholder?: string;
  /** Label on the button that loads more options when the list is truncated. Default: `'Show more…'`. */
  showMore?: string;
};

export type TimezoneDropdownProps = {
  /** The currently selected IANA timezone string (e.g. `'Europe/Lisbon'`). */
  value: string;
  /** Called with the new IANA timezone string when the user selects an option. */
  onChange: (value: string) => void;
  /** Optional Cobalt trigger element. The native dropdown wires its click/ref; it keeps the same searchable timezone popup. */
  customInput?: React.ReactElement;
  /** Disables interaction when true. */
  disabled?: boolean;
  /** Customise visible text strings. All fields are optional — defaults are provided. */
  messages?: TimezoneDropdownMessages;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ResolvedTimezone = {
  groupName?: string;
  title?: string;
  value?: string;
};

function resolveSelected(selectedValue: string): ResolvedTimezone {
  const group = timezones.find((tz) => tz.items.some((item) => item.value === selectedValue));

  const item = group?.items.find((i) => i.value === selectedValue);

  return { ...item, groupName: group?.groupName };
}

// Number of groups rendered on first open (no search query).
// Search always renders all matching results regardless of this limit.
const INITIAL_GROUPS = 10;
const LOAD_MORE_STEP = 10;

function filterTimezones(query: string) {
  if (!query) return timezones;
  const q = query.toLowerCase();

  return timezones
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.title.toLowerCase().startsWith(q) || group.groupName.toLowerCase().startsWith(q),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

function getVisibleGroups(
  query: string,
  selectedValue: string | undefined,
  visibleCount: number,
): { groups: ReturnType<typeof filterTimezones>; hasMore: boolean } {
  const results = filterTimezones(query);

  // When the user is searching, show all results.
  if (query) return { groups: results, hasMore: false };

  // No search: limit to visibleCount, but always include the group that
  // contains the currently selected value so it remains visible.
  const limited = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  if (!selectedValue || limited.some((g) => g.items.some((i) => i.value === selectedValue))) {
    return { groups: limited, hasMore };
  }

  const selectedGroup = results.find((g) => g.items.some((i) => i.value === selectedValue));

  return {
    groups: selectedGroup ? [...limited, selectedGroup] : limited,
    hasMore,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Keep a custom trigger named and synchronized with the native popup state. */
const TimezoneTrigger = React.forwardRef<
  HTMLElement,
  {
    input: React.ReactElement;
    disabled: boolean;
    onClick?: React.MouseEventHandler<HTMLElement>;
  }
>(({ input, disabled, onClick }, ref) => {
  const { inputProps } = useDropdown();
  return React.cloneElement(input, { ref, disabled, onClick, 'aria-expanded': inputProps.open });
});
TimezoneTrigger.displayName = 'TimezoneTrigger';

export const TimezoneDropdown: React.FC<TimezoneDropdownProps> = ({
  value,
  onChange,
  customInput,
  disabled = false,
  messages,
  'data-qa': dataQa,
  'data-component': dataComponent = 'TimezoneDropdown',
}) => {
  const dropdownRoot = React.useRef<HTMLDivElement>(null);
  const selected = resolveSelected(value);
  const [visibleCount, setVisibleCount] = useState(INITIAL_GROUPS);
  // eslint-disable-next-line padding-line-between-statements
  const {
    searchPlaceholder = 'Search',
    noResults = 'No results found',
    placeholder = 'Select timezone',
    showMore = 'Show more…',
  } = messages ?? {};

  return (
    <CobaltDropdown
      forwardedRef={dropdownRoot}
      searchable
      contentSize={customInput ? 'medium' : undefined}
      customInput={
        customInput ? <TimezoneTrigger input={customInput} disabled={disabled} /> : undefined
      }
      data-component={dataComponent}
      data-qa={dataQa}
      disabled={disabled}
      value={
        selected.title ? (
          <>
            <Text inline color="var(--text-description)" weight="medium">
              {selected.groupName}:{' '}
            </Text>
            <Text inline>{selected.title}</Text>
          </>
        ) : (
          <Text color="var(--text-placeholder)">{placeholder}</Text>
        )
      }
      onChange={(option) => {
        onChange(option.value as string);
      }}
    >
      {
        // @ts-ignore: Dropdown render-prop type inconsistency
        ({ onClick, setIsOpen }) => (
          <PopupDismissBoundary
            close={() => setIsOpen(false)}
            trigger={() =>
              dropdownRoot.current?.querySelector<HTMLElement>('button, [role="button"]')
            }
          >
            <Search
              data-qa={dataQa ? `${dataQa}-search` : 'timezone-dropdown-search'}
              messages={{
                noResults,
                placeholder: searchPlaceholder,
              }}
              onSearch={null}
            >
              {(query: string) => {
                const { groups, hasMore } = getVisibleGroups(query, selected.value, visibleCount);

                return (
                  <>
                    {groups.map(({ groupName, items }) => (
                      <GroupOptions key={groupName} title={groupName}>
                        {items.map((item) => (
                          <Option
                            key={item.value}
                            data-qa={`${dataQa ? `${dataQa}-` : ''}option-${item.value}`}
                            selected={selected.value === item.value}
                            title={item.title}
                            value={item.value}
                            onClick={(option) => onClick({ ...option })}
                          />
                        ))}
                      </GroupOptions>
                    ))}
                    {hasMore && (
                      <Box paddingX="4" paddingY="2">
                        {/* onMouseDown prevents the dropdown from closing before onClick fires */}
                        <StatefulButton
                          data-qa={dataQa ? `${dataQa}-show-more` : 'timezone-dropdown-show-more'}
                          shape="full-width"
                          size="small"
                          variation="transparent"
                          onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                        >
                          {showMore}
                        </StatefulButton>
                      </Box>
                    )}
                  </>
                );
              }}
            </Search>
          </PopupDismissBoundary>
        )
      }
    </CobaltDropdown>
  );
};
