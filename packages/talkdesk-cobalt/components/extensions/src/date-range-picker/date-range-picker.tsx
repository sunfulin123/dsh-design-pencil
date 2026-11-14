/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Day, DaysRange } from '@talkdesk/cobalt-marketplace-react-datepicker-utils';
import type { DateRangePickerProps as CobaltDateRangePickerProps } from '@talkdesk/cobalt-marketplace-react-daterangepicker';
import CobaltDateRangePicker from '@talkdesk/cobalt-marketplace-react-daterangepicker';
import StatefulPopup from '@talkdesk/cobalt-marketplace-react-stateful-popup';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import Input from '@talkdesk/cobalt-react-input';
import type { CardinalPoint } from '@talkdesk/cobalt-react-position-hook';
import { FormField } from '../form-field';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAvailableYears(range: number): number[] {
  const current = new Date().getFullYear();
  const length = range * 2 + 1;

  return Array.from({ length }, (_, i) => current - range + i);
}

function cobaltDayToDate(day: Day): Date {
  return new Date(day.year, day.month - 1, day.day);
}

function dateToCobaltDay(date: Date): Day {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function formatDateDefault(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateRange = {
  startDate?: Date;
  endDate?: Date;
};

export type DateRangePickerSize = 'small' | 'medium';

export type DateRangePickerProps = {
  /** Currently selected date range. */
  selectedRange: DateRange;
  /** Called whenever the user changes the selected range. */
  onRangeChange: (range: DateRange) => void;
  /** Label rendered above the input. */
  label?: string;
  /** Shows a required asterisk next to the label when `label` is also set. */
  isRequired?: boolean;
  /** Placeholder text shown when no range is selected. */
  placeholder?: string;
  /** Input size. Default: `'medium'`. */
  size?: DateRangePickerSize;
  /** Whether the input fills its container width. Default: `false`. */
  isFullWidth?: boolean;
  /** Show the calendar icon prefix. Default: `true`. */
  hasIcon?: boolean;
  /**
   * Custom formatter for a single date in the trigger display string.
   * When omitted, defaults to `"MMMM D, YYYY"`.
   */
  formatDate?: (date: Date) => string;
  /**
   * Years shown in the calendar year dropdown.
   * Defaults to ±3 years around the current year.
   */
  availableYears?: number[];
  /** Days that cannot be selected. */
  disabledDays?: CobaltDateRangePickerProps['disabledDays'];
  /** Days visually highlighted without being selected. */
  highlightedDays?: CobaltDateRangePickerProps['highlightedDays'];
  /** Highlight today's date on the calendar. Default: `false`. */
  isHighlightToday?: boolean;
  /** First day of the week. `0` = Sunday (default), `1` = Monday. */
  weekStart?: CobaltDateRangePickerProps['weekStart'];
  /** Custom month names. Defaults to English names. */
  months?: CobaltDateRangePickerProps['months'];
  /** Custom weekday names. Defaults to English names. */
  weekdays?: CobaltDateRangePickerProps['weekdays'];
  /** Applies a validation border colour to the input group. */
  variation?: 'error' | 'warning';
  /** Helper / validation message rendered below the input. */
  description?: string;
  /** Direction the popup opens relative to the trigger. Default: `'SE'`. */
  direction?: CardinalPoint;
  /** Origin point on the popup that aligns to the trigger. Default: `'SW'`. */
  origin?: CardinalPoint;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DEFAULT_YEAR_RANGE = 3;
const ARROW = ' → ';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onRangeChange,
  label,
  isRequired = false,
  placeholder = 'Select date range',
  size = 'medium',
  isFullWidth = false,
  hasIcon = true,
  formatDate = formatDateDefault,
  availableYears,
  disabledDays,
  highlightedDays,
  isHighlightToday = false,
  weekStart,
  months,
  weekdays,
  variation,
  description,
  direction = 'SE',
  origin = 'SW',
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMDateRangePicker',
}) => {
  const { startDate, endDate } = selectedRange;

  // Internal Cobalt DaysRange state
  const [cobaltRange, setCobaltRange] = useState<DaysRange | undefined>(() => {
    if (!startDate && !endDate) return undefined;

    return {
      ...(startDate ? { start: dateToCobaltDay(startDate) } : {}),
      ...(endDate ? { end: dateToCobaltDay(endDate) } : {}),
    };
  });

  // Sync when controlled value changes from outside
  useEffect(() => {
    setCobaltRange(
      startDate || endDate
        ? {
            ...(startDate ? { start: dateToCobaltDay(startDate) } : {}),
            ...(endDate ? { end: dateToCobaltDay(endDate) } : {}),
          }
        : undefined,
    );
  }, [startDate, endDate]);

  const years = useMemo(
    () => availableYears ?? buildAvailableYears(DEFAULT_YEAR_RANGE),
    [availableYears],
  );

  // Build trigger display string
  const inputDisplayValue = useMemo(() => {
    if (!startDate) return '';

    const start = formatDate(startDate);

    if (!endDate) return `${start}${ARROW}`;

    // Same-day selection → show single date
    if (startDate.toDateString() === endDate.toDateString()) return start;

    return `${start}${ARROW}${formatDate(endDate)}`;
  }, [startDate, endDate, formatDate]);

  const handleRangeChange = useCallback(
    (newRange: DaysRange) => {
      if (newRange === cobaltRange) return;

      setCobaltRange(newRange);

      const toDate = (day: Day | undefined): Date | undefined =>
        day ? cobaltDayToDate(day) : undefined;

      onRangeChange({
        startDate: toDate(newRange.start),
        endDate: toDate(newRange.end),
      });
    },
    [cobaltRange, onRangeChange],
  );

  const inputId = `wfm-daterangepicker-input-${dataQa ?? 'default'}`;

  const popup = (
    <StatefulPopup
      keepOpen
      direction={direction}
      fullWidthTarget={isFullWidth}
      origin={origin}
      target={
        <Flex
          direction="column"
          style={{
            overflow: 'visible',
            padding: '2px',
            ...(isFullWidth
              ? { width: '100%' }
              : {
                  minWidth: `${Math.max((inputDisplayValue || placeholder).length + 4, 18)}ch`,
                }),
          }}
        >
          <FormField
            prefix={hasIcon ? <Icon name="calendar" size="tiny" /> : null}
            size={size}
            variation={variation}
          >
            <Input
              readOnly
              data-qa={dataQa && `${dataQa}-input`}
              id={inputId}
              placeholder={placeholder}
              size={size}
              style={{
                cursor: 'pointer',
                padding: '0 8px',
              }}
              tabIndex={-1}
              value={inputDisplayValue}
              variation={hasIcon ? 'unstyled' : undefined}
              onChange={() => null}
            />
          </FormField>
        </Flex>
      }
    >
      <CobaltDateRangePicker
        withNavigation
        availableYears={years}
        data-qa={dataQa && `${dataQa}-calendar`}
        disabledDays={disabledDays}
        highlightToday={isHighlightToday}
        highlightedDays={highlightedDays}
        months={months}
        selectedDay={cobaltRange}
        weekStart={weekStart}
        weekdays={weekdays}
        onDayClick={handleRangeChange}
      />
    </StatefulPopup>
  );

  if (label) {
    return (
      <FormField
        data-component={dataComponent}
        data-qa={dataQa}
        description={description}
        htmlFor={inputId}
        isRequired={isRequired}
        label={label}
        variation={variation}
      >
        {popup}
      </FormField>
    );
  }

  return (
    <Box data-component={dataComponent} data-qa={dataQa} width={isFullWidth ? '100%' : undefined}>
      {popup}
    </Box>
  );
};
