import React from 'react';
import MarketplaceMessage from '@talkdesk/cobalt-marketplace-react-message';
import StatefulButton from '@talkdesk/cobalt-marketplace-react-stateful-button';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';

export type MessageVariation =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'feature'
  | 'primary'
  | 'secondary';

export type MessageType = 'banner' | 'floating';

type ActionButtonType =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'danger'
  | 'warning'
  | 'success'
  | 'feature';

const VARIATION_BUTTON_TYPE: Record<MessageVariation, ActionButtonType> = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  feature: 'feature',
  info: 'info',
  primary: 'primary',
  secondary: 'secondary',
};

export type InteractiveMessageProps = {
  /** Semantic style — controls icon color and action button type */
  variation?: MessageVariation;
  /** Banner (full-width) or floating (inline) layout */
  type?: MessageType;
  /** Label for the optional action button */
  actionLabel?: string;
  /** Called when the action button is clicked. Renders button only when provided. */
  onAction?: () => void;
  /** When true, shows an inline loading spinner on the action button. */
  isActionLoading?: boolean;
  /** Called when the dismiss icon is clicked. Renders close icon only when provided. */
  onDismiss?: () => void;
  /** When true shows a spinner instead of the variation icon */
  withLoader?: boolean;
  /**
   * When true, aligns the icon to the top and stacks content vertically.
   * Use when children span multiple lines.
   */
  block?: boolean;
  children: React.ReactNode;
  'data-qa'?: string;
  'data-component'?: string;
};

export const InteractiveMessage: React.FC<InteractiveMessageProps> = ({
  variation = 'info',
  type,
  actionLabel,
  onAction,
  isActionLoading = false,
  onDismiss,
  withLoader = false,
  block = false,
  children,
  'data-qa': dataQa = 'interactiveMessage',
  'data-component': dataComponent = 'WFMInteractiveMessage',
}) => (
  <MarketplaceMessage
    block={block}
    data-component={dataComponent}
    data-qa={dataQa}
    type={type}
    variation={variation}
    withLoader={withLoader}
    onDismiss={onDismiss}
  >
    <Flex grow alignY="center" gap="3">
      <Box grow>{children}</Box>
      {onAction && actionLabel && (
        <StatefulButton
          data-qa="messageActionButton"
          size="small"
          state={isActionLoading ? 'inline-loading' : undefined}
          style={{ flexShrink: 0 }}
          type={VARIATION_BUTTON_TYPE[variation]}
          variation="outline"
          onClick={onAction}
        >
          {actionLabel}
        </StatefulButton>
      )}
    </Flex>
  </MarketplaceMessage>
);
