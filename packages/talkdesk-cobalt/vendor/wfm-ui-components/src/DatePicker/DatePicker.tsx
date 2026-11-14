/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react';
import CobaltDatePicker from '@talkdesk/cobalt-marketplace-react-datepicker';
import type { DatePickerProps as CobaltDatePickerProps } from '@talkdesk/cobalt-marketplace-react-datepicker';
import StatefulPopup from '@talkdesk/cobalt-marketplace-react-stateful-popup';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import Input from '@talkdesk/cobalt-react-input';
import type { CardinalPoint } from '@talkdesk/cobalt-react-position-hook';
import { FormField, type FormFieldProps } from '@wfm/ui-components';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAvailableYears(range: number): number[] {
  const current = new Date().getFullYear();
  const length = range * 2 + 1;

  return Array.from({ length }, (_, i) => current - range + i);
}

/** Convert a JS `Date` to Cobalt's `{ year, month, day }` shape. */
function dateToDay(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    // Cobalt month is 1-based
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/** Convert Cobalt's `{ year, month, day }` back to a JS `Date`. */
function dayToDate(day: { year: number; month: number; day: number }): Date {
  return new Date(day.year, day.month - 1, day.day);
}

/** Format a Date as `MMMM D, YYYY` (e.g. "April 22, 2026") — default when no `formatDate` or `displayValue` is provided. */
function formatDefault(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function applyFormat(date: Date, formatter?: (d: Date) => string): string {
  return formatter ? formatter(date) : formatDefault(date);
}

function getDescriptionProps(
  description?: string,
  variation?: 'error' | 'warning'
): Pick<FormFieldProps, 'description' | 'errorHint' | 'warningHint'> {
  if (variation === 'error') return { errorHint: description };
  if (variation === 'warning') return { warningHint: description };

  return { description };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DatePickerSize = 'small' | 'medium';

export type DatePickerProps = {
  /** Currently selected date. Pass `null` to show no selection. */
  value?: Date | null;
  /** Called when the user picks a date from the calendar. */
  onChange?: (date: Date) => void;
  /** Label rendered above the input. */
  label?: React.ReactNode;
  /** Shows a required asterisk next to the label when `label` is also set. */
  isRequired?: boolean;
  /** Placeholder text shown inside the input when no date is selected. */
  placeholder?: string;
  /** Input size. Default: `medium`. */
  size?: DatePickerSize;
  /** Whether the input fills its container width. Default: `false`. */
  isFullWidth?: boolean;
  /** Show the calendar icon prefix on the input. Default: `true`. */
  hasIcon?: boolean;
  /**
   * Override the formatted date string displayed in the input.
   * When omitted the date is formatted by `formatDate` or the default `MM/DD/YYYY`.
   */
  displayValue?: string;
  /**
   * Custom formatter applied to the selected date to produce the input display
   * string. Takes precedence over the built-in `MM/DD/YYYY` format but is
   * overridden by a static `displayValue`.
   *
   * @example
   * formatDate={(d) => d.toLocaleDateString('pt-PT')}
   */
  formatDate?: (date: Date) => string;
  /**
   * Years shown in the year-selection dropdown inside the calendar.
   * Defaults to a ±3-year range around the current year.
   */
  availableYears?: number[];
  /**
   * Days that cannot be selected. Accepts Cobalt's `DaysType`:
   * an array of `{ year, month, day }` objects or `{ start?, end? }` ranges.
   */
  disabledDays?: CobaltDatePickerProps['disabledDays'];
  /**
   * Days that are visually highlighted without being selected.
   * Same format as `disabledDays`.
   */
  highlightedDays?: CobaltDatePickerProps['highlightedDays'];
  /** Highlight today's date on the calendar. Default: `false`. */
  isHighlightToday?: boolean;
  /** First day of the week. `0` = Sunday (default), `1` = Monday. */
  weekStart?: CobaltDatePickerProps['weekStart'];
  /** Custom month names. Defaults to English names. */
  months?: CobaltDatePickerProps['months'];
  /** Custom weekday names. Defaults to English names. */
  weekdays?: CobaltDatePickerProps['weekdays'];
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

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  isRequired = false,
  placeholder,
  size = 'medium',
  isFullWidth = false,
  hasIcon = true,
  displayValue,
  formatDate,
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
  'data-component': dataComponent = 'WFMDatePicker',
}) => {
  const years = useMemo(
    () => availableYears ?? buildAvailableYears(DEFAULT_YEAR_RANGE),
    [availableYears]
  );

  const validDate =
    value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;

  const selectedDay = useMemo(
    () => (validDate ? dateToDay(validDate) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  );

  const inputDisplayValue = useMemo(
    () => displayValue ?? (validDate ? applyFormat(validDate, formatDate) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayValue, formatDate, value]
  );

  const inputId = `wfm-datepicker-input-${dataQa ?? 'default'}`;
  const descriptionProps = getDescriptionProps(description, variation);

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
            ...(isFullWidth ? { width: '100%' } : {}),
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
      {(close) => (
        <CobaltDatePicker
          withNavigation
          availableYears={years}
          data-qa={dataQa && `${dataQa}-calendar`}
          disabledDays={disabledDays}
          highlightToday={isHighlightToday}
          highlightedDays={highlightedDays}
          months={months}
          {...(selectedDay ? { selectedDay } : {})}
          weekStart={weekStart}
          weekdays={weekdays}
          onDayClick={(day) => {
            onChange?.(dayToDate(day));
            close();
          }}
        />
      )}
    </StatefulPopup>
  );

  if (label) {
    return (
      <FormField
        {...descriptionProps}
        data-component={dataComponent}
        data-qa={dataQa}
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
    <Box
      data-component={dataComponent}
      data-qa={dataQa}
      width={isFullWidth ? '100%' : undefined}
    >
      {popup}
    </Box>
  );
};
