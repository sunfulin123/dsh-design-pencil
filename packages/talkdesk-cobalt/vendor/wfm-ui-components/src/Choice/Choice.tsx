import React from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import Input from '@talkdesk/cobalt-react-input';
import Label from '@talkdesk/cobalt-react-label';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChoiceType = 'checkbox' | 'radio';

export type ChoiceVariation = 'error' | 'warning';

export type ChoiceSize = 'small' | 'medium';

export type ChoiceProps = {
  /** Whether to render a `'checkbox'` (default) or a `'radio'`. */
  type?: ChoiceType;
  /** Controlled checked state. */
  checked?: boolean;
  /** Fired when the user toggles the control. */
  onChange?: (
    checked: boolean,
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  /** Visible label rendered to the right of the control and clickable via `htmlFor`. */
  label?: React.ReactNode;
  /** Validation state. Tints the control outline and the label. */
  variation?: ChoiceVariation;
  /** Disables interaction. */
  disabled?: boolean;
  /** Marks a radio as part of a group. Required when using `type="radio"` in a group. */
  name?: string;
  /** Native `value` attribute — useful for radios that share a `name`. */
  value?: string | number;
  /** Control size forwarded to the underlying `Input`. Default: `'medium'`. */
  size?: ChoiceSize;
  /**
   * `id` for the input. When omitted, an auto-generated id is used so the
   * `Label htmlFor` association still works.
   */
  id?: string;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Choice: React.FC<ChoiceProps> = ({
  type = 'checkbox',
  checked,
  onChange,
  label,
  variation,
  disabled = false,
  name,
  value,
  size = 'medium',
  id,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMChoice',
}) => {
  const theme = useTheme();
  const reactId = React.useId();
  const inputId = id ?? `wfm-choice-${reactId}`;

  const labelColor = (() => {
    if (disabled) return theme.gray8;
    if (variation === 'error') return theme.error10;
    if (variation === 'warning') return theme.warning10;

    return theme.textDefault;
  })();

  return (
    <Flex
      alignY="center"
      data-component={dataComponent}
      data-qa={dataQa}
      gap="2"
    >
      <Input
        checked={checked}
        data-qa={dataQa ? `${dataQa}-input` : null}
        disabled={disabled}
        id={inputId}
        name={name}
        size={size}
        type={type}
        value={value}
        variation={variation}
        onChange={(event) => onChange?.(event.target.checked, event)}
      />
      {label && (
        <Label
          htmlFor={inputId}
          // Cobalt Label defaults to medium weight; Choice labels read as
          // option text rather than form labels, so we force regular (400).
          style={{ color: labelColor, fontWeight: 400 }}
        >
          {label}
        </Label>
      )}
    </Flex>
  );
};
