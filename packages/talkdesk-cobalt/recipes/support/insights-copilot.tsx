/** Screenshot-shaped Copilot conversation; replies are local samples, never a model call. */
import React, { useEffect, useRef, useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import ChatBubble from '@talkdesk/cobalt-react-chat-bubble';
import Avatar from '@talkdesk/cobalt-react-avatar';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { ModalPanel } from '@talkdesk/cobalt-react-panel';
import { Textarea } from '@talkdesk/cobalt-react-textarea';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';

type Message = { id: number; from: 'copilot' | 'user'; text: string; time: string };
const greeting: Message = {
  id: 0,
  from: 'copilot',
  time: '13:06',
  text: "Hi! Ask me about your Insights — a trend, a peak, or a comparison — and I'll help you explore the sample predictions.",
};

export function InsightsCopilot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: 'nearest' });
  }, [open, messages]);
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setMessages((previous) => [
      ...previous,
      { id: previous.length, from: 'user', text, time },
      {
        id: previous.length + 1,
        from: 'copilot',
        time,
        text: 'Sample insight: both predicted metrics stay near 320 seconds overnight, fall during the day, and rise again around 6 PM. These are demo predictions; connect your analytics service for live answers.',
      },
    ]);
    setDraft('');
  };
  return (
    <ModalPanel
      isOpen={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      isDismissible
      hideCloseButton
      size="medium"
      aria-label="Insights Copilot"
      data-testid="insights-copilot-panel"
      className="insights-copilot-panel"
    >
      <header className="insights-copilot-header">
        <Flex alignY="center" gap={3} wrap>
          <Icon name="app_copilot_advisor" size="large" color="var(--text-primary)" />
          <Heading level={2} scale="medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
            Copilot
          </Heading>
          <Flex alignY="center" gap={1}>
            <Icon name="gen_ai" size="tiny" />
            <Text variant="description">AI Powered</Text>
          </Flex>
        </Flex>
        <Button
          type="secondary"
          variation="transparent"
          shape="compact"
          aria-label="Close Copilot"
          data-testid="insights-copilot-close"
          onPress={onClose}
        >
          <Icon name="close" />
        </Button>
      </header>
      <section
        role="log"
        aria-label="Copilot conversation"
        aria-live="polite"
        aria-relevant="additions"
        className="insights-copilot-messages"
      >
        {messages.map((message) => (
          <Flex
            key={message.id}
            gap={3}
            alignY="start"
            alignX={message.from === 'user' ? 'end' : 'start'}
            className="insights-copilot-message"
          >
            {message.from === 'copilot' && (
              <Avatar
                size="tiny"
                color="theme"
                aria-hidden="true"
                className="insights-copilot-avatar"
              >
                <Icon name="gen_ai" size="small" />
              </Avatar>
            )}
            <Flex
              direction="column"
              alignX={message.from === 'user' ? 'end' : 'start'}
              gap={1}
              width="auto"
              style={{ minWidth: 0, maxWidth: 'calc(100% - 36px)', flex: '0 1 auto' }}
            >
              <Text variant="description">
                {message.from === 'copilot' ? 'Copilot' : 'You'} · {message.time}
              </Text>
              <ChatBubble
                type={message.from === 'copilot' ? 'bot' : 'sent'}
                style={{ maxWidth: '100%' }}
              >
                <Flex
                  padding={3}
                  width="auto"
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {message.text}
                </Flex>
              </ChatBubble>
            </Flex>
            {message.from === 'user' && (
              <Avatar
                size="tiny"
                color="theme"
                aria-hidden="true"
                data-testid="insights-copilot-user-avatar"
                style={{ flex: 'none', marginTop: 24 }}
              >
                You
              </Avatar>
            )}
          </Flex>
        ))}
        <div ref={end} />
      </section>
      <footer className="insights-copilot-composer" data-testid="insights-copilot-composer">
        <Textarea
          aria-label="Message Copilot"
          data-testid="insights-copilot-input"
          placeholder="Ask about your insights…"
          value={draft}
          onChange={setDraft}
          maxLength={120}
          rows={4}
          isResizable={false}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !composing.current &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            } else {
              // React Aria keyboard handlers stop bubbling unless explicitly continued.
              event.continuePropagation();
            }
          }}
        />
        <Flex alignX="space-between" alignY="center" gap={2}>
          <Text variant="description">Enter to send.</Text>
          <Button
            type="feature"
            size="small"
            shape="compact"
            aria-label="Send message"
            data-testid="insights-copilot-send"
            disabled={!draft.trim()}
            onPress={send}
          >
            <Icon name="send" size="tiny" />
          </Button>
        </Flex>
      </footer>
    </ModalPanel>
  );
}
