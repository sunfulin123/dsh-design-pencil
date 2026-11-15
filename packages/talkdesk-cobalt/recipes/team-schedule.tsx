/** Screenshot-based Team Schedule: Cobalt chrome around a local, bounded day-grid prototype. */
import React, { useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import { Tag, TagGroup } from '@talkdesk/cobalt-react-tag';
import { Pagination } from '@talkdesk/cobalt-react-pagination';
import { Text } from '@talkdesk/cobalt-react-typography';
import Message from '@talkdesk/cobalt-react-message';
import Spinner from '@talkdesk/cobalt-react-spinner';
import Toolbar, { StartContent, EndContent } from '@talkdesk/cobalt-marketplace-react-toolbar';
import { FilterButton } from './support/filter-button';
import {
  DatePicker,
  Input,
  Dropdown,
  SidePanel,
  MultiDropdown,
  FormField,
  TimeSelectInput,
  Textarea,
} from '../components/extensions/src';
import { AGENTS, SAMPLE_EVENTS, type ScheduleEvent } from './support/schedule-data';
import { ScheduleTimeline } from './support/schedule-timeline';
import { ScheduleHeader } from './support/schedule-header';
import './support/team-schedule.css';
const FILTERS = Array.from({ length: 37 }, (_, i) => `agent${i + 1}`);
type Panel = 'filters' | 'issues' | 'settings' | 'sort' | 'agent' | 'copilot' | 'event' | null;
export default function TeamSchedule({ scenario = 'success' }: { scenario?: string }) {
  const [date, setDate] = useState(new Date(2026, 10, 15));
  const [zone, setZone] = useState('Asia/Shanghai');
  const [agents, setAgents] = useState(FILTERS);
  const [draft, setDraft] = useState(FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState<string | number>(25);
  const [panel, setPanel] = useState<Panel>(null);
  const [reversed, setReversed] = useState(false);
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [eventKind, setEventKind] = useState<ScheduleEvent['kind']>('work');
  const [event, setEvent] = useState<ScheduleEvent>();
  const [target, setTarget] = useState<string | number>('agent-7');
  const [start, setStart] = useState(9 * 60);
  const [end, setEnd] = useState(10 * 60);
  const [title, setTitle] = useState('Meeting');
  const [agentName, setAgentName] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(false);
  const denied = scenario === 'permission';
  const rows = AGENTS.filter((agent) => agent.name.toLowerCase().includes(search.toLowerCase()));
  if (reversed) rows.reverse();
  const total = Math.max(1, Math.ceil(rows.length / Number(size)));
  const current = Math.min(page, total);
  const visible = rows.slice((current - 1) * Number(size), current * Number(size));
  const openEvent = (item?: ScheduleEvent) => {
    setEvent(item);
    setEventKind(item?.kind ?? 'work');
    setTarget(item?.agent ?? 'agent-7');
    setStart(item ? Math.round(item.start * 60) : 540);
    setEnd(item ? Math.round(item.end * 60) : 600);
    setTitle(item?.title ?? 'Meeting');
    setPanel('event');
  };
  const apply = () => {
    if (panel === 'filters') {
      setAgents(draft);
    } else if (panel === 'event') {
      if (!title.trim() || end <= start) return;
      const next: ScheduleEvent = {
        id: event?.id ?? `event-${Date.now()}`,
        agent: String(target),
        start: start / 60,
        end: end / 60,
        title: title.trim(),
        kind: eventKind,
      };
      setEvents((items) =>
        event ? items.map((item) => (item.id === event.id ? next : item)) : [...items, next],
      );
    }
    setPanel(null);
  };
  const shift = (direction: number) =>
    setDate(
      (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate() + direction),
    );
  const panelTitle =
    panel === 'filters'
      ? 'Schedule filters'
      : panel === 'event'
        ? event
          ? 'Edit event'
          : 'Add event'
        : panel === 'issues'
          ? '913 issues found'
          : panel === 'settings'
            ? 'Schedule settings'
            : panel === 'sort'
              ? 'Sort options'
              : panel === 'agent'
                ? agentName
                : 'Copilot';
  return (
    <div className="team-schedule" data-component="TeamSchedule">
      <ScheduleHeader
        zone={zone}
        onZone={setZone}
        onPanel={setPanel}
        denied={denied}
        onTips={() => {
          setMessage('Review staffing differences and agent availability before adding events.');
          setPanel('settings');
        }}
        onAdd={(kind) => {
          openEvent();
          setEventKind(kind === 'break' ? 'break' : 'work');
        }}
      />

      <div className="schedule-toolbar-region">
        <Toolbar
          className="schedule-toolbar"
          role="toolbar"
          aria-label="Schedule controls"
          data-testid="schedule-toolbar"
          topBorder={false}
          bottomBorder={false}
          height="auto"
          style={{ flexShrink: 0, flexWrap: 'wrap', gap: 8 }}
        >
          <StartContent
            className="schedule-time-tools"
            style={{
              width: 'auto',
              minWidth: 0,
              flex: '1 1 auto',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <div className="schedule-date">
              <DatePicker
                value={date}
                onChange={setDate}
                size="small"
                isFullWidth
                formatDate={(value) =>
                  value.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                data-qa="schedule-date"
              />
            </div>
            <Button
              type="secondary"
              size="small"
              shape="compact"
              aria-label="Previous schedule day"
              onPress={() => shift(-1)}
            >
              <Icon name="chevron_left" />
            </Button>
            <Button
              type="secondary"
              variation="outline"
              size="small"
              onPress={() => setDate(new Date(2026, 10, 15))}
            >
              Today
            </Button>
            <Button
              type="secondary"
              size="small"
              shape="compact"
              aria-label="Next schedule day"
              onPress={() => shift(1)}
            >
              <Icon name="chevron_right" />
            </Button>
            <div style={{ width: 96 }}>
              <Dropdown
                value="day"
                onChange={() => {}}
                options={[{ value: 'day', label: 'Day' }]}
                size="small"
              />
            </div>
          </StartContent>
          <EndContent
            className="schedule-search-tools"
            style={{
              width: 'auto',
              minWidth: 0,
              flex: '1 1 360px',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <div className="schedule-search-field">
              <Input
                size="small"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by agent"
                prefix={<Icon name="search" size="small" />}
                data-qa="schedule-search"
              />
            </div>
            <Button
              size="small"
              type="secondary"
              variation="transparent"
              prefix={<Icon name="format_line_spacing" />}
              onPress={() => setPanel('sort')}
            >
              Sort options
            </Button>
            <FilterButton
              activeCount={agents.length ? 1 : 0}
              onPress={() => {
                setDraft(agents);
                setPanel('filters');
              }}
            />
          </EndContent>
        </Toolbar>
      </div>
      <div className="schedule-toolbar-region schedule-filter-toolbar-region">
        <Toolbar
          className="schedule-filters"
          role="toolbar"
          aria-label="Applied schedule filters"
          data-testid="schedule-applied-filters"
          topBorder={false}
          bottomBorder={false}
          backgroundColor="var(--surface-elevation-1)"
          height="auto"
          style={{ flexShrink: 0, flexWrap: 'wrap', gap: 8 }}
        >
          <StartContent
            className="schedule-filter-start"
            style={{
              width: 'auto',
              minWidth: 0,
              flex: '1 1 auto',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text>
              Filters: <span className="schedule-subdued">Queues</span>
            </Text>
            <TagGroup
              aria-label="Selected schedule agents"
              size="medium"
              onRemove={(keys) => setAgents((items) => items.filter((item) => !keys.has(item)))}
            >
              {agents.slice(0, 3).map((agent) => (
                <Tag id={agent} key={agent} textValue={agent}>
                  {agent}
                </Tag>
              ))}
            </TagGroup>
            {agents.length > 3 && (
              <Tag size="small" color="purple">
                +{agents.length - 3}
              </Tag>
            )}
          </StartContent>
          <EndContent style={{ width: 'auto', flex: 'none' }}>
            <Button size="small" type="secondary" onPress={() => setAgents([])}>
              Clear all
            </Button>
          </EndContent>
        </Toolbar>
      </div>
      {denied ? (
        <div className="schedule-state">
          <Message variation="warning">You do not have permission to view team schedules.</Message>
        </div>
      ) : scenario === 'loading' ? (
        <div className="schedule-state" role="status">
          <Spinner />
          <Text>Loading team schedule…</Text>
        </div>
      ) : scenario === 'error' && !retry ? (
        <div className="schedule-state">
          <Message variation="error">Unable to load schedule.</Message>
          <Button onPress={() => setRetry(true)}>Retry</Button>
        </div>
      ) : (
        <ScheduleTimeline
          agents={
            scenario === 'empty' ? [] : scenario === 'partial' ? visible.slice(0, 3) : visible
          }
          events={events}
          onEvent={openEvent}
          onAgent={(name) => {
            setAgentName(name);
            setPanel('agent');
          }}
        />
      )}
      <footer className="schedule-pagination" data-testid="schedule-pagination">
        <Pagination currentPage={current} totalPages={total} onChange={setPage} />
        <div>
          <Text size="small">Items per page</Text>
          <Dropdown
            size="small"
            value={size}
            onChange={(value) => {
              setSize(value);
              setPage(1);
            }}
            options={[
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 75, label: '75' },
            ]}
          />
        </div>
      </footer>
      <SidePanel
        visible={!!panel}
        title={panelTitle}
        closeLabel="Close schedule panel"
        onClose={() => setPanel(null)}
        actions={
          panel === 'filters' || panel === 'event'
            ? [
                ...(panel === 'event' && event
                  ? [
                      {
                        label: 'Delete event',
                        type: 'danger' as const,
                        onClick: () => {
                          setEvents((items) => items.filter((item) => item.id !== event.id));
                          setPanel(null);
                        },
                      },
                    ]
                  : []),
                { label: 'Cancel', onClick: () => setPanel(null) },
                {
                  label: panel === 'event' ? 'Save event' : 'Apply filters',
                  type: 'primary',
                  disabled: panel === 'event' && (!title.trim() || end <= start),
                  onClick: apply,
                },
              ]
            : []
        }
      >
        <div className="schedule-panel-fields">
          {panel === 'filters' ? (
            <>
              <FormField label={<span id="schedule-agent-filter-label">Agents</span>}>
                <MultiDropdown
                  aria-labelledby="schedule-agent-filter-label"
                  value={draft}
                  onChange={(values) => setDraft(values.map(String))}
                  options={FILTERS.map((value) => ({ value, label: value }))}
                  searchable
                  renderSelectAll
                  dismissValues
                  data-qa="schedule-agent-filter"
                  messages={{ searchPlaceholder: 'Search agents' }}
                />
              </FormField>
              <Button type="secondary" onPress={() => setDraft([])}>
                Clear selection
              </Button>
            </>
          ) : panel === 'event' ? (
            <>
              <FormField label="Event title" htmlFor="schedule-event-title">
                <Input
                  id="schedule-event-title"
                  isFullWidth
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </FormField>
              <FormField label={<span id="schedule-event-agent-label">Agent</span>}>
                <Dropdown
                  aria-labelledby="schedule-event-agent-label"
                  value={target}
                  onChange={setTarget}
                  options={AGENTS.map((agent) => ({ value: agent.id, label: agent.name }))}
                />
              </FormField>
              <FormField label="Start time" htmlFor="schedule-event-start">
                <TimeSelectInput
                  id="schedule-event-start"
                  value={start}
                  format24H
                  onChange={setStart}
                  data-qa="schedule-event-start"
                />
              </FormField>
              <FormField label="End time" htmlFor="schedule-event-end">
                <TimeSelectInput
                  id="schedule-event-end"
                  value={end}
                  format24H
                  onChange={setEnd}
                  data-qa="schedule-event-end"
                />
              </FormField>
              {end <= start && <Text role="alert">End time must be later than start time.</Text>}
            </>
          ) : panel === 'sort' ? (
            <>
              <Text>Sort agents by name.</Text>
              <Button
                onPress={() => {
                  setReversed(!reversed);
                  setPanel(null);
                }}
              >
                Use {reversed ? 'ascending' : 'descending'} order
              </Button>
            </>
          ) : panel === 'copilot' ? (
            <>
              <Text>Tell me which sample event you would like to create.</Text>
              <Textarea
                isFullWidth
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe a meeting…"
              />
              <Button
                onPress={() => {
                  openEvent();
                  setTitle(message.trim() || 'Meeting');
                }}
              >
                Open event form
              </Button>
              <Text size="small">Local demonstration; no AI service is connected.</Text>
            </>
          ) : panel === 'issues' ? (
            <>
              <Text>913 sample scheduling issues</Text>
              <Text>
                Staffing difference is below the required staffing in the selected intervals.
              </Text>
              <Text>9 pending team requests</Text>
            </>
          ) : panel === 'agent' ? (
            <>
              <Text>Agent schedule details</Text>
              <Text>{agentName}</Text>
              <Button
                onPress={() => {
                  const agent = AGENTS.find((item) => item.name === agentName);
                  openEvent();
                  if (agent) setTarget(agent.id);
                }}
              >
                Add event for agent
              </Button>
            </>
          ) : (
            <>
              <Text>{message || 'Day view, 24 hourly columns and 15-minute interval grid.'}</Text>
              <Text>Events, timezone labels and metrics are local sample data.</Text>
            </>
          )}
        </div>
      </SidePanel>
    </div>
  );
}
