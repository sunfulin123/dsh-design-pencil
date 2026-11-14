/* eslint-disable no-restricted-globals */
/* eslint-disable complexity */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import Input from '@talkdesk/cobalt-react-input';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Text } from '@talkdesk/cobalt-react-typography';

// ---------------------------------------------------------------------------
// Internal time-math utilities (no dependency on packages/shared)
// ---------------------------------------------------------------------------

const AM = 'AM';
const PM = 'PM';

type TimeObject = { hours: number; minutes: number; meridian?: string };

function padTo2(n: number): string {
  return String(n).padStart(2, '0');
}

function toTimeObject(totalMinutes: number, format24H: boolean): TimeObject {
  const safe = Math.max(0, Math.min(totalMinutes, 1439));

  if (format24H) {
    return { hours: Math.floor(safe / 60), minutes: safe % 60 };
  }

  // 12-hour
  if (safe < 60) return { hours: 12, minutes: safe, meridian: AM };
  if (safe < 720)
    return { hours: Math.floor(safe / 60), minutes: safe % 60, meridian: AM };
  if (safe < 780) return { hours: 12, minutes: safe % 60, meridian: PM };

  return {
    hours: Math.floor((safe - 720) / 60),
    minutes: (safe - 720) % 60,
    meridian: PM,
  };
}

