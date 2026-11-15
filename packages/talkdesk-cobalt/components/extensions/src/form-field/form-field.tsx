/* eslint-disable complexity, sonarjs/cognitive-complexity */
import React from 'react';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { Group as InputGroup, GroupItem as Item } from '@talkdesk/cobalt-react-input-group';
import Label from '@talkdesk/cobalt-react-label';
import Required from '@talkdesk/cobalt-react-required';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Text } from '@talkdesk/cobalt-react-typography';

export type FormFieldVariation = 'error' | 'warning';

export type FormFieldProps = {
  /** Input element(s) rendered inside the InputGroup. */
  children: React.ReactNode;
  /** Label content rendered above the input group. When omitted, no label row is rendered. */
  label?: React.ReactNode;
  /** Unique id that links the Label `htmlFor` to the inner input's `id`. */
  htmlFor?: string;
  /** Marks the field as required — renders an asterisk next to the label. */
  isRequired?: boolean;
  /** Validation state. Applies coloured borders via InputGroup `variation`. */
  variation?: FormFieldVariation;
  /** Static helper text rendered below the input in neutral grey. Always visible regardless of validation state. */
  description?: string;
  /** Error message rendered with a leading icon below the input. Only shown when `variation="error"`. */
  errorHint?: string;
  /** Warning message rendered with a leading icon below the input. Only shown when `variation="warning"`. */
  warningHint?: string;
  /**
   * Optional prefix item rendered as the leftmost InputGroup cell.
   * Pass a string (e.g. `"$"`) or any React node (icon, text, etc.).
   */
  prefix?: React.ReactNode;
  /**
   * Optional suffix item rendered as the rightmost InputGroup cell.
   * Pass a string (e.g. `".com"`) or any React node (icon, button, etc.).
   */
  suffix?: React.ReactNode;
  /** Current character count — triggers the counter tag when set together with `maxInput`. */
  currentInput?: number;
  /** Maximum character count — triggers the counter tag when set together with `currentInput`. */
  maxInput?: number;
  /** Input size forwarded to `InputGroup`. Default: `'medium'`. */
  size?: 'small' | 'medium';
  'data-qa'?: string;
  'data-component'?: string;
};

