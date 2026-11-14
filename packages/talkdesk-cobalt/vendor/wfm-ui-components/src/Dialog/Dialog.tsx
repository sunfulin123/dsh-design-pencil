import React from 'react';
import DismissibleModal from '@talkdesk/cobalt-marketplace-react-dismissible-modal';
import StatefulButton from '@talkdesk/cobalt-marketplace-react-stateful-button';
import Box from '@talkdesk/cobalt-react-box';
import Button from '@talkdesk/cobalt-react-button';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';

export type DialogSize = 'small' | 'medium' | 'large';

export type DialogConfirmButtonType = 'primary' | 'secondary' | 'danger';

export type DialogMessages = {
  /** Cancel button label. Default: `'Cancel'`. */
  cancelLabel?: string;
  /** Confirm button label. Default: `'Confirm'`. */
  confirmLabel?: string;
};

export type DialogProps = {
  /** Controls dialog visibility. */
  visible: boolean;
  /** Called when the X button, cancel button, or backdrop is clicked. */
  onClose: () => void;
  /** Called when the confirm button is clicked. */
  onConfirm: () => void;
  /** Primary title displayed in the dialog header. */
  title: string;
  /** Optional subtitle rendered below the title in muted text. */
  subtitle?: string;
  /** Dialog body content. */
  children: React.ReactNode;
  /** Dialog size preset. Default: `'medium'`. */
  size?: DialogSize;
  /** Visual type for the confirm button. Default: `'primary'`. */
  confirmButtonType?: DialogConfirmButtonType;
  /** Shows an inline loading spinner on the confirm button when `true`. */
  isConfirmLoading?: boolean;
  /** Disables the confirm button when `true`. */
  isConfirmDisabled?: boolean;
  /** Overridable user-visible strings (cancel label, confirm label). */
  messages?: DialogMessages;
  'data-qa'?: string;
  'data-component'?: string;
};

export const Dialog: React.FC<DialogProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  subtitle,
  children,
  size = 'medium',
  confirmButtonType = 'primary',
  isConfirmLoading = false,
  isConfirmDisabled = false,
  messages,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMDialog',
}) => {
  const theme = useTheme();

  const { cancelLabel = 'Cancel', confirmLabel = 'Confirm' } = messages ?? {};

  return (
    <DismissibleModal size={size} visible={visible} onDismiss={onClose}>
      <Flex
        grow
        data-component={dataComponent}
        data-qa={dataQa}
        direction="column"
        style={{ minHeight: 0, overflow: 'hidden' }}
      >
        {/* Header — title and optional subtitle; X close button is provided by DismissibleModal */}
        <Box
          as="header"
          paddingBottom="4"
          paddingTop="6"
          paddingX="6"
          style={{ flexShrink: 0 }}
        >
          <Flex direction="column" gap="1">
            <Heading level={4}>{title}</Heading>
            {subtitle && (
              <Text
                data-qa={dataQa && `${dataQa}-subtitle`}
                size="small"
                style={{ color: theme.gray10 }}
              >
                {subtitle}
              </Text>
            )}
          </Flex>
        </Box>

        <Divider />

        {/* Content — grows to fill available space and scrolls on overflow */}
        <Box
          grow
          data-qa={dataQa && `${dataQa}-content`}
          paddingX="6"
          paddingY="4"
          style={{ minHeight: 0 }}
          width="100%"
        >
          {children}
        </Box>

        <Divider />

        {/* Footer — always pinned at the bottom, cancel + confirm right-aligned */}
        <Box
          as="footer"
          paddingX="6"
          paddingY="4"
          style={{ flexShrink: 0 }}
          width="100%"
        >
          <Flex grow alignX="end" gap="3" width="100%">
            <Button
              data-qa={dataQa && `${dataQa}-cancel-button`}
              type="secondary"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>

            <StatefulButton
              data-qa={dataQa && `${dataQa}-confirm-button`}
              disabled={isConfirmDisabled}
              // eslint-disable-next-line no-undefined
              state={isConfirmLoading ? 'inline-loading' : undefined}
              type={confirmButtonType}
              onClick={onConfirm}
            >
              {confirmLabel}
            </StatefulButton>
          </Flex>
        </Box>
      </Flex>
    </DismissibleModal>
  );
};
