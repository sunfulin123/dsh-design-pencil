/** Editable widget dashboard plus reusable Cobalt card compositions. */
import React, { useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import Divider from '@talkdesk/cobalt-react-divider';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { Card, Dialog, FormField, Input, Dropdown } from '../components/extensions/src';
import { ReferenceChart, type ChartKind } from './support/reference-charts';
import { WidgetPatterns } from './support/widget-patterns';
import './support/widget-gallery.css';
interface Widget {
  id: string;
  title: string;
  value?: string;
  kind?: ChartKind;
  live?: boolean;
}
const INITIAL: Widget[] = [
  { id: 'service', title: 'Service Level', value: '85%' },
  { id: 'abandon', title: 'Avg. Abandon Time', value: '02:17' },
  { id: 'wait', title: 'Avg. Wait Time', value: '02:33' },
  { id: 'longest', title: 'Longest Wait Time', value: '00:00', live: true },
  { id: 'agents', title: 'Count of Agents Logged-In', kind: 'agents', live: true },
  { id: 'contacts', title: 'Live Contacts (Inbound)', kind: 'contacts', live: true },
];
export default function CardWidgets() {
  const [widgets, setWidgets] = useState(INITIAL);
  const [saved, setSaved] = useState(INITIAL);
  const [editing, setEditing] = useState(true);
  const [dialog, setDialog] = useState<string>();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<string | number>('metric');
  const open = (widget?: Widget) => {
    setDialog(widget?.id ?? 'new');
    setTitle(widget?.title ?? '');
    setKind(widget?.kind ?? 'metric');
  };
  return (
    <div className="widget-page" data-component="CardWidgets">
      <header className="widget-page-header">
        <Heading level={1}>Franklin Fulin Sun</Heading>
        <div className="widget-actions">
          <Button
            variation="outline"
            size="small"
            prefix={<Icon name="add_circle_outline" size="small" />}
            onPress={() => open()}
          >
            Add widget
          </Button>
          <Divider vertical style={{ height: 40 }} />
          {editing ? (
            <>
              <Button
                size="small"
                type="secondary"
                onPress={() => {
                  setWidgets(saved);
                  setEditing(false);
                }}
              >
                Discard
              </Button>
              <Button
                size="small"
                onPress={() => {
                  setSaved(widgets);
                  setEditing(false);
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <Button size="small" onPress={() => setEditing(true)}>
              Edit dashboard
            </Button>
          )}
        </div>
      </header>
      <main className="widget-page-content">
        <div className="widget-dashboard">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={widget.kind ? 'widget-dashboard-wide' : 'widget-dashboard-metric'}
            >
              <Card padding="3" height="100%">
                <div className="widget-heading">
                  <div>
                    <Text weight="medium">{widget.title}</Text>
                    <Text size="small">
                      {widget.live ? (
                        <>
                          <Icon name="fiber_manual_record" size="micro" color="var(--green-8)" />{' '}
                          Live
                        </>
                      ) : (
                        <>
                          <Icon name="schedule" size="small" /> Today
                        </>
                      )}
                    </Text>
                  </div>
                  {editing && (
                    <div className="widget-actions">
                      <Button
                        size="tiny"
                        shape="compact"
                        type="secondary"
                        variation="transparent"
                        aria-label={`Delete ${widget.title}`}
                        onPress={() =>
                          setWidgets((items) => items.filter((item) => item.id !== widget.id))
                        }
                      >
                        <Icon name="delete_outline" size="small" />
                      </Button>
                      <Button
                        size="tiny"
                        shape="compact"
                        type="secondary"
                        variation="transparent"
                        aria-label={`Configure ${widget.title}`}
                        onPress={() => open(widget)}
                      >
                        <Icon name="settings" size="small" />
                      </Button>
                    </div>
                  )}
                </div>
                {widget.kind ? (
                  <ReferenceChart kind={widget.kind} height={520} />
                ) : (
                  <div className="widget-big-value">
                    <Text>{widget.value}</Text>
                  </div>
                )}
                {editing && (
                  <div className="widget-handles" aria-hidden="true">
                    <Icon name="drag_indicator" size="tiny" />
                    <Icon name="crop_free" size="tiny" />
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
        <Heading level={2} className="widget-patterns-title">
          Card patterns
        </Heading>
        <WidgetPatterns />
      </main>
      <Dialog
        visible={!!dialog}
        title={dialog === 'new' ? 'Add widget' : 'Configure widget'}
        onClose={() => setDialog(undefined)}
        onConfirm={() => {
          if (!title.trim()) return;
          setWidgets((items) =>
            dialog === 'new'
              ? [
                  ...items,
                  {
                    id: `widget-${Date.now()}`,
                    title: title.trim(),
                    ...(kind === 'metric'
                      ? { value: '0' }
                      : { kind: kind as ChartKind, live: true }),
                  },
                ]
              : items.map((item) => (item.id === dialog ? { ...item, title: title.trim() } : item)),
          );
          setEditing(true);
          setDialog(undefined);
        }}
        isConfirmDisabled={!title.trim()}
        messages={{ confirmLabel: 'Save widget' }}
      >
        <div className="widget-dialog-fields">
          <FormField label="Widget title" htmlFor="widget-title">
            <Input
              id="widget-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              isFullWidth
            />
          </FormField>
          {dialog === 'new' && (
            <FormField label="Widget type">
              <Dropdown
                value={kind}
                onChange={(value) => setKind(value ?? 'metric')}
                options={[
                  { value: 'metric', label: 'Metric' },
                  { value: 'agents', label: 'Agents donut' },
                  { value: 'contacts', label: 'Contacts donut' },
                ]}
              />
            </FormField>
          )}
        </div>
      </Dialog>
    </div>
  );
}
