import { PopupDismissBoundary } from '../internal/popup-dismiss-boundary';
import React from 'react';
import StatefulPopup, {
  StatefulPopupProps,
} from '@talkdesk/cobalt-marketplace-react-stateful-popup';
import Box from '@talkdesk/cobalt-react-box';
import { ResponsiveValue } from '@talkdesk/cobalt-react-responsive-value-hook';

export type PopupTriggerSpace =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

export type PopupTriggerProps = {
  /**
   * The trigger element — any React node (button, icon, link, etc.).
   * Wrapped with a click handler that opens/closes the popup.
   */
  children: React.ReactNode;
  /** Content rendered inside the popup panel. */
  content: React.ReactNode;
  /**
   * Direction the popup panel opens from the anchor point.
   * Defaults to 'SE' (downward-right — standard dropdown behaviour).
   */
  direction?: StatefulPopupProps['direction'];
  /**
   * Anchor point on the trigger element where the popup attaches.
   * Defaults to 'SW' (bottom-left of the trigger).
   */
  origin?: StatefulPopupProps['direction'];
  /** Popup size preset. */
  size?: StatefulPopupProps['size'];
  /** Custom width for the popup panel (e.g. '320px'). Overrides size preset. */
  width?: string | number;
  /** Padding inside the popup content area. Defaults to '4' (16px). */
  contentPadding?: ResponsiveValue<PopupTriggerSpace>;
  /** Keep popup open when the user clicks inside it. */
  keepOpen?: boolean;
  /** Disables the trigger and prevents the popup from opening. */
  disabled?: boolean;
  /**
   * Stretches the trigger wrapper to the full available width.
   * Useful when the trigger should span the container (e.g. a full-width select).
   * Defaults to false.
   */
  fullWidth?: boolean;
  'data-qa'?: string;
  'data-component'?: string;
};

export const PopupTrigger: React.FC<PopupTriggerProps> = ({
  children,
  content,
  direction = 'SE',
  origin = 'SW',
  size,
  width,
  contentPadding = '4',
  keepOpen = false,
  disabled = false,
  fullWidth = false,
  'data-qa': dataQa,
  'data-component': dataComponent = 'PopupTrigger',
}) => {
  const nativeTarget = React.useRef<HTMLElement | null>(null);
  return (
    <StatefulPopup
      data-component={dataComponent}
      data-qa={dataQa}
      direction={direction}
      disabled={disabled}
      fullWidthTarget={fullWidth}
      keepOpen={keepOpen}
      origin={origin}
      size={size}
      target={children}
      targetProps={{
        onPointerDownCapture: (event) => {
          nativeTarget.current = event.currentTarget;
        },
        onFocusCapture: (event) => {
          nativeTarget.current = event.currentTarget;
        },
      }}
      width={width}
    >
      {(close, { isVisible }) => (
        <PopupDismissBoundary close={close} active={isVisible} trigger={() => nativeTarget.current}>
          <Box
            data-qa={dataQa ? `${dataQa}-content` : 'popup-trigger-content'}
            padding={contentPadding}
          >
            {content}
          </Box>
        </PopupDismissBoundary>
      )}
    </StatefulPopup>
  );
};
