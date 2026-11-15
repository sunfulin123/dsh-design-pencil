/** Local conversation queue chrome for the active-call composition. */
import React, { useEffect, useReducer, useState } from 'react';
import Avatar from '@talkdesk/cobalt-react-avatar';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import Tab from '@talkdesk/cobalt-react-tab';
import BadgeContainerWrapper from '@talkdesk/cobalt-marketplace-react-badge-container';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { Input } from '../../components/extensions/src';
export function ConversationQueue({
  onCollapse,
  onOpen,
  onNew,
}: {
  onCollapse: () => void;
  onOpen: () => void;
  onNew: () => void;
}) {
  // The native badge measures its text anchor. Refresh after late Cobalt font loads.
  const [fontRevision, refreshFont] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) refreshFont();
    };
    void document.fonts.ready.then(refresh);
    document.fonts.addEventListener('loadingdone', refresh);
    return () => {
      active = false;
      document.fonts.removeEventListener('loadingdone', refresh);
    };
  }, []);
  const [queue, setQueue] = useState('assigned');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(false);
  const [compact, setCompact] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const matches =
    search.trim().length < 3 ||
    'Carly Yates +1 814 458 3728'.toLowerCase().includes(search.toLowerCase());
  return (
    <aside
      className="call-conversations"
      aria-label="Conversations"
      data-testid="call-conversations"
    >
      <header className="call-queue-heading">
        <Heading level={2}>Conversations</Heading>
        <Button
          type="secondary"
          variation="transparent"
          size="tiny"
          shape="compact"
          aria-label="Collapse conversations"
          onPress={() => {
            onCollapse();
          }}
        >
          <Icon name="first_page" size="small" />
        </Button>
      </header>
      <nav className="call-queue-tabs" aria-label="Conversation inboxes">
        {['assigned', 'inbox'].map((value) => (
          <Tab
            key={value}
            href={`#${value}`}
            active={queue === value}
            aria-current={queue === value ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              setQueue(value);
            }}
          >
            {value === 'assigned' ? (
              <BadgeContainerWrapper
                key={fontRevision}
                color="red"
                size="tiny"
                badgeNumber={5}
                originPosition="NE"
                directionPosition="NE"
                gapX={2}
                gapY={8}
              >
                <span className="call-assigned-label" aria-label="Assigned to you, 5 conversations">
                  Assigned to you
                </span>
              </BadgeContainerWrapper>
            ) : (
              'Inbox'
            )}
          </Tab>
        ))}
      </nav>
      <div className="call-queue-tools">
        <Text size="small">6 conversations</Text>
        <div>
          <Button
            type="secondary"
            variation="transparent"
            size="tiny"
            shape="compact"
            aria-label="Reverse conversation order"
            aria-pressed={sort}
            onPress={() => setSort(!sort)}
          >
            <Icon name="format_line_spacing" size="small" />
          </Button>
          <Button
            type="secondary"
            variation="transparent"
            size="tiny"
            shape="compact"
            aria-label="Compact conversation list"
            aria-pressed={compact}
            onPress={() => setCompact(!compact)}
          >
            <Icon name="select_all" size="small" />
          </Button>
          <Button
            type="secondary"
            variation="transparent"
            size="tiny"
            shape="compact"
            aria-label="Filter active voice conversations"
            aria-pressed={filtered}
            onPress={() => setFiltered(!filtered)}
          >
            <Icon name="filter_list" size="small" />
          </Button>
        </div>
      </div>
      <div className="call-queue-body">
        <label className="call-search-label" htmlFor="call-search">
          <span className="call-visually-hidden">Search conversations by name or number</span>
          <Input
            id="call-search"
            type="search"
            size="medium"
            isFullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for name or number"
            prefix={<Icon name="search" size="small" />}
            aria-describedby="call-search-hint"
          />
        </label>
        <Text
          elementType="p"
          size="small"
          style={{ fontSize: 12, lineHeight: '16px' }}
          id="call-search-hint"
          className="call-subdued"
        >
          Type at least 3 characters to start searching
        </Text>
        <Heading level={3} className="call-voice-title">
          Voice
        </Heading>
        {queue === 'inbox' ? (
          <Text size="small">No unassigned voice conversations</Text>
        ) : matches ? (
          <Button
            type="secondary"
            variation="transparent"
            className={`call-contact${compact ? ' call-contact--compact' : ''}`}
            aria-label="Open Carly Yates conversation"
            onPress={() => {
              onOpen();
            }}
          >
            <span className="call-contact-avatar">
              <Avatar color="light-theme" size="small">
                CY
              </Avatar>
              <Icon name="phone_in_talk" size="tiny" />
            </span>
            <span className="call-contact-text">
              <Text size="small" weight="medium">
                Carly Yates
              </Text>
              <Text
                size="small"
                style={{ fontSize: 12, lineHeight: '16px' }}
                className="call-subdued"
              >
                +1 814 458 3728
              </Text>
            </span>
          </Button>
        ) : (
          <Text size="small">No matching conversations</Text>
        )}
        {(sort || filtered) && (
          <Text
            elementType="p"
            size="small"
            style={{ fontSize: 12, lineHeight: '16px' }}
            className="call-subdued"
          >
            {filtered ? 'Active voice conversations' : 'Newest first'}
          </Text>
        )}
      </div>
      <footer className="call-new">
        <Button
          type="secondary"
          variation="transparent"
          size="small"
          prefix={<Icon name="add_circle_outline" />}
          onPress={() => onNew()}
        >
          New conversation
        </Button>
      </footer>
    </aside>
  );
}