export const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  htmlFor,
  isRequired = false,
  variation,
  description,
  errorHint,
  warningHint,
  prefix,
  suffix,
  currentInput,
  maxInput,
  size = 'medium',
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMFormField',
}) => {
  const theme = useTheme();
  // GroupItem's minimum width follows content; reserve space for icons without shrinking.
  const adornmentStyle: React.CSSProperties = {
    minWidth: size === 'small' ? 32 : 40,
    paddingInline: 8,
    boxSizing: 'border-box',
    flex: '0 0 auto',
  };

  // When prefix or suffix is provided, use InputGroup mode so :first-child/:last-child
  // border-radius rules apply naturally. Otherwise render children directly — the input
  // controls its own border/radius, so the single-Item left-radius bug cannot occur.
  const hasPrefix = prefix !== null && typeof prefix !== 'undefined';
  const hasSuffix = suffix !== null && typeof suffix !== 'undefined';
  const useInputGroup = hasPrefix || hasSuffix;

  const showCounter = typeof currentInput === 'number' && typeof maxInput === 'number';

  const isOverLimit = showCounter && currentInput > maxInput;

  // Label turns red on error, amber on warning.
  const labelColor = (() => {
    if (variation === 'error') return theme.error10;
    if (variation === 'warning') return theme.warning10;

    // eslint-disable-next-line no-undefined
    return undefined;
  })();

  const counterBg = (() => {
    if (isOverLimit || variation === 'error') return theme.error10;
    if (variation === 'warning') return theme.warning10;

    return theme.gray3;
  })();

  const counterColor = (() => {
    if (isOverLimit || variation === 'error') return theme.error8;
    if (variation === 'warning') return theme.warning5;

    return theme.gray11;
  })();

  return (
    <Box data-component={dataComponent} data-qa={dataQa} width="100%">
      {/* Label row — label on the left, counter tag on the right. Only rendered when label is provided. */}
      {(label || showCounter) && (
        <Flex alignX="space-between" alignY="center" paddingBottom="2">
          <Flex alignY="center" gap="1">
            {label && (
              <Label
                htmlFor={htmlFor ?? ''}
                // eslint-disable-next-line no-undefined
                style={labelColor ? { color: labelColor } : undefined}
              >
                {label}
              </Label>
            )}
            {label && isRequired && <Required title="required" />}
          </Flex>
          {showCounter && (
            <Flex
              alignX="center"
              alignY="center"
              data-qa={dataQa ? `${dataQa}-counter` : null}
              paddingX="2"
              style={{
                backgroundColor: counterBg,
                borderRadius: 4,
                height: '20px',
                flexShrink: 0,
              }}
            >
              <Text size="small" style={{ color: counterColor, lineHeight: 1 }}>
                {currentInput}/{maxInput}
              </Text>
            </Flex>
          )}
        </Flex>
      )}

      {/*
       * InputGroup mode (prefix or suffix present):
       *   [prefix Item?] [content Item] [suffix Item?]
       *   :first-child / :last-child CSS rules round the outer corners correctly.
       *
       * Direct mode (no prefix, no suffix):
       *   children rendered as-is — the input controls its own border and radius.
       */}
      {useInputGroup ? (
        <InputGroup size={size} style={{ width: '100%' }} isInvalid={variation === 'error'}>
          {hasPrefix && (
            <Item isMuted data-qa={dataQa ? `${dataQa}-prefix` : null} width="min" style={adornmentStyle}>
              <Flex alignX="center" alignY="center" height="100%">
                {typeof prefix === 'string' ? <Text color={theme.gray10}>{prefix}</Text> : prefix}
              </Flex>
            </Item>
          )}

          <Item style={{ flex: '1 1 0%', minWidth: 0 }}>{children}</Item>

          {hasSuffix && (
            <Item isMuted data-qa={dataQa ? `${dataQa}-suffix` : null} width="min" style={adornmentStyle}>
              <Flex alignX="center" alignY="center" height="100%">
                {typeof suffix === 'string' ? <Text color={theme.gray10}>{suffix}</Text> : suffix}
              </Flex>
            </Item>
          )}
        </InputGroup>
      ) : (
        // Box uses a zero line-height layout baseline. Restore body line-height so
        // text-labelled controls, especially Checkbox, reserve their visible height.
        <div data-qa={dataQa ? `${dataQa}-control` : undefined} style={{ width: '100%', lineHeight: '20px' }}>
          {children}
        </div>
      )}

      {/* Static description — always shown in neutral grey, no icon */}
      {description && (
        <Box paddingTop="1">
          <Text
            data-qa={dataQa ? `${dataQa}-description` : null}
            size="small"
            style={{ color: theme.gray10 }}
          >
            {description}
          </Text>
        </Box>
      )}

      {/* Error hint — only shown when variation="error", with leading icon */}
      {variation === 'error' && errorHint && (
        <Box paddingTop="1">
          <Flex alignY="center" data-qa={dataQa ? `${dataQa}-error-hint` : null} gap="1">
            <Icon
              color={theme.error10}
              name="error_outline"
              size="tiny"
              style={{ flexShrink: 0 }}
            />
            <Text size="small" style={{ color: theme.error10 }}>
              {errorHint}
            </Text>
          </Flex>
        </Box>
      )}

      {/* Warning hint — only shown when variation="warning", with leading icon */}
      {variation === 'warning' && warningHint && (
        <Box paddingTop="1">
          <Flex alignY="center" data-qa={dataQa ? `${dataQa}-warning-hint` : null} gap="1">
            <Icon color={theme.warning10} name="warning" size="tiny" style={{ flexShrink: 0 }} />
            <Text size="small" style={{ color: theme.warning10 }}>
              {warningHint}
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
