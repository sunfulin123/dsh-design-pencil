import { PopupDismissBoundary } from '../internal/popup-dismiss-boundary';
/* eslint-disable complexity */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import CobaltDatePicker from '@talkdesk/cobalt-marketplace-react-datepicker';
import type { DatePickerProps as CobaltDatePickerProps } from '@talkdesk/cobalt-marketplace-react-datepicker';
import StatefulPopup from '@talkdesk/cobalt-marketplace-react-stateful-popup';
import Box from '@talkdesk/cobalt-react-box';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import Input from '@talkdesk/cobalt-react-input';
import type { CardinalPoint } from '@talkdesk/cobalt-react-position-hook';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { FormField } from '../form-field';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAvailableYears(range: number): number[] {
  const current = new Date().getFullYear();
  const length = range * 2 + 1;

  return Array.from({ length }, (_, i) => current - range + i);
}

function dateToDay(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function dayToDate(
  day: { year: number; month: number; day: number },
  hours: number,
  minutes: number,
): Date {
  return new Date(day.year, day.month - 1, day.day, hours, minutes, 0, 0);
}

function formatTime12(h: number, m: number): string {
  const meridian = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;

  return `${h12}:${String(m).padStart(2, '0')} ${meridian}`;
}

function formatTime24(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDefaultDateTime(date: Date, format24H: boolean): string {
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const h = date.getHours();
  const m = date.getMinutes();
  const timePart = format24H ? formatTime24(h, m) : formatTime12(h, m);

  return `${datePart}  ${timePart}`;
}

// ---------------------------------------------------------------------------
// TimeInputField — unstyled input, strict validation matching TimeNumberStepper
// ---------------------------------------------------------------------------
type TimeInputFieldProps = {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onBlur?: () => void;
};

const MIN_LENGTH = 2;

function clampValue(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;

  return n;
}

function formatPadded(n: number): string {
  return String(n).padStart(MIN_LENGTH, '0');
}

const TimeInputField: React.FC<TimeInputFieldProps> = ({
  value,
  min,
  max,
  disabled = false,
  onChange,
  onBlur,
}) => {
  const [display, setDisplay] = React.useState(() => formatPadded(value));
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    setDisplay(formatPadded(value));
  }, [value]);

  // Mirrors TimeNumberStepper.handleBlur — clamp, pad, commit
  const commit = (raw: string | number) => {
    const parsed = parseInt(`${raw}`, 10);
    const valid = Number.isNaN(parsed) ? min : clampValue(parsed, min, max);

    setDisplay(formatPadded(valid));
    onChange(valid);
  };

  // Mirrors TimeNumberStepper.update — fires on every input keystroke
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const inputValue = (e.target as HTMLInputElement).value;
    let numberValue = parseInt(inputValue, 10);

    if (inputValue === '') {
      setDisplay('');

      return;
    }

    // Stepper increment past max → wrap to min
    if (numberValue > max) {
      if (numberValue === value + 1) {
        commit(min);

        return;
      }

      // Typed a value exceeding max → keep only last digit (same as shared)
      numberValue = parseInt(inputValue.at(-1) ?? `${min}`, 10);
    }

    // Stepper decrement below min → wrap to max
    if (numberValue < min) {
      commit(max);

      return;
    }

    if (!Number.isNaN(numberValue) && numberValue >= min && numberValue <= max) {
      commit(numberValue);

      return;
    }

    if (Number.isNaN(numberValue)) {
      commit(min);
    }
  };

  const handleBlur = () => {
    commit(display === '' ? min : display);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      commit(value >= max ? min : value + 1);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      commit(value <= min ? max : value - 1);
    }
  };

  return (
    <Flex style={{ height: '100%' }}>
      <Input
        disabled={disabled}
        style={{
          width: '100%',
          height: '100%',
          padding: 0,
          fontSize: 14,
          fontWeight: 400,
          borderRadius: 4,
          background: hovered && !disabled ? 'var(--gray-4)' : 'transparent',
          opacity: disabled ? 'var(--opacity-medium, 0.4)' : undefined,
          cursor: disabled ? 'not-allowed' : undefined,
        }}
        textAlign="center"
        type="number"
        value={display}
        variation="unstyled"
        onBlur={handleBlur}
        onChange={() => null}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    </Flex>
  );
};

