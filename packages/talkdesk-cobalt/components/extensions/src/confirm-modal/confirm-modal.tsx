import React, { useEffect, useRef } from 'react';
import DismissibleModal from '@talkdesk/cobalt-marketplace-react-dismissible-modal';
import StatefulButton from '@talkdesk/cobalt-marketplace-react-stateful-button';
import Button from '@talkdesk/cobalt-react-button';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';

export type ConfirmModalButtonType = 'primary' | 'secondary' | 'danger';

export type ConfirmModalProps = {
  /** Controls modal visibility. */
  visible: boolean;
  /** Called when the dismiss button or overlay is clicked. */
  onDismiss: () => void;
  /** Called when the action button is clicked. */
  onAction: () => void;
  /** Cobalt icon name displayed at the top of the modal. Defaults to 'info_circle'. */
  iconName?: React.ComponentProps<typeof Icon>['name'];
  /** Icon color. Falls back to `theme.secondary8` when not provided. */
  iconColor?: string;
  /** Content rendered in the body of the modal. */
  content: React.ReactNode;
  /** Visual type for the action button. Defaults to 'primary'. */
  actionButtonType?: ConfirmModalButtonType;
  /** Label text for the action button. */
  actionButtonText: string;
  /** Shows an inline loading spinner on the action button when true. */
  isActionButtonLoading?: boolean;
  /** Disables the action button when true. */
  isDisabled?: boolean;
  /** Cancel button label. Defaults to 'Cancel'. */
  cancelButtonText?: string;
  /** Accessible name and alert-dialog semantics for the confirmation. */
  ariaLabel?: string;
  'data-qa'?: string;
  'data-component'?: string;
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onDismiss,
  onAction,
  iconName = 'info_circle',
  iconColor,
  content,
  actionButtonType = 'primary',
  actionButtonText,
  isActionButtonLoading = false,
  isDisabled = false,
  cancelButtonText = 'Cancel',
  ariaLabel,
  'data-qa': dataQa,
  'data-component': dataComponent = 'ConfirmModal',
}) => {
  const theme = useTheme();
  const resolvedIconColor = iconColor ?? theme.secondary8;
  const accessibleLabel = ariaLabel ?? dataComponent;
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const cancelButtonDataQa = dataQa ? `${dataQa}-cancel-button` : 'confirm-modal-cancel-button';

  useEffect(() => {
    if (!visible) {
      return () => {};
    }

    const focusTimer = window.setTimeout(() => {
      cancelButtonRef.current?.focus();
    });

    return () => window.clearTimeout(focusTimer);
  }, [visible]);

  return (
    <DismissibleModal
      aria-label={accessibleLabel}
      aria-modal="true"
      role="alertdialog"
      size="small"
      style={{ zIndex: 1000 }}
      visible={visible}
      onDismiss={onDismiss}
    >
      <Flex
        grow
        alignX="center"
        data-component={dataComponent}
        data-qa={dataQa}
        direction="column"
        height="100%"
        padding="6"
        width="100%"
      >
        <Icon color={resolvedIconColor} name={iconName} size="large" />
        <Flex
          grow
          alignX="center"
          alignY="center"
          data-qa={dataQa ? `${dataQa}-content` : 'confirm-modal-content'}
          direction="column"
          gap="3"
          width="100%"
        >
          {content}
        </Flex>
        <Flex
          alignX="center"
          alignY="end"
          data-qa={dataQa ? `${dataQa}-actions` : 'confirm-modal-actions'}
          gap="3"
          width="100%"
        >
          <Button
            data-qa={cancelButtonDataQa}
            forwardedRef={cancelButtonRef}
            type="secondary"
            onClick={onDismiss}
          >
            {cancelButtonText}
          </Button>
          <StatefulButton
            data-qa={dataQa ? `${dataQa}-action-button` : 'confirm-modal-action-button'}
            disabled={isDisabled}
            state={isActionButtonLoading ? 'inline-loading' : undefined}
            type={actionButtonType}
            onClick={onAction}
          >
            {actionButtonText}
          </StatefulButton>
        </Flex>
      </Flex>
    </DismissibleModal>
  );
};
