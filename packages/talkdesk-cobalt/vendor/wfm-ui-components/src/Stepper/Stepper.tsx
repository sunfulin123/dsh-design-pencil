import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Box from '@talkdesk/cobalt-react-box';
import Flex from '@talkdesk/cobalt-react-flex';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';

export enum StepStatus {
  VISITED = 'visited',
  ACTIVE = 'active',
}

export type StepperProps = {
  /** Current state of this step */
  status?: StepStatus;
  /** When true the vertical connector line below the dot is hidden */
  isEnd: boolean;
  children: React.ReactNode;
  'data-qa'?: string;
  'data-component'?: string;
};

export const Stepper: React.FC<StepperProps> = ({
  status,
  isEnd,
  children,
  'data-qa': dataQa = 'stepper-container',
  'data-component': dataComponent = 'WFMStepper',
}) => {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>();

  /** Background / border style applied to the step indicator dot */
  const dotStyles: Record<string, React.CSSProperties> = {
    visited: { backgroundColor: theme.primary9 },
    active: {
      height: '12px',
      width: '12px',
      border: `1px solid ${theme.primary9}`,
      marginTop: '1px',
    },
    default: { backgroundColor: theme.gray4 },
  };

  const updateHeight = useCallback(() => {
    setContentHeight(contentRef.current?.clientHeight);
  }, []);

  // Observe DOM mutations and intersection changes to keep line height in sync
  const observer = useMemo(
    () => new MutationObserver(updateHeight),
    [updateHeight]
  );

  const intersectionObserver = useMemo(
    () => new IntersectionObserver(updateHeight),
    [updateHeight]
  );

  useEffect(() => {
    const el = contentRef.current;

    if (!el) return;

    observer.observe(el, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });

    intersectionObserver.observe(el);

    updateHeight();

    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect();
      intersectionObserver.disconnect();
    };
  }, [observer, intersectionObserver, updateHeight]);

  const dotStyle = dotStyles[status ?? 'default'];

  return (
    <Flex data-component={dataComponent} data-qa={dataQa} width="100%">
      <Flex
        alignX="center"
        direction="column"
        height={contentHeight}
        style={{ flexShrink: 0, position: 'relative' }}
        width="28px"
      >
        <Box
          data-qa="step-dot"
          style={{
            height: '10px',
            width: '10px',
            borderRadius: '50%',
            flexShrink: 0,
            marginTop: '3px',
            zIndex: 10,
            border: '1px solid white',
            backgroundColor: 'white',
            ...dotStyle,
          }}
        />
        {!isEnd && (
          <Box
            backgroundColor={theme.gray4}
            data-qa="step-connector"
            height="calc(100% - 8px)"
            style={{ position: 'absolute', top: '12px', zIndex: 1 }}
            width="4px"
          />
        )}
      </Flex>
      <Box forwardedRef={contentRef}>{children}</Box>
    </Flex>
  );
};