// MeridianToggle — AM/PM button with hover effect
// ---------------------------------------------------------------------------
const MeridianToggle: React.FC<{
  meridian: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ meridian, disabled = false, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Flex
      alignY="center"
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0 var(--base-spacing, 8px)',
        height: '100%',
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 500,
        userSelect: 'none',
        marginLeft: 4,
        flexShrink: 0,
        opacity: disabled ? 'var(--opacity-medium, 0.4)' : undefined,
        background: hovered && !disabled ? 'var(--gray-4)' : 'transparent',
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {meridian}
    </Flex>
  );
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateTimePickerSize = 'small' | 'medium';

export type DateTimePickerProps = {
  /** Currently selected date and time. Pass `null` to show no selection. */
  value?: Date | null;
  /** Called when the user picks a date or adjusts the time. */
  onChange?: (date: Date) => void;
  /** Label rendered above the input. */
  label?: string;
  /** Shows a required asterisk next to the label when `label` is also set. */
  isRequired?: boolean;
  /** Placeholder text shown when no date is selected. */
  placeholder?: string;
  /** Input size. Default: `medium`. */
  size?: DateTimePickerSize;
  /** Whether the input fills its container width. Default: `false`. */
  isFullWidth?: boolean;
  /** Show the calendar icon prefix. Default: `true`. */
  hasIcon?: boolean;
  /** Show time in 24-hour format. Default: `false` (12-hour with AM/PM). */
  format24H?: boolean;
  /**
   * Custom formatter applied to the selected Date to produce the trigger
   * display string. When omitted, defaults to `"MMMM D, YYYY  H:MM AM/PM"`.
   */
  formatDateTime?: (date: Date) => string;
  /**
   * Years shown in the year-selection dropdown inside the calendar.
   * Defaults to ±3 years around the current year.
   */
  availableYears?: number[];
  /** Days that cannot be selected. Cobalt `DaysType` format. */
  disabledDays?: CobaltDatePickerProps['disabledDays'];
  /** Days visually highlighted without being selected. */
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
  /** Disables the entire picker. */
  disabled?: boolean;
  /** Disables only the minutes input while keeping hours/meridian editable. */
  disabledMinutes?: boolean;
  /** Called when the time inputs lose focus. */
  onBlur?: () => void;
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

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  isRequired = false,
  placeholder,
  size = 'medium',
  isFullWidth = false,
  hasIcon = true,
  format24H = false,
  formatDateTime,
  availableYears,
  disabledDays,
  highlightedDays,
  isHighlightToday = false,
  weekStart,
  months,
  weekdays,
  variation,
  description,
  disabled = false,
  disabledMinutes = false,
  onBlur,
  direction = 'SE',
  origin = 'SW',
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMDateTimePicker',
}) => {
  const theme = useTheme();
  const nativeTarget = React.useRef<HTMLElement | null>(null);

  const validDate = value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;

  const [localHours, setLocalHours] = useState(() => validDate?.getHours() ?? 0);

  const [localMinutes, setLocalMinutes] = useState(() => validDate?.getMinutes() ?? 0);

  // Sync local time state when controlled value changes from outside
  useEffect(() => {
    setLocalHours(validDate?.getHours() ?? 0);
    setLocalMinutes(validDate?.getMinutes() ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const years = useMemo(
    () => availableYears ?? buildAvailableYears(DEFAULT_YEAR_RANGE),
    [availableYears],
  );

  const selectedDay = useMemo(
    () => (validDate ? dateToDay(validDate) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  );

  const inputDisplayValue = useMemo(() => {
    if (!validDate) {
      return '';
    }

    const dateWithTime = new Date(validDate);

    dateWithTime.setHours(localHours);
    dateWithTime.setMinutes(localMinutes);

    return formatDateTime
      ? formatDateTime(dateWithTime)
      : formatDefaultDateTime(dateWithTime, format24H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, localHours, localMinutes, format24H, formatDateTime]);

  // 12H display conversion
  const is12H = !format24H;
  const meridian = localHours >= 12 ? 'PM' : 'AM';
  const displayHours = is12H ? localHours % 12 || 12 : localHours;
  const maxHours = is12H ? 12 : 23;
  const minHours = is12H ? 1 : 0;

  const fireChange = (h: number, m: number) => {
    const base = validDate ? new Date(validDate) : new Date();

    base.setHours(h);
    base.setMinutes(m);
    base.setSeconds(0);
    base.setMilliseconds(0);
    onChange?.(base);
  };

  const handleHoursChange = (h: number) => {
    let h24 = h;

    if (is12H) {
      h24 = meridian === 'PM' ? (h % 12) + 12 : h % 12;
    }

    setLocalHours(h24);
    fireChange(h24, localMinutes);
  };

  const handleMinutesChange = (m: number) => {
    setLocalMinutes(m);
    fireChange(localHours, m);
  };

  const handleMeridianToggle = () => {
    const newHours =
      meridian === 'AM' ? Math.min(localHours + 12, 23) : Math.max(localHours - 12, 0);

    setLocalHours(newHours);
    fireChange(newHours, localMinutes);
  };

  const handleDayClick = (day: { year: number; month: number; day: number }) => {
    const newDate = dayToDate(day, localHours, localMinutes);

    onChange?.(newDate);
  };

  const inputId = `wfm-datetimepicker-input-${dataQa ?? 'default'}`;

  const popup = (
    <StatefulPopup
      keepOpen
      targetProps={{
        onPointerDownCapture: (event: React.PointerEvent<HTMLElement>) => {
          nativeTarget.current = event.currentTarget;
        },
        onFocusCapture: (event: React.FocusEvent<HTMLElement>) => {
          nativeTarget.current = event.currentTarget;
        },
      }}
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
                  minWidth: `${Math.max(
                    (inputDisplayValue || placeholder || '').length + 4,
                    14,
                  )}ch`,
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
      {(close, { isVisible }) => (
        <PopupDismissBoundary close={close} active={isVisible} trigger={() => nativeTarget.current}>
          <Flex direction="column">
            {/* Calendar */}
            <Box width="100%">
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
                onDayClick={handleDayClick}
              />
            </Box>

            {/* Time picker */}
            <Divider />
            <Flex
              alignY="center"
              paddingX="4"
              paddingY="1"
              style={{ flexWrap: 'nowrap', height: 40 }}
            >
              <Icon
                name="time"
                size="tiny"
                style={{
                  color: theme.textDescription,
                  flexShrink: 0,
                  marginRight: 8,
                  marginLeft: 8,
                }}
              />
              <TimeInputField
                disabled={disabled}
                max={maxHours}
                min={minHours}
                value={displayHours}
                onBlur={onBlur}
                onChange={handleHoursChange}
              />
              <Flex
                alignY="center"
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: 'var(--text-default)',
                  padding: '0 2px',
                  flexShrink: 0,
                }}
              >
                :
              </Flex>
              <TimeInputField
                disabled={disabled || disabledMinutes}
                max={59}
                min={0}
                value={localMinutes}
                onBlur={onBlur}
                onChange={handleMinutesChange}
              />
              {is12H && (
                <MeridianToggle
                  disabled={disabled}
                  meridian={meridian}
                  onClick={handleMeridianToggle}
                />
              )}
            </Flex>
          </Flex>
        </PopupDismissBoundary>
      )}
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