function toTotalMinutes(t: TimeObject, format24H: boolean): number {
  const { hours, minutes, meridian } = t;

  if (format24H || meridian === AM) {
    if (!format24H && hours === 12) return minutes;

    return hours * 60 + minutes;
  }

  if (hours === 12) return minutes + 720;

  return hours * 60 + minutes + 720;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// NumberInput — a thin unstyled stepper for hours / minutes
// ---------------------------------------------------------------------------

type NumberInputProps = {
  id?: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  /** data-qa attribute forwarded to the <input> element */
  dataQa?: string;
  onChange: (value: number) => number | void;
  forwardedRef?: React.RefObject<HTMLInputElement>;
};

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  value,
  min,
  max,
  disabled = false,
  dataQa,
  onChange,
  forwardedRef,
}) => {
  const theme = useTheme();
  const [display, setDisplay] = useState(padTo2(value));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setDisplay(padTo2(clamp(value, min, max)));
  }, [value, min, max]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const safe = isNaN(parsed) ? min : clamp(parsed, min, max);
    const accepted = onChange(safe);

    setDisplay(padTo2(typeof accepted === 'number' ? accepted : safe));
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.value;

    setDisplay(raw);

    const parsed = parseInt(raw, 10);

    if (isNaN(parsed)) return;

    const safe = clamp(parsed, min, max);

    if (safe !== parsed) return;

    const accepted = onChange(safe);

    if (typeof accepted === 'number' && accepted !== safe) {
      setDisplay(padTo2(accepted));
    }
  };

  const handleBlur = () => commit(display);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = value >= max ? min : value + 1;

      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = value <= min ? max : value - 1;

      onChange(next);
    } else if (e.key === 'Enter') {
      commit(display);
    }
  };

  return (
    <Box
      height="100%"
      style={{
        width: 28,
        flexShrink: 0,
        borderRadius: 4,
        transition: 'background-color 0.15s ease',
        ...(!disabled && isHovered ? { backgroundColor: theme.gray4 } : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Input
        data-qa={dataQa}
        disabled={disabled}
        forwardedRef={forwardedRef}
        id={id}
        max={max}
        min={min}
        // textAlign is a valid runtime prop on Cobalt Input despite missing from TS defs
        textAlign="center"
        value={display}
        variation="unstyled"
        width="100%"
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export type TimeSelectInputSize = 'small' | 'medium';

const SIZE_HEIGHT: Record<TimeSelectInputSize, number> = {
  small: 32,
  medium: 40,
};

export type TimeSelectInputMessages = {
  /** AM label. Default: `'AM'`. */
  am?: string;
  /** PM label. Default: `'PM'`. */
  pm?: string;
};

export type TimeSelectInputProps = {
  /** ID applied to the hours input so an external label can target the control. */
  id?: string;
  /**
   * Time value expressed as total minutes from midnight (0–1439).
   * Default: `0`.
   */
  value?: number;
  /** Called with the new total-minutes value whenever hours, minutes, or meridian change. */
  onChange: (totalMinutes: number) => void;
  /** Use 24-hour mode. When `true`, the AM/PM toggle is hidden. Default: `false`. */
  format24H?: boolean;
  /** Maximum allowed hour in 24-hour mode. Ignored in 12-hour mode. Default: `23`. */
  maxHour?: number;
  /** Maximum allowed value in total minutes. Default: `1439`. */
  maxValue?: number;
  /** Minimum allowed hour in 24-hour mode. Ignored in 12-hour mode. Default: `0`. */
  minHour?: number;
  /** Minimum allowed value in total minutes. Default: `0`. */
  minValue?: number;
  /** Disables the entire control. Default: `false`. */
  isDisabled?: boolean;
  /** Disables only the minutes field. Default: `false`. */
  isMinutesDisabled?: boolean;
  /** Called when the control loses focus. */
  onBlur?: () => void;
  /** `forwardedRef` passed to the hours input. */
  forwardedRef?: React.RefObject<HTMLInputElement>;
  /** Overridable user-visible strings. */
  messages?: TimeSelectInputMessages;
  /** Renders a border around the control, matching standard Cobalt input styling. Default: `true`. */
  isOutline?: boolean;
  /** Control height size — matches Cobalt input sizing. Default: `'medium'`. */
  size?: TimeSelectInputSize;
  'data-qa'?: string;
  'data-component'?: string;
};

export const TimeSelectInput: React.FC<TimeSelectInputProps> = ({
  id,
  value = 0,
  onChange,
  format24H = false,
  maxHour = 23,
  maxValue = 1439,
  minHour = 0,
  minValue = 0,
  isDisabled = false,
  isMinutesDisabled = false,
  onBlur,
  forwardedRef,
  messages,
  isOutline = true,
  size = 'medium',
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMTimeSelectInput',
}) => {
  const theme = useTheme();
  const minutesRef = useRef<HTMLInputElement>(null);
  const [isMeridianHovered, setIsMeridianHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isRootHovered, setIsRootHovered] = useState(false);

  const { am = AM, pm = PM } = messages ?? {};

  const [time, setTime] = useState<TimeObject>(() =>
    toTimeObject(clamp(value ?? 0, minValue, maxValue), format24H)
  );

  useEffect(() => {
    setTime(toTimeObject(clamp(value ?? 0, minValue, maxValue), format24H));
  }, [value, format24H, maxValue, minValue]);

  const emit = useCallback(
    (next: TimeObject) => {
      const nextValue = clamp(
        toTotalMinutes(next, format24H),
        minValue,
        maxValue
      );

      const nextTime = toTimeObject(nextValue, format24H);

      setTime(nextTime);
      onChange(nextValue);

      return nextTime;
    },
    [format24H, maxValue, minValue, onChange]
  );

  const handleHourChange = (hours: number) => emit({ ...time, hours }).hours;

  const handleMinutesChange = (minutes: number) =>
    emit({ ...time, minutes }).minutes;

  const handleMeridianToggle = () => {
    const meridian = time.meridian === AM ? PM : AM;

    emit({ ...time, meridian });
  };

  const disabledOpacity = 'var(--opacity-medium, 0.4)';
  const focusColor = 'var(--border-focus-color, var(--primary-11))';

  // Derive outline border color: focus > hover > default
  const outlineBorderColor = () => {
    if (!isOutline || isDisabled) return theme.gray4;
    if (isRootHovered) return theme.gray6;

    return theme.gray4;
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <Flex
      alignY="center"
      data-component={dataComponent}
      data-qa={dataQa}
      gap="1"
      paddingY="1"
      style={{
        height: SIZE_HEIGHT[size],
        ...(isOutline
          ? {
              border: `2px solid ${outlineBorderColor()}`,
              borderRadius:
                'var(--input-border-radius, var(--border-radius-xsmall, 4px))',
              boxSizing: 'border-box' as const,
              paddingLeft: 8,
              paddingRight: 8,
              transition: 'border-color 0.15s ease',
              ...(isFocused && !isDisabled
                ? { boxShadow: `0 0 0 2px ${focusColor}` }
                : {}),
            }
          : {}),
      }}
      width="100%"
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={() => setIsRootHovered(true)}
      onMouseLeave={() => setIsRootHovered(false)}
    >
      {/* Hours field */}
      <NumberInput
        dataQa={dataQa ? `${dataQa}-hours` : undefined}
        disabled={isDisabled}
        forwardedRef={forwardedRef}
        id={id}
        max={format24H ? maxHour : 12}
        min={format24H ? minHour : 1}
        value={time.hours}
        onChange={handleHourChange}
      />

      {/* Colon separator */}
      <Flex
        alignY="center"
        style={{
          fontWeight: 500,
          opacity: isDisabled ? disabledOpacity : undefined,
          flexShrink: 0,
        }}
      >
        <Text weight="medium">:</Text>
      </Flex>

      {/* Minutes field */}
      <NumberInput
        dataQa={dataQa ? `${dataQa}-minutes` : undefined}
        disabled={isMinutesDisabled || isDisabled}
        forwardedRef={minutesRef}
        id={id ? `${id}-minutes` : undefined}
        max={59}
        min={0}
        value={time.minutes}
        onChange={handleMinutesChange}
      />

      {/* AM/PM toggle — hidden in 24H mode */}
      {!format24H && (
        <Flex
          alignX="center"
          alignY="center"
          data-qa={dataQa ? `${dataQa}-meridian` : undefined}
          height="100%"
          paddingX="2"
          style={{
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? disabledOpacity : undefined,
            borderRadius: 4,
            lineHeight: '2em',
            flexShrink: 0,
            userSelect: 'none',
            transition: 'background-color 0.15s ease',
            ...(!isDisabled && isMeridianHovered
              ? { backgroundColor: theme.gray4 }
              : {}),
          }}
          onClick={isDisabled ? undefined : handleMeridianToggle}
          onMouseEnter={() => setIsMeridianHovered(true)}
          onMouseLeave={() => setIsMeridianHovered(false)}
        >
          <Text>{time.meridian === AM ? am : pm}</Text>
        </Flex>
      )}
    </Flex>
  );
};
