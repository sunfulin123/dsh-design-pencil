/** Cobalt card patterns from the supplied reference screens, with local sample interactions. */
import React, { useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import Divider from '@talkdesk/cobalt-react-divider';
import EmptyWidget from '@talkdesk/cobalt-marketplace-react-empty-widget';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { Card, SelectGroup, Dropdown, FormField } from '../../components/extensions/src';
import { ReferenceChart } from './reference-charts';
const KEYWORDS = [
  ['Welcome', 'sentiment_satisfied', 230],
  ['Website issues', 'sentiment_dissatisfied', 221],
  ['Follow-up', 'sentiment_neutral', 214],
  ['Issues with payment', 'sentiment_dissatisfied', 200],
  ['Satisfied', 'sentiment_satisfied', 152],
  ['Cannot use product', 'sentiment_dissatisfied', 120],
  ['Helpfull service', 'sentiment_satisfied', 117],
  ['Order number', 'sentiment_neutral', 21],
] as const;
export function WidgetPatterns() {
  const [days, setDays] = useState(['SAT', 'SUN', 'TUE']);
  const [shift, setShift] = useState<string | number>('10-hour-1');
  const [rule, setRule] = useState<string | number | undefined>();
  const [show, setShow] = useState(true);
  const [preview, setPreview] = useState(false);
  return (
    <section className="widget-patterns" aria-label="Card composition examples">
      <Card padding="6">
        <div className="widget-heading widget-pattern-title">
          <Heading level={2}>Special Template</Heading>
          <Tag size="small" color="light-purple">
            Intent
          </Tag>
        </div>
        <div className="widget-metadata">
          <Text size="small">US English</Text>
          <Text size="small">Last update on July 09, 2024 at 09:16 PM</Text>
        </div>
      </Card>
      <Card padding="6">
        <Heading level={2}>N° of requests</Heading>
        <Text size="small">Number of times agents requested an AI summary</Text>
        <EmptyWidget title="No data to display." message="Seems that there is no data to display.">
          <Icon name="show_chart" size="large" color="var(--gray-8)" />
        </EmptyWidget>
      </Card>
      <Card padding="4">
        <div className="widget-heading">
          <Text size="small">USE CASE</Text>
          <Text size="small">Version 0.0.1</Text>
        </div>
        <Heading level={2} style={{ color: 'var(--text-primary)', marginBlock: 16 }}>
          Summarization
        </Heading>
        <Divider />
        <Icon name="avatar_chatbot" color="var(--text-primary)" style={{ marginTop: 16 }} />
      </Card>
      <Card padding="6">
        <div className="widget-sentiment">
          <div>
            <Icon name="sentiment_satisfied" color="var(--green-9)" />
            <Text weight="medium">Overall Customer Sentiment</Text>
            <Heading level={2}>Positive</Heading>
          </div>
          <div style={{ width: 120 }}>
            <ReferenceChart kind="sentiment" height={120} />
          </div>
        </div>
      </Card>
      <Card padding="6">
        <Heading level={2}>Top Saved Search Keywords</Heading>
        <div className="widget-keywords">
          {KEYWORDS.map(([label, icon, count]) => (
            <div key={label}>
              <Tag size="small" color="light-purple">
                {label}
              </Tag>
              <Icon
                name={icon}
                color={
                  icon === 'sentiment_satisfied'
                    ? 'var(--green-9)'
                    : icon === 'sentiment_dissatisfied'
                      ? 'var(--red-9)'
                      : 'var(--gray-10)'
                }
              />
              <Text weight="medium">{count}</Text>
            </div>
          ))}
        </div>
      </Card>
      {show ? (
        <Card padding="6">
          <Text weight="medium">
            Shifts distribution <Icon name="info_outline" size="tiny" />
          </Text>
          <div className="widget-shift">
            <div className="widget-shift-fields">
              <SelectGroup
                mode="multi"
                value={days}
                onChange={setDays}
                options={['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
              <div className="widget-shift-selects">
                <FormField label="Shift">
                  <Dropdown
                    value={shift}
                    onChange={(value) => setShift(value ?? '10-hour-1')}
                    options={[
                      { value: '10-hour-1', label: '10-hour-1' },
                      { value: '8-hour-1', label: '8-hour-1' },
                    ]}
                  />
                </FormField>
                <FormField label="Break">
                  <Dropdown
                    value={rule}
                    onChange={(value) => setRule(value ?? undefined)}
                    options={[
                      { value: 'standard', label: 'Standard break' },
                      { value: 'flexible', label: 'Flexible break' },
                    ]}
                    messages={{ placeholder: 'Select break rule' }}
                  />
                </FormField>
              </div>
              {preview && (
                <Text role="status">
                  {shift} · {days.join(', ')} · {rule ?? 'No break rule'}
                </Text>
              )}
            </div>
            <Button
              type="primary"
              variation="transparent"
              shape="compact"
              aria-label="Delete shift distribution"
              onPress={() => setShow(false)}
            >
              <Icon name="delete_outline" />
            </Button>
            <Button
              type="primary"
              variation="transparent"
              shape="compact"
              aria-label="Preview shift distribution"
              onPress={() => setPreview(!preview)}
            >
              <Icon name="visibility" />
            </Button>
          </div>
        </Card>
      ) : (
        <Button variation="outline" onPress={() => setShow(true)}>
          Restore shift distribution
        </Button>
      )}
    </section>
  );
}
