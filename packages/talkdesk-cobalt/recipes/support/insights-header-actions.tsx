/** Native split export actions and the entry to the local Copilot prototype. */
import React, { useRef, useState } from 'react';
import Button, { SplitButton } from '@talkdesk/cobalt-react-button';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { Popover, PopoverDialog } from '@talkdesk/cobalt-react-popover';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';

export function InsightsHeaderActions({ disabled, onAskCopilot, onExport }: {
  disabled: boolean;
  onAskCopilot: () => void;
  onExport: (format: 'csv' | 'json') => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popoverId = React.useId();
  const download = (format: 'csv' | 'json') => { setOpen(false); onExport(format); };
  return <Flex gap={3} alignY="center" wrap width="auto" style={{ flex: 'none', maxWidth: '100%' }} data-testid="insights-header-actions">
    <Button type="feature" variation="transparent" onPress={onAskCopilot} prefix={<Icon name="gen_ai"/>}
      aria-label="Ask Copilot" aria-haspopup="dialog" data-testid="insights-ask-copilot">Ask Copilot</Button>
    <SplitButton aria-label="Export insights actions" data-testid="insights-export-split">
      <Button type="primary" disabled={disabled} onPress={() => onExport('csv')}>Export</Button>
      <Button ref={trigger} type="primary" shape="compact" disabled={disabled}
        aria-label="More export options" aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? popoverId : undefined} data-testid="insights-export-options"
        onPress={() => setOpen(value => !value)}><Icon name="chevron_down"/></Button>
    </SplitButton>
    <Popover triggerRef={trigger} isOpen={open} onOpenChange={setOpen}
      placement="bottom end" size="small" data-testid="insights-export-popover">
      <PopoverDialog id={popoverId} aria-label="Insight export options">
        <Flex direction="column" alignX="stretch" gap={3}>
          <Heading level={3} scale="small">Export insights</Heading>
          <Text variant="description">Download a snapshot of the sample summary.</Text>
          <Button type="secondary" onPress={() => download('csv')} prefix={<Icon name="download"/>}>Download CSV</Button>
          <Button type="secondary" onPress={() => download('json')} prefix={<Icon name="download"/>}>Download JSON</Button>
          <Button type="secondary" variation="transparent" onPress={() => setOpen(false)}>Cancel</Button>
        </Flex>
      </PopoverDialog>
    </Popover>
  </Flex>;
}
