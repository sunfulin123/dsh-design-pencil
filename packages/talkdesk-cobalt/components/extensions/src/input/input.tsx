import React, { useLayoutEffect, useRef, useState } from 'react';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import CobaltInput from '@talkdesk/cobalt-react-input';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Text } from '@talkdesk/cobalt-react-typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InputType = 'text' | 'search' | 'email' | 'number' | 'password' | 'tel' | 'url';

export type InputSize = 'small' | 'medium';

export type InputVariation = 'error' | 'warning';

export type InputTextAlign = 'left' | 'center' | 'right';

export type InputProps = {
  /** Controlled input value. */
  value?: string | number;
  /** Native HTML input type. Default: `'text'`. */
  type?: InputType;
  /** Input height preset. Default: `'medium'`. */
  size?: InputSize;
  /** Validation state — colours the border. Pair with `FormField` for label/hint composition. */
  variation?: InputVariation;
  /** Text alignment of the input contents. Default: `'left'`. */
  textAlign?: InputTextAlign;
  /** Hide the up/down spinner buttons on `type="number"`. Default: `false`. */
  hasNoArrows?: boolean;
  /** Placeholder text. */
  placeholder?: string;
  /** Disable interaction. */
  // eslint-disable-next-line
  disabled?: boolean;
  /** Mark the input as read-only. */
  // eslint-disable-next-line
  readOnly?: boolean;
  /** Native `name` attribute. */
  name?: string;
  /** Autofocus on mount. */
  // eslint-disable-next-line
  autoFocus?: boolean;
  /** Native `maxLength` attribute. */
  maxLength?: number;
  /** Native onChange — receives the synthetic event so the parent can read `e.target.value`. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Native onBlur. */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Native onFocus. */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Native onKeyDown. */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Forwarded ref to the underlying `<input>`. */
  forwardedRef?: React.Ref<HTMLInputElement>;
  /**
   * Prefix content rendered as an absolutely-positioned overlay on the left
   * edge of the input. Pass a string (e.g. `"$"`) or any node (icon, badge).
   * The input automatically gets left padding equal to the prefix's measured
   * width plus an 8px gap so the value text never overlaps the prefix.
   */
  prefix?: React.ReactNode;
  /**
   * Suffix content rendered as an absolutely-positioned overlay on the right
   * edge of the input. Pass a string (e.g. `".com"`) or any node (icon, badge,
   * compact button). Right padding is auto-reserved.
   */
  suffix?: React.ReactNode;
  /** Stretch the input to fill its container. Default: `false`. */
  isFullWidth?: boolean;
  /** Native input id — pass to link an external `<Label htmlFor>` / `FormField`. */
  id?: string;
  /** Id(s) of visible helper text (e.g. a character counter) describing the input. */
  'aria-describedby'?: string;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PREFIX_GAP_PX = 8;
const PREFIX_EDGE_PX = 8;
const SUFFIX_GAP_PX = 8;
const SUFFIX_EDGE_PX = 8;

// eslint-disable-next-line complexity
export const Input: React.FC<InputProps> = ({
  value,
  type = 'text',
  size = 'medium',
  variation,
  textAlign,
  hasNoArrows = false,
  placeholder,
  disabled = false,
  readOnly = false,
  name,
  autoFocus = false,
  maxLength,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  forwardedRef,
  prefix,
  suffix,
  isFullWidth = false,
  id,
  'aria-describedby': ariaDescribedBy,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMInput',
}) => {
  const theme = useTheme();

  const prefixRef = useRef<HTMLDivElement>(null);
  const [prefixWidth, setPrefixWidth] = useState(0);

  const suffixRef = useRef<HTMLDivElement>(null);
  const [suffixWidth, setSuffixWidth] = useState(0);

  const hasPrefix = typeof prefix !== 'undefined' && prefix !== null;
  const hasSuffix = typeof suffix !== 'undefined' && suffix !== null;

  // Measure the prefix so we can reserve left padding on the input.
  useLayoutEffect(() => {
    if (!hasPrefix || !prefixRef.current) {
      setPrefixWidth(0);

      return;
    }

    setPrefixWidth(prefixRef.current.offsetWidth);
  }, [prefix, hasPrefix]);

  // Mirror for the suffix — reserves right padding.
  useLayoutEffect(() => {
    if (!hasSuffix || !suffixRef.current) {
      setSuffixWidth(0);

      return;
    }

    setSuffixWidth(suffixRef.current.offsetWidth);
  }, [suffix, hasSuffix]);

  const inputPaddingLeft = hasPrefix ? prefixWidth + PREFIX_GAP_PX + PREFIX_EDGE_PX : 0;

  const inputPaddingRight = hasSuffix ? suffixWidth + SUFFIX_GAP_PX + SUFFIX_EDGE_PX : 0;

  const inputStyle: React.CSSProperties = {};

  if (inputPaddingLeft) inputStyle.paddingLeft = inputPaddingLeft;
  if (inputPaddingRight) inputStyle.paddingRight = inputPaddingRight;

  const cobaltInput = (
    <CobaltInput
      aria-describedby={ariaDescribedBy}
      autoFocus={autoFocus}
      data-qa={dataQa ? `${dataQa}-input` : null}
      disabled={disabled}
      forwardedRef={forwardedRef}
      id={id}
      maxLength={maxLength}
      name={name}
      noArrows={hasNoArrows}
      placeholder={placeholder}
      readOnly={readOnly}
      size={size}
      style={inputStyle}
      textAlign={textAlign}
      type={type}
      value={value}
      variation={variation}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    />
  );

  // Plain input — no prefix/suffix overlay.
  if (!hasPrefix && !hasSuffix) {
    return (
      <Box data-component={dataComponent} data-qa={dataQa} width={isFullWidth ? '100%' : 'auto'}>
        {cobaltInput}
      </Box>
    );
  }

  // Input + absolutely-positioned overlays. Wrapper is `position: relative`
  // so overlays anchor to the input's edges regardless of width.
  return (
    <Box
      data-component={dataComponent}
      data-qa={dataQa}
      style={{ position: 'relative' }}
      width={isFullWidth ? '100%' : 'auto'}
    >
      {cobaltInput}
      {hasPrefix && (
        <Flex
          alignY="center"
          forwardedRef={prefixRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: PREFIX_EDGE_PX,
            pointerEvents: 'none',
          }}
        >
          {typeof prefix === 'string' ? (
            <Text color={theme.gray10} size={size === 'small' ? 'small' : 'medium'}>
              {prefix}
            </Text>
          ) : (
            // Re-enable pointer events for interactive prefix nodes.
            <Box style={{ pointerEvents: 'auto' }}>{prefix}</Box>
          )}
        </Flex>
      )}
      {hasSuffix && (
        <Flex
          alignY="center"
          forwardedRef={suffixRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: SUFFIX_EDGE_PX,
            pointerEvents: 'none',
          }}
        >
          {typeof suffix === 'string' ? (
            <Text color={theme.gray10} size={size === 'small' ? 'small' : 'medium'}>
              {suffix}
            </Text>
          ) : (
            // Re-enable pointer events for interactive suffix nodes (buttons, etc.).
            <Box style={{ pointerEvents: 'auto' }}>{suffix}</Box>
          )}
        </Flex>
      )}
    </Box>
  );
};
