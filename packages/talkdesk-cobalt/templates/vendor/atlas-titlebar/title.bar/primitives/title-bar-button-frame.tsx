import React from 'react'
import type { Name } from '@talkdesk/cobalt-react-icon'
import Tag from '@talkdesk/cobalt-react-tag'

import classNameFormatter from '../../helpers/class.name.formatter'
import { TitleBarTooltip, type TooltipPlacement } from './title-bar-tooltip'

import styles from './title-bar-button.module.css'

/** Props shared by every title bar button. */
export type TitleBarButtonBaseProps = {
  /** Accessible name of the button. */
  'aria-label': string
  /** Renders a lone icon in place of `children`. */
  icon?: Name
  variation?: 'filled' | 'transparent'
  /** A square icon button, or one that grows with its content. */
  shape?: 'compact' | 'flex'
  /** Drops the inline padding of a `flex` button. */
  noPadding?: boolean
  /** Short counter or marker pinned to the top right corner. */
  badge?: string | number
  /** Shown on hover and keyboard focus; no tooltip without it. */
  tooltip?: React.ReactNode
  /** Shown in the tooltip; the key binding itself lives elsewhere. */
  shortcut?: string
  tooltipPlacement?: TooltipPlacement
}

/** Adds the shape's classes to a class name, or to a function of the state. */
export function getButtonClassName<T>({
  shape,
  noPadding,
  className
}: Pick<TitleBarButtonBaseProps, 'shape' | 'noPadding'> & {
  className?: string | ((values: T) => string)
}) {
  const format = (className?: string) =>
    classNameFormatter([
      { [styles['flex']]: shape === 'flex', [styles['no-padding']]: noPadding },
      className
    ])

  // React Aria wants a string back from the function form.
  return typeof className === 'function'
    ? (values: T) => format(className(values)) ?? ''
    : format(className)
}

type Props = Pick<
  TitleBarButtonBaseProps,
  'badge' | 'tooltip' | 'shortcut' | 'tooltipPlacement'
> & {
  children: React.ReactNode
}

/** Places the badge and tooltip around a title bar button. */
export function TitleBarButtonFrame({
  badge,
  tooltip,
  shortcut,
  tooltipPlacement,
  children
}: Props) {
  return (
    <span className={styles['container']}>
      {tooltip ? (
        <TitleBarTooltip
          label={tooltip}
          shortcut={shortcut}
          placement={tooltipPlacement}
        >
          {children}
        </TitleBarTooltip>
      ) : (
        children
      )}
      {badge !== undefined ? (
        <Tag color="red" size="tiny" className={styles['badge']} aria-hidden>
          {badge}
        </Tag>
      ) : null}
    </span>
  )
}
