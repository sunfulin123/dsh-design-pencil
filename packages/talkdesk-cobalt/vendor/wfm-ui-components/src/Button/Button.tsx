import React from 'react';
import StatefulButton from '@talkdesk/cobalt-marketplace-react-stateful-button';
import Tooltip, {
  PositionCenterTop,
  type TooltipProps,
} from '@talkdesk/cobalt-marketplace-react-tooltip';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon, { type Name as IconName } from '@talkdesk/cobalt-react-icon';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'danger'
  | 'warning'
  | 'success'
  | 'feature'
  | 'mono-dark'
  | 'mono-light';

export type ButtonVariation = 'outline' | 'transparent';

export type ButtonSize = 'tiny' | 'small' | 'medium';

export type ButtonShape = 'full-width' | 'compact';

/** Optional async / feedback state forwarded to the underlying StatefulButton. */
export type ButtonState = 'loading' | 'inline-loading' | 'success' | 'error';

/** Native button `type` attribute (renamed to avoid clashing with Cobalt's `type`). */
export type ButtonHTMLType = 'button' | 'submit' | 'reset';

/**
 * Tooltip wrapper config. Pass a string for the simple "label only" case,
 * or an object to override `position`, `variation`, `content` (rich content),
 * etc. — all forwarded to Cobalt `Tooltip`.
 */
export type ButtonTooltip =
  | string
  | (Omit<TooltipProps, 'children' | 'triggerRef'> & {
      /** Always sourced from the Button — do not pass `children` here. */
      children?: never;
    });

/** Cobalt icon size forwarded to the embedded `<Icon>` when `iconName` is set. */
export type ButtonIconSize =
  | 'nano'
  | 'micro'
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge';

/** Position of the icon relative to the button text. Default: `'start'`. */
export type ButtonIconPosition = 'start' | 'end';

export type ButtonProps = {
  children?: React.ReactNode;
  /** Cobalt button intent. Defaults to `'primary'`. */
  type?: ButtonType;
  /** Optional outline / transparent variation. Omit for the solid look. */
  variation?: ButtonVariation;
  /** Default `'medium'`. */
  size?: ButtonSize;
  /** `'full-width'` stretches to fill the parent; `'compact'` shrinks padding for icon-only buttons. */
  shape?: ButtonShape;
  /**
   * Async state. When set, the button shows a spinner / success / error overlay
   * and ignores clicks. Use `'inline-loading'` inside a footer or row, and
   * `'loading'` for standalone primary CTAs.
   */
  state?: ButtonState;
  /** Disables the button. State takes precedence — a button with `state="loading"` is also un-clickable. */
  // eslint-disable-next-line
  disabled?: boolean;
  /** Click handler. Native React `MouseEventHandler`. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Native button `type` attribute. Default: `'button'`. */
  htmlType?: ButtonHTMLType;
  /** Forwarded ref to the underlying `<button>`. */
  forwardedRef?: React.Ref<HTMLButtonElement>;
  /**
   * Wraps the button in a Cobalt `Tooltip`. Pass a string for a label-only
   * tooltip, or an object to customise `position`, `variation`, `content`, etc.
   * When omitted, no tooltip is rendered.
   */
  tooltip?: ButtonTooltip;
  /**
   * Cobalt icon name. When set, renders `<Icon name={iconName}/>` next to the
   * `children` text — the canonical "icon + label" combo. Omit `children` to
   * render an icon-only button (combine with `shape="compact"`).
   */
  iconName?: IconName;
  /** Icon size. Default scales with `size`: `tiny` for `tiny`, `small` for `small`/`medium`. */
  iconSize?: ButtonIconSize;
  /** Place the icon before (`'start'`, default) or after (`'end'`) the label. */
  iconPosition?: ButtonIconPosition;
  'aria-label'?: string;
  'data-qa'?: string;
  'data-component'?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'primary',
  variation,
  size = 'medium',
  shape,
  state,
  disabled = false,
  onClick,
  htmlType = 'button',
  forwardedRef,
  tooltip,
  iconName,
  iconSize,
  iconPosition = 'start',
  'aria-label': ariaLabel,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMButton',
}) => {
  const disabledTriggerRef = React.useRef<HTMLSpanElement>(null);

  const resolvedIconSize: ButtonIconSize =
    iconSize ?? (size === 'tiny' ? 'tiny' : 'small');

  const content = iconName ? (
    <Flex alignY="center" gap={children ? 1 : 0}>
      {iconPosition === 'start' && (
        <Icon name={iconName} size={resolvedIconSize} />
      )}
      {children}
      {iconPosition === 'end' && (
        <Icon name={iconName} size={resolvedIconSize} />
      )}
    </Flex>
  ) : (
    children
  );

  const button = (
    <StatefulButton
      aria-label={ariaLabel}
      data-component={dataComponent}
      data-qa={dataQa}
      disabled={disabled}
      forwardedRef={forwardedRef}
      htmlType={htmlType}
      shape={shape}
      size={size}
      state={state}
      type={type}
      variation={variation}
      onClick={onClick}
    >
      {content}
    </StatefulButton>
  );

  if (!tooltip) return button;

  const tooltipProps: TooltipProps =
    typeof tooltip === 'string'
      ? ({ label: tooltip, position: PositionCenterTop } as TooltipProps)
      : ({
          position: PositionCenterTop,
          ...tooltip,
        } as TooltipProps);

  // When `disabled` is true the native <button> swallows pointer events,
  // so Tooltip's child-cloning hover handlers don't reliably fire. Switch
  // to the `triggerRef` API: addEventListener attaches mouseenter/mouseleave
  // directly to the wrapping <span>, which always receives hover regardless
  // of the inner button's pointer-events.
  if (disabled) {
    const tooltipPropsWithRef = {
      ...tooltipProps,
      triggerRef: disabledTriggerRef,
    } as unknown as TooltipProps;

    return (
      <>
        <span
          ref={disabledTriggerRef}
          style={{ display: 'inline-block', cursor: 'not-allowed' }}
        >
          {button}
        </span>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Tooltip {...tooltipPropsWithRef} />
      </>
    );
  }

  // Cast to `any` to bypass Tooltip's XOR (children-vs-triggerRef) prop union
  // which TS cannot narrow when spreading a TooltipProps-typed value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TooltipAny = Tooltip as any;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <TooltipAny {...tooltipProps}>{button}</TooltipAny>
  );
};
