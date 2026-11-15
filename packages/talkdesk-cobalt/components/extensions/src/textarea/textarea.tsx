import React from 'react';
import Box from '@talkdesk/cobalt-react-box';
import { Textarea as CobaltTextarea } from '@talkdesk/cobalt-react-textarea';

// Cobalt 3 TextField types its focus/input events as HTMLInputElement, while
// its implementation renders TextArea. Narrow only those event element types.
type TextareaEvents = Pick<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onInput' | 'onFocus' | 'onBlur'
>;
const NativeTextarea = CobaltTextarea as unknown as React.ForwardRefExoticComponent<
  Omit<React.ComponentProps<typeof CobaltTextarea>, keyof TextareaEvents> & TextareaEvents
>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextareaSize = 'small' | 'medium';

export type TextareaVariation = 'error' | 'warning';

export type TextareaProps = {
  /** Controlled textarea value. */
  value?: string | number;
  /** Visible row count. Maps to native `rows`. Default: `4`. */
  rows?: number;
  /** Textarea height preset. Default: `'medium'`. */
  size?: TextareaSize;
  /** Validation state — colours the border. Pair with `FormField` for label/hint composition. */
  variation?: TextareaVariation;
  /** Allow the user to drag-resize the textarea. Default: `true`. */
  isResizable?: boolean;
  /** Placeholder text. */
  placeholder?: string;
  /** Disable interaction. */
  // eslint-disable-next-line
  disabled?: boolean;
  /** Mark the textarea as read-only. */
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
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Native onBlur. */
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Native onFocus. */
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Native onKeyDown. */
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  /** Forwarded ref to the underlying `<textarea>`. */
  forwardedRef?: React.Ref<HTMLTextAreaElement>;
  /** Stretch the textarea to fill its container. Default: `false`. */
  isFullWidth?: boolean;
  /** Native textarea id — pass to link an external `FormField` / `<Label htmlFor>`. */
  id?: string;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Textarea: React.FC<TextareaProps> = ({
  value,
  rows = 4,
  size = 'medium',
  variation,
  isResizable = true,
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
  isFullWidth = false,
  id,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMTextarea',
}) => (
  <Box data-component={dataComponent} data-qa={dataQa} width={isFullWidth ? '100%' : 'auto'}>
    <NativeTextarea
      autoFocus={autoFocus}
      data-qa={dataQa ? `${dataQa}-textarea` : null}
      isDisabled={disabled}
      textareaRef={forwardedRef}
      id={id}
      maxLength={maxLength}
      name={name}
      placeholder={placeholder}
      isReadOnly={readOnly}
      isResizable={isResizable}
      rows={rows}
      size={size}
      value={value === undefined ? undefined : String(value)}
      isInvalid={variation === 'error'}
      onBlur={onBlur}
      onInput={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    />
  </Box>
);
