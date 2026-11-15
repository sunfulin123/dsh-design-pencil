import React from 'react'
import Button from '@talkdesk/cobalt-react-button'
import Icon from '@talkdesk/cobalt-react-icon'

import {
  TitleBarButtonFrame,
  getButtonClassName,
  type TitleBarButtonBaseProps
} from './title-bar-button-frame'

// Leaves out Cobalt's deprecated `onClick`, `disabled` and `forwardedRef` in
// favour of `onPress`, `isDisabled` and `ref`.
type ButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  | 'type'
  | 'variation'
  | 'shape'
  | 'size'
  | 'aria-label'
  | 'render'
  | 'ref'
  | 'onClick'
  | 'disabled'
  | 'forwardedRef'
>

export type TitleBarButtonProps = ButtonProps & TitleBarButtonBaseProps

/**
 * A button for an action, secondary. One that opens a popup, with
 * `aria-expanded`, is filled primary while the popup is open, like a selected
 * `TitleBarToggleButton`.
 */
export const TitleBarButton = React.forwardRef<
  HTMLButtonElement,
  TitleBarButtonProps
>(function TitleBarButton(
  {
    icon,
    variation = 'transparent',
    shape = 'compact',
    noPadding,
    badge,
    tooltip,
    shortcut,
    tooltipPlacement,
    className,
    children,
    ...props
  },
  ref
) {
  const isExpanded =
    props['aria-expanded'] === true || props['aria-expanded'] === 'true'

  return (
    <TitleBarButtonFrame
      badge={badge}
      tooltip={tooltip}
      shortcut={shortcut}
      tooltipPlacement={tooltipPlacement}
    >
      <Button
        {...props}
        ref={ref}
        type={isExpanded ? 'primary' : 'secondary'}
        // Cobalt's filled variation is its default, with no name of its own.
        // An expanded button is always filled.
        variation={
          variation === 'transparent' && !isExpanded ? 'transparent' : undefined
        }
        shape={shape === 'compact' ? 'compact' : undefined}
        size="small"
        className={getButtonClassName({ shape, noPadding, className })}
      >
        {icon ? <Icon name={icon} size="tiny" /> : children}
      </Button>
    </TitleBarButtonFrame>
  )
})
