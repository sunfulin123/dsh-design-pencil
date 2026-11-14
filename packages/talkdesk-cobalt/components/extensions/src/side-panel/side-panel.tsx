import React from 'react';
import StatefulButton from '@talkdesk/cobalt-marketplace-react-stateful-button';
import Box from '@talkdesk/cobalt-react-box';
import Button from '@talkdesk/cobalt-react-button';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { ModalPanel } from '@talkdesk/cobalt-react-panel';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';

export type SidePanelSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * A single action button rendered in the SidePanel footer.
 * All props are forwarded to StatefulButton (which extends Cobalt Button).
 */
export type SidePanelAction = {
  /** Button label content. */
  label: React.ReactNode;
  /** Button visual type. Defaults to 'secondary'. */
  type?: 'primary' | 'secondary' | 'danger';
  /** Loading / success / error state passed to StatefulButton. */
  state?: 'loading' | 'inline-loading' | 'success' | 'error';
  /** Disables the button when true. */
  disabled?: boolean;
  /** Click handler. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** QA selector for the button. */
  'data-qa'?: string;
};

export type SidePanelProps = {
  /** Controls panel visibility. */
  visible: boolean;
  /** Panel title shown in the header. */
  title?: string;
  /** Secondary header text for the participant-selection layout. */
  subtitle?: string;
  /** Opt-in layout; other side panels retain their existing spacing and dividers. */
  variant?: 'default' | 'participants' | 'form';
  /** Called when the close button or overlay is clicked. */
  onClose: () => void;
  /** Localized accessible name for the close button. */
  closeLabel?: string;
  /**
   * Action buttons rendered right-aligned in the fixed footer.
   * Buttons are rendered left-to-right in the order provided;
   * the last item is typically the primary action.
   */
  actions?: SidePanelAction[];
  /** Panel width preset. Defaults to 'medium'. */
  size?: SidePanelSize;
  /**
   * CSS z-index applied directly to the Panel element.
   * Defaults to 100. Increase if the panel is covered by other fixed elements.
   */
  zIndex?: number;
  /** Content rendered in the scrollable body. */
  children?: React.ReactNode;
  'data-qa'?: string;
  'data-component'?: string;
};

const panelLayouts = {
  default: {
    paddingX: 4,
    paddingY: 3,
    bodyPadding: 4,
    footerGap: 2,
    alignment: 'center',
    showDividers: true,
    headerStyle: {},
    titleStyle: {},
    closeStyle: {},
    actionStyle: {},
  },
  participants: {
    paddingX: 6,
    paddingY: 6,
    bodyPadding: 0,
    footerGap: 3,
    alignment: 'start',
    showDividers: false,
    headerStyle: { gap: 4 },
    closeStyle: { alignSelf: 'flex-start' },
    actionStyle: { borderWidth: 0 },
    titleStyle: {
      fontSize: 24,
      fontWeight: 400,
      lineHeight: '24px',
      margin: 0,
    },
  },
  /**
   * Form panels match the Forecast Create/Duplicate scenario side panel: 24px on
   * every header/footer edge, no header or footer rule, and the form owning its
   * own horizontal inset so section dividers align with the fields.
   */
  form: {
    paddingX: 6,
    paddingY: 6,
    bodyPadding: 0,
    footerGap: 3,
    alignment: 'center',
    showDividers: false,
    headerStyle: {},
    titleStyle: {},
    closeStyle: {},
    actionStyle: {},
  },
} as const;

export const SidePanel: React.FC<SidePanelProps> = ({
  visible,
  title,
  subtitle,
  variant = 'default',
  onClose,
  closeLabel,
  actions = [],
  size = 'medium',
  zIndex = 1,
  children,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMSidePanel',
}) => {
  const layout = panelLayouts[variant];

  return (
    <Box data-component={dataComponent} style={{ position: 'relative', zIndex }}>
      <ModalPanel
        aria-label={title || closeLabel}
        isDismissible
        hideCloseButton
        data-qa={dataQa}
        size={size}
        isOpen={visible}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Flex direction="column" height="100%" width="100%">
          {/* ── Header ── */}
          <Box as="header" paddingX={layout.paddingX} paddingY={layout.paddingY} width="100%">
            <Flex alignY={layout.alignment} width="100%">
              <Flex
                grow
                direction={variant === 'participants' ? 'column' : 'row'}
                style={layout.headerStyle}
              >
                {title && (
                  <Heading level={2} style={layout.titleStyle}>
                    {title}
                  </Heading>
                )}
                {variant === 'participants' && subtitle && (
                  <Text
                    style={{
                      color: '#606569',
                      fontSize: 14,
                      lineHeight: '20px',
                      margin: 0,
                    }}
                  >
                    {subtitle}
                  </Text>
                )}
              </Flex>
              <Button
                aria-label={closeLabel}
                data-qa={dataQa ? `${dataQa}-close` : 'sidePanel-close'}
                shape="compact"
                style={layout.closeStyle}
                type="secondary"
                variation="transparent"
                onClick={onClose}
              >
                <Icon name="close" />
              </Button>
            </Flex>
          </Box>

          {layout.showDividers && <Divider />}

          {/* ── Scrollable body ── */}
          <Flex grow scrollable direction="column" padding={layout.bodyPadding} width="100%">
            {children}
          </Flex>

          {/* ── Fixed footer with right-aligned actions ── */}
          {actions.length > 0 && (
            <>
              {layout.showDividers && <Divider />}
              <Box as="footer" paddingX={layout.paddingX} paddingY={layout.paddingY} width="100%">
                <Flex alignX="end" gap={layout.footerGap}>
                  {actions.map(
                    (
                      { label, type = 'secondary', state, disabled, onClick, 'data-qa': actionQa },
                      index,
                    ) => (
                      <StatefulButton
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        data-qa={actionQa}
                        disabled={disabled}
                        // eslint-disable-next-line no-undefined
                        state={state ?? undefined}
                        style={layout.actionStyle}
                        type={type}
                        onClick={onClick}
                      >
                        {label}
                      </StatefulButton>
                    ),
                  )}
                </Flex>
              </Box>
            </>
          )}
        </Flex>
      </ModalPanel>
    </Box>
  );
};
