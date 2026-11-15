/** Bounded, keyboard-operable day timeline composed from Cobalt cells and event buttons. */
import React, { useState } from 'react';
import Avatar from '@talkdesk/cobalt-react-avatar';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import { Link } from '@talkdesk/cobalt-react-link';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { Text } from '@talkdesk/cobalt-react-typography';
import { Dropdown } from '../../components/extensions/src';
import { METRICS, REQUIRED, PREDICTED, AWT, type ScheduleEvent } from './schedule-data';
interface Agent {
  id: string;
  name: string;
  badge: number;
}
export function ScheduleTimeline({
  agents,
  events,
  onEvent,
  onAgent,
}: {
  agents: Agent[];
  events: ScheduleEvent[];
  onEvent: (event: ScheduleEvent) => void;
  onAgent: (name: string) => void;
}) {
  const [pins, setPins] = useState(METRICS);
  const [queue, setQueue] = useState<string | number>('all');
  const value = (row: number, hour: number) =>
    row === 0
      ? `${[13, 18].includes(hour) ? 1 : 0}%`
      : row === 1
        ? `${AWT[hour]}s`
        : row === 2
          ? REQUIRED[hour]
          : row === 3
            ? PREDICTED[hour]
            : row === 4
              ? (PREDICTED[hour] - REQUIRED[hour]).toFixed(2)
              : Math.max(0, Math.round(PREDICTED[hour]));
  return (
    <div className="schedule-scroll" data-testid="schedule-scroll">
      <div className="schedule-table" role="table" aria-label="Agent day schedule">
        <div className="schedule-hours" role="row">
          <div className="schedule-queue-cell" role="columnheader">
            <Text size="small">Queue view:</Text>
            <Dropdown
              value={queue}
              onChange={setQueue}
              options={[
                { value: 'all', label: 'All selected queues' },
                { value: 'support', label: 'Support' },
              ]}
              size="small"
            />
          </div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div role="columnheader" key={hour}>
              <Text size="small">
                {hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}
              </Text>
            </div>
          ))}
        </div>
        <div className="schedule-metrics" role="row">
          <div className="schedule-metric-labels">
            <div className="schedule-agent-total">
              <Text weight="medium">75 Agents</Text>
              <Tag size="small" color="light-blue">
                Simulation idle
              </Tag>
            </div>
            <div>
              {METRICS.map((label) => (
                <div className="schedule-metric-label" key={label}>
                  <Button
                    shape="compact"
                    size="tiny"
                    variation="transparent"
                    type="primary"
                    aria-label={`Pin ${label}`}
                    aria-pressed={pins.includes(label)}
                    onPress={() =>
                      setPins((items) =>
                        items.includes(label)
                          ? items.filter((item) => item !== label)
                          : [...items, label],
                      )
                    }
                  >
                    <Icon name="push_pin" size="micro" />
                  </Button>
                  <Text size="small">{label}</Text>
                  <Icon name="info_outline" size="micro" />
                </div>
              ))}
            </div>
          </div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div className="schedule-metric-values" key={hour}>
              {METRICS.map((label, row) => (
                <div key={label} className={row === 4 ? 'schedule-shortage' : ''}>
                  {row < 2 ? (
                    <Tag size="tiny" color="gray">
                      {value(row, hour)}
                    </Tag>
                  ) : (
                    <Text size="small">{value(row, hour)}</Text>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="schedule-agent-rows">
          {agents.map((agent) => (
            <div role="row" key={agent.id} className="schedule-agent-row">
              <div role="rowheader" className="schedule-agent">
                <Avatar size="small" color="theme">
                  {agent.name
                    .split(' ')
                    .map((word) => word[0])
                    .slice(0, 3)
                    .join('')}
                </Avatar>
                <Link
                  href={`#${agent.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onAgent(agent.name);
                  }}
                >
                  {agent.name}
                </Link>
                {agent.badge > 0 && (
                  <Tag size="small" color="light-purple">
                    <Icon name="event_note" size="micro" />
                    {agent.badge}
                  </Tag>
                )}
              </div>
              <div role="cell" className="schedule-agent-track">
                {events
                  .filter((event) => event.agent === agent.id)
                  .map((event) => (
                    <Button
                      key={event.id}
                      size="tiny"
                      className={`schedule-event schedule-event--${event.kind}${event.striped ? ' schedule-event--striped' : ''}`}
                      aria-label={`${agent.name}: ${event.title}, ${event.start} to ${event.end}`}
                      data-testid={`schedule-event-${event.id}`}
                      style={{
                        // Native button dimensions are intended for actions; timeline segments encode duration.
                        maxWidth: 'none',
                        height:
                          event.kind === 'work'
                            ? 46
                            : event.kind === 'break'
                              ? 38
                              : agent.id === 'agent-6'
                                ? 23
                                : 32,
                        backgroundColor: `var(--schedule-${event.kind})`,
                        left: `${(event.start / 24) * 100}%`,
                        width: `${((event.end - event.start) / 24) * 100}%`,
                      }}
                      onPress={() => onEvent(event)}
                    >
                      <span className="schedule-visually-hidden">{event.title}</span>
                    </Button>
                  ))}
              </div>
            </div>
          ))}
          <div className="schedule-now" aria-label="Sample time marker at 4:18 PM" />
        </div>
      </div>
    </div>
  );
}
