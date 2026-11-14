/* eslint-disable react/destructuring-assignment */
import React from 'react';
import SelectionGroup, { Option } from '@talkdesk/cobalt-react-selection-group';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SelectGroupOption = {
  /** Unique identifier for this option. */
  value: string;
  /** Display label rendered inside the option button. */
  label: React.ReactNode;
  /** Prevents interaction when true. */
  disabled?: boolean;
};

type SelectGroupCommonProps = {
  /** Option list — each item must have a unique `value`. */
  options: SelectGroupOption[];
  /** Control size. Default: `medium`. */
  size?: 'small' | 'medium' | 'large';
  /** `fullWidth` stretches the group to fill its container width. */
  shape?: 'fullWidth';
  /** `outline` renders a bordered style instead of the default filled style. */
  type?: 'outline';
  /** Shows a warning or error border around the group. */
  variation?: 'warning' | 'error';
  'data-qa'?: string;
  'data-component'?: string;
};

export type SelectGroupSingleProps = SelectGroupCommonProps & {
  /** `single` (default) — only one option may be active at a time. */
  mode?: 'single';
  /** The currently selected value. */
  value: string;
  /** Called with the newly selected value when the user picks an option. */
  onChange: (value: string) => void;
};

export type SelectGroupMultiProps = SelectGroupCommonProps & {
  /** `multi` — multiple options may be active simultaneously. */
  mode: 'multi';
  /** Array of currently selected values. */
  value: string[];
  /** Called with the updated selection array after each toggle. */
  onChange: (values: string[]) => void;
};

export type SelectGroupProps = SelectGroupSingleProps | SelectGroupMultiProps;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMultiMode(props: SelectGroupProps): props is SelectGroupMultiProps {
  return props.mode === 'multi';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SelectGroup: React.FC<SelectGroupProps> = (props) => {
  const {
    options,
    size,
    shape,
    type,
    variation,
    'data-qa': dataQa,
    'data-component': dataComponent = 'WFMSelectGroup',
  } = props;

  const handleChange = (optionValue: string, checked: boolean) => {
    if (isMultiMode(props)) {
      const next = checked
        ? [...props.value, optionValue]
        : props.value.filter((v) => v !== optionValue);

      props.onChange(next);
    } else if (checked) {
      props.onChange(optionValue);
    }
  };

  return (
    <SelectionGroup
      data-component={dataComponent}
      data-qa={dataQa}
      shape={shape}
      size={size}
      type={type}
      variation={variation}
    >
      {options.map((option) => {
        const isSelected = isMultiMode(props)
          ? props.value.includes(option.value)
          : props.value === option.value;

        return (
          <Option
            key={option.value}
            disabled={option.disabled}
            selected={isSelected}
            onChange={(checked) => handleChange(option.value, checked)}
          >
            {option.label}
          </Option>
        );
      })}
    </SelectionGroup>
  );
};
