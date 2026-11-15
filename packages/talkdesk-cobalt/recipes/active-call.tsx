/** Screenshot-based active voice conversation. Copy this source, support files and Extensions. */
import React, { useState } from 'react';
import Avatar from '@talkdesk/cobalt-react-avatar';
import EmptyWidget from '@talkdesk/cobalt-marketplace-react-empty-widget';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import Tab from '@talkdesk/cobalt-react-tab';
import Divider from '@talkdesk/cobalt-react-divider';
import { Tag } from '@talkdesk/cobalt-react-tag';
import Spinner from '@talkdesk/cobalt-react-spinner';
import Message from '@talkdesk/cobalt-react-message';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { Card, FormField, Input } from '../components/extensions/src';
import { CallDialogs, type CallDialog, type Callback } from './support/call-dialogs';
import { ConversationQueue } from './support/conversation-queue';
import './support/active-call.css';
interface Props {
  scenario?: string;
  onAction?: (action: string, value?: string) => void;
}
const HISTORY = [
  {
    name: 'Teresa Juarez',
    date: 'Oct 20, 2022',
    time: '4:07 PM',
    text: 'Need to review with spouse first, callback scheduled',
    icon: 'phone_callback',
    tone: 'purple',
  },
  {
    name: 'Alex Jones',
    date: 'Oct 20, 2022',
    time: '12:36 PM',
    text: 'Customer busy at this time, callback scheduled',
    icon: 'call_received',
    tone: 'blue',
  },
] as const;
export default function ActiveCall({ scenario = 'success', onAction }: Props) {
  const [section, setSection] = useState('callbacks');
  const [collapsed, setCollapsed] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(true);
  const [ended, setEnded] = useState(false);
  const [dialog, setDialog] = useState<CallDialog>(null);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const [retried, setRetried] = useState(false);
  const denied = scenario === 'permission';
  const inactive = ended || denied || scenario === 'loading';
  const act = (action: string, value?: string) => {
    onAction?.(action, value);
  };
  const actionButton = (
    label: string,
    icon: React.ComponentProps<typeof Icon>['name'],
    action: () => void,
    pressed?: boolean,
  ) => (
    <Button
      type="secondary"
      variation="transparent"
      size="small"
      disabled={inactive}
      aria-label={label}
      aria-pressed={pressed}
      data-testid={`call-${label.toLowerCase().replaceAll(' ', '-')}`}
      prefix={<Icon name={icon} size="small" />}
      onPress={action}
    >
      {label}
    </Button>
  );
  return (
    <div
      className={`active-call${collapsed ? ' active-call--collapsed' : ''}${queueOpen ? ' call-queue-open' : ''}`}
      data-component="ActiveCall"
    >
      <ConversationQueue
        onCollapse={() => {
          setCollapsed(true);
          setQueueOpen(false);
        }}
        onOpen={() => {
          setSection('callbacks');
          setNotice('');
        }}
        onNew={() => setDialog('new')}
      />
      <section className="call-workspace" aria-label="Active voice conversation">
        <header className="call-header" data-testid="call-header">
          <Button
            type="secondary"
            variation="transparent"
            size="tiny"
            shape="compact"
            className="call-expand"
            aria-label="Expand conversations"
            onPress={() => {
              setCollapsed(false);
              setQueueOpen(!queueOpen);
            }}
          >
            <Icon name="menu" />
          </Button>
          <div className="call-quality">
            <Text size="small" style={{ fontSize: 12, lineHeight: '16px' }}>
              Call Quality:
            </Text>
            <span className="call-positive">
              <Icon name="signal_cellular_alt" size="tiny" />
              <Text size="small" style={{ fontSize: 12, lineHeight: '16px' }}>
                Excellent
              </Text>
            </span>
            {recording && !ended && (
              <span className="call-rec">
                <Icon name="fiber_manual_record" size="micro" />
                <Text size="small" style={{ fontSize: 12, lineHeight: '16px' }}>
                  REC
                </Text>
              </span>
            )}
          </div>
          <div className="call-contact-heading">
            <div className="call-status">
              <span className={held ? 'call-subdued' : 'call-positive'}>
                <Icon name={held ? 'pause' : 'phone_in_talk'} size="tiny" />
                <Text size="small">{ended ? 'Call ended' : held ? 'On hold' : 'Talking'}</Text>
              </span>
              <Text
                size="small"
                style={{ fontSize: 12, lineHeight: '16px' }}
                className="call-subdued"
              >
                via Sales Number
              </Text>
            </div>
            <Heading level={1}>Carly Yates</Heading>
            <Text size="small" className="call-subdued">
              +1 814 458 3728
            </Text>
          </div>
          <div
            className="call-customer-halo"
            data-talking={!held && !ended && !denied && scenario !== 'loading'}
            aria-label={
              ended
                ? 'Carly Yates, call ended'
                : held
                  ? 'Carly Yates, on hold'
                  : 'Carly Yates, active caller'
            }
          >
            <Avatar color="green" size="medium">
              CY
            </Avatar>
          </div>
          <nav className="call-tabs" aria-label="Conversation details">
            {['snapshot', 'notes', 'callbacks'].map((value) => (
              <Tab
                key={value}
                href={`#${value}`}
                active={section === value}
                aria-current={section === value ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  setSection(value);
                  setNotice('');
                }}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </Tab>
            ))}
          </nav>
          <Divider className="call-tabs-divider" data-testid="call-tabs-divider" />
        </header>
        <main className="call-content" data-testid="call-content">
          {notice && (
            <Message variation="info" type="banner" role="status" className="call-notice">
              <Icon name="info_outline" size="small" />
              <Text size="small">{notice}</Text>
            </Message>
          )}
          {denied ? (
            <Message variation="warning">
              You do not have permission to view this conversation.
            </Message>
          ) : scenario === 'loading' ? (
            <div className="call-loading" role="status">
              <Spinner />
              <Text>Loading conversation…</Text>
            </div>
          ) : scenario === 'error' && !retried ? (
            <Message variation="error">
              <Text>Unable to load callbacks.</Text>
              <Button size="small" onPress={() => setRetried(true)}>
                Retry
              </Button>
            </Message>
          ) : section === 'callbacks' ? (
            <div className="call-callback-grid">
              <Card padding="6" data-component="CallCallbacks">
                <Heading level={2}>Callbacks</Heading>
                {callbacks.length ? (
                  <ul className="call-upcoming">
                    {callbacks.map((item, index) => (
                      <li key={index}>
                        <Icon name="calendar_today" />
                        <div>
                          <Text weight="medium">
                            {item.date} at {item.time}
                          </Text>
                          <Text elementType="p" size="small">
                            {item.note || 'Call Carly Yates'}
                          </Text>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div data-testid="call-callback-empty">
                    <EmptyWidget
                      title="No upcoming callbacks"
                      message="Details to call the contact later will appear here"
                      actionElement={
                        <Button
                          size="small"
                          variation="outline"
                          prefix={<Icon name="add" size="small" />}
                          onPress={() => setDialog('callback')}
                        >
                          Add callback
                        </Button>
                      }
                    >
                      <Icon name="calendar_today" size="large" color="var(--gray-8)" />
                    </EmptyWidget>
                  </div>
                )}
                {callbacks.length > 0 && (
                  <Button
                    size="small"
                    variation="outline"
                    prefix={<Icon name="add" size="small" />}
                    onPress={() => setDialog('callback')}
                  >
                    Add callback
                  </Button>
                )}
              </Card>
              <Card padding="6" data-component="CallThread">
                <section className="call-thread" aria-labelledby="call-thread-heading">
                  <Heading level={2} id="call-thread-heading">
                    Callback thread
                  </Heading>
                  {scenario === 'empty' ? (
                    <Text>No callback history</Text>
                  ) : (
                    <ol>
                      {HISTORY.slice(0, scenario === 'partial' ? 1 : 2).map((item) => (
                        <li key={item.name}>
                          <Avatar
                            size="small"
                            color="basic"
                            className="call-thread-icon"
                            aria-hidden="true"
                          >
                            <Icon
                              name={item.icon}
                              size="small"
                              color={
                                item.tone === 'purple'
                                  ? 'var(--text-primary)'
                                  : 'var(--text-info, var(--blue-9))'
                              }
                            />
                          </Avatar>
                          <div className="call-thread-entry">
                            <div className="call-thread-meta">
                              <Text
                                size="small"
                                style={{ fontSize: 12, lineHeight: '16px' }}
                                weight="medium"
                              >
                                {item.name}
                              </Text>
                              <Text size="small" style={{ fontSize: 12, lineHeight: '16px' }}>
                                {item.date}
                              </Text>
                              <Text size="small" style={{ fontSize: 12, lineHeight: '16px' }}>
                                {item.time}
                              </Text>
                            </div>
                            <Text elementType="p" size="small">
                              {item.text}
                            </Text>
                            <Text
                              elementType="p"
                              size="small"
                              style={{ fontSize: 12, lineHeight: '16px' }}
                              className="call-subdued"
                            >
                              Warranty extension
                            </Text>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </Card>
            </div>
          ) : section === 'snapshot' ? (
            <Card padding="6" data-component="CallSnapshot">
              <div className="call-snapshot-layout">
                <div className="call-snapshot-heading" data-testid="call-snapshot-heading">
                  <Heading level={2}>Snapshot</Heading>
                  <Tag size="small" color="light-purple">
                    Voice
                  </Tag>
                </div>
                <div className="call-snapshot-details" data-testid="call-snapshot-details">
                  <Text weight="medium">Carly Yates</Text>
                  <Text size="small" className="call-subdued">
                    +1 814 458 3728
                  </Text>
                  <Text size="small" className="call-subdued">
                    Sales Number · Warranty extension
                  </Text>
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="6" data-component="CallNotes">
              <div className="call-notes-layout">
                <Heading level={2}>Notes</Heading>
                <FormField label="Conversation note" htmlFor="call-note">
                  <Input
                    id="call-note"
                    isFullWidth
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add a note"
                  />
                </FormField>
                <div className="call-notes-actions">
                  <Button
                    size="small"
                    onPress={() => {
                      setNotice('Note saved for this prototype session.');
                      act('note', note);
                    }}
                  >
                    Save note
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </main>
        <footer className="call-actions" aria-label="Call controls" data-testid="call-actions">
          <div className="call-action-list">
            {actionButton(
              held ? 'Resume' : 'Hold',
              held ? 'play_arrow' : 'pause',
              () => {
                setHeld(!held);
                act(held ? 'resume' : 'hold');
              },
              held,
            )}
            {actionButton(
              muted ? 'Unmute' : 'Mute',
              muted ? 'mic' : 'mic_off',
              () => {
                setMuted(!muted);
                act(muted ? 'unmute' : 'mute');
              },
              muted,
            )}
            {actionButton(
              recording ? 'Stop recording' : 'Start recording',
              recording ? 'stop_circle_filled' : 'record',
              () => {
                setRecording(!recording);
                act(recording ? 'recording-stop' : 'recording-start');
              },
              recording,
            )}
            {actionButton('Keypad', 'dialpad', () => setDialog('keypad'))}
            {actionButton('Consult', 'transfer_warm', () => setDialog('consult'))}
            {actionButton('Blind transfer', 'transfer_blind', () => setDialog('transfer'))}
            {actionButton('Add guest', 'person_add', () => setDialog('guest'))}
          </div>
          <Button
            type="danger"
            size="small"
            className="call-end"
            disabled={inactive}
            prefix={<Icon name="call_end" size="small" />}
            onPress={() => setDialog('end')}
          >
            End call
          </Button>
        </footer>
      </section>
      <CallDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onCallback={(value) => {
          setCallbacks((items) => [...items, value]);
          act('callback', `${value.date} ${value.time}`);
        }}
        onComplete={(action, value) => {
          if (action === 'end') {
            setEnded(true);
            setRecording(false);
          }
          setNotice(
            action === 'end'
              ? 'Call ended.'
              : `${action === 'transfer' ? 'Transfer' : action === 'consult' ? 'Consultation' : action === 'guest' ? 'Guest invitation' : 'New conversation'} requested for ${value}. Prototype only.`,
          );
          act(action, value);
        }}
      />
    </div>
  );
}
