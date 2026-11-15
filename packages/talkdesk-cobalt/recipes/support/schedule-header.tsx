/** Native Cobalt schedule title, timezone and action controls. */
import React from 'react';
import Button, { SplitButton } from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import BadgeContainerWrapper from '@talkdesk/cobalt-marketplace-react-badge-container';
import { TimezoneDropdown } from '../../components/extensions/src';
import { Link } from '@talkdesk/cobalt-react-link';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { Menu, MenuTrigger, MenuItem } from '@talkdesk/cobalt-react-menu';
export function ScheduleHeader({
  zone,
  onZone,
  onPanel,
  onTips,
  onAdd,
  denied,
}: {
  zone: string;
  onZone: (zone: string) => void;
  onPanel: (panel: 'issues' | 'settings' | 'copilot') => void;
  onTips: () => void;
  onAdd: (kind: string) => void;
  denied: boolean;
}) {
  return (
    <header className="schedule-header">
      <div>
        <div className="schedule-title">
          <Heading level={1}>Team Schedule</Heading>
          <div className="schedule-timezone" role="group" aria-label="Schedule timezone">
            <TimezoneDropdown
              customInput={
                <Button
                  type="secondary"
                  variation="transparent"
                  size="small"
                  aria-label={`Schedule timezone: ${zone.split('/').at(-1)?.replaceAll('_', ' ')}`}
                  aria-haspopup="listbox"
                  prefix={<Icon name="language" size="small" />}
                  suffix={<Icon name="chevron_down" size="small" />}
                >
                  {zone.split('/').at(-1)?.replaceAll('_', ' ')}
                </Button>
              }
              value={zone}
              onChange={onZone}
              data-qa="schedule-timezone"
              messages={{ searchPlaceholder: 'Search timezones' }}
            />
          </div>
        </div>
        <Text size="small">
          Updated today, 1:05 PM,{' '}
          <Link
            href="#issues"
            onClick={(event) => {
              event.preventDefault();
              onPanel('issues');
            }}
          >
            913 issues found
          </Link>
        </Text>
      </div>
      <div className="schedule-header-actions">
        <Button
          type="secondary"
          variation="transparent"
          shape="compact"
          aria-label="Schedule settings"
          onPress={() => onPanel('settings')}
        >
          <Icon name="settings" />
        </Button>
        <Button
          type="secondary"
          variation="transparent"
          shape="compact"
          aria-label="Scheduling tips"
          onPress={onTips}
        >
          <Icon name="lightbulb_outline" />
        </Button>
        <BadgeContainerWrapper
          color="red"
          size="tiny"
          badgeContent="+9"
          originPosition="NE"
          directionPosition="NW"
          gapY={8}
          gapX={0}
        >
          <Button
            type="secondary"
            variation="transparent"
            shape="compact"
            aria-label="9 pending team requests"
            data-testid="schedule-requests"
            onPress={() => onPanel('issues')}
          >
            <Icon name="event_note" />
          </Button>
        </BadgeContainerWrapper>
        <Button
          variation="transparent"
          prefix={<Icon name="gen_ai" />}
          onPress={() => onPanel('copilot')}
        >
          Ask Copilot
        </Button>
        <SplitButton aria-label="Schedule event actions">
          <Button disabled={denied} prefix={<Icon name="add" />} onPress={() => onAdd('work')}>
            Add event
          </Button>
          <MenuTrigger>
            <Button disabled={denied} shape="compact" aria-label="More event actions">
              <Icon name="chevron_down" />
            </Button>
            <Menu aria-label="Event options" onAction={(key) => onAdd(String(key))}>
              <MenuItem id="meeting">Add meeting</MenuItem>
              <MenuItem id="break">Add break</MenuItem>
            </Menu>
          </MenuTrigger>
        </SplitButton>
      </div>
    </header>
  );
}
