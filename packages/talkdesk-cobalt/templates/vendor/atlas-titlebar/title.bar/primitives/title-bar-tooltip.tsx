import React from 'react'
import Flex from '@talkdesk/cobalt-react-flex'
import Shortcut from '@talkdesk/cobalt-react-shortcut'
import { Tooltip, TooltipTrigger } from '@talkdesk/cobalt-react-tooltip'

import styles from './title-bar-tooltip.module.css'

/**
 * Where the tooltip opens: below the trigger, lined up with its start, centre
 * or end. A subset of React Aria's placements, as the bar is at the top.
 */
export type TooltipPlacement = 'bottom start' | 'bottom' | 'bottom end'

interface Props {
  label: React.ReactNode
  /** Shown next to the label; the key binding itself lives elsewhere. */
  shortcut?: string
  placement?: TooltipPlacement
  /** The trigger; shows the tooltip on hover and on keyboard focus. */
  children: React.ReactNode
}

export function TitleBarTooltip({
  label,
  shortcut,
  placement = 'bottom',
  children
}: Props) {
  return (
    <TooltipTrigger>
      {children}
      <Tooltip placement={placement} className={styles['tooltip']}>
        {shortcut ? (
          <Flex as="span" gap={2} alignY="center">
            {label}
            <Shortcut variant="dark">{shortcut}</Shortcut>
          </Flex>
        ) : (
          label
        )}
      </Tooltip>
    </TooltipTrigger>
  )
}
