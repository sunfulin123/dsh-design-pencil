/* eslint-disable react/destructuring-assignment */
import React from 'react';
import {
  SelectionGroup,
  SelectionGroupOption as Option,
} from '@talkdesk/cobalt-react-selection-group';

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

  return (
    <SelectionGroup
      data-component={dataComponent}
      data-qa={dataQa}
      isFullWidth={shape === 'fullWidth'}
      selectionMode={isMultiMode(props) ? 'multiple' : 'single'}
      disallowEmptySelection={!isMultiMode(props)}
      selectedKeys={isMultiMode(props) ? props.value : [props.value]}
      onSelectionChange={(keys) => {
        const selected = keys.map(String);
        if (isMultiMode(props)) props.onChange(selected);
        else if (selected.length) props.onChange(selected[0]);
      }}
      size={size}
      type={type}
      isInvalid={variation === 'error'}
    >
      {options.map((option) => {
        return (
          <Option key={option.value} id={option.value} isDisabled={option.disabled}>
            {option.label}
          </Option>
        );
      })}
    </SelectionGroup>
  );
};
