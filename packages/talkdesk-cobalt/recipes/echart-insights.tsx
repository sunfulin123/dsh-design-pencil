/** Screenshot-based Insights composition. Reuse by copying this recipe and its support sources. */
import React, { useEffect, useState } from 'react';
import Toolbar, { StartContent, EndContent } from '@talkdesk/cobalt-marketplace-react-toolbar';
import Button from '@talkdesk/cobalt-react-button';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { SelectionGroup, SelectionGroupOption } from '@talkdesk/cobalt-react-selection-group';
import Tab from '@talkdesk/cobalt-react-tab';
import { Tag, TagGroup } from '@talkdesk/cobalt-react-tag';
import Message from '@talkdesk/cobalt-react-message';
import Spinner from '@talkdesk/cobalt-react-spinner';
import { Menu, MenuItem, MenuTrigger } from '@talkdesk/cobalt-react-menu';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import {
  AppPage,
  AppPageHeader,
  Card,
  DatePicker,
  Dialog,
  FormField,
  Input,
  BasicTable,
} from '../components/extensions/src';
import { FilterButton } from './support/filter-button';
import { InsightsChart, type InsightsRange } from './support/insights-chart';
import { InsightsFilters, SAMPLE_AGENTS } from './support/insights-filters';
import { InsightsHeaderActions } from './support/insights-header-actions';
import { InsightsCopilot } from './support/insights-copilot';
import './support/insights.css';
const DEFAULT_TITLE = 'Average time to abandon vs Average wait time';
interface Props {
  scenario?: string;
  onRefresh?: () => void;
}
export default function EchartInsights({ scenario = 'success', onRefresh }: Props) {
  const [tab, setTab] = useState('chart');
  const [date, setDate] = useState(new Date(2026, 10, 15));
  const [range, setRange] = useState<InsightsRange>('Day');
  const [agents, setAgents] = useState(SAMPLE_AGENTS);
  const [filters, setFilters] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_TITLE);
  const [cards, setCards] = useState([{ id: 'predicted', title: DEFAULT_TITLE }]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [retry, setRetry] = useState(false);
  const [copilot, setCopilot] = useState(false);
  useEffect(() => {
    setRetry(false);
  }, [scenario]);
  const refresh = () => {
    setRevision((value) => value + 1);
    setRetry(true);
    onRefresh?.();
  };
  const shift = (direction: number) =>
    setDate(
      (value) =>
        new Date(
          value.getFullYear(),
          value.getMonth(),
          value.getDate() + direction * (range === 'Day' ? 1 : range === 'Week' ? 7 : 30),
        ),
    );
  const denied = scenario === 'permission';
  const exportSummary = (format: 'csv' | 'json') => {
    const summary = {
      date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-'),
      range,
      agents,
      ata: 273,
      awt: scenario === 'partial' ? null : 273,
    };
    const content =
      format === 'json'
        ? JSON.stringify(summary, null, 2)
        : `metric,predicted_average_seconds\nAverage time to abandon,${summary.ata}\nAverage wait time,${summary.awt ?? ''}\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `insights-summary.${format}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <AppPage data-component="EchartInsights">
      <AppPageHeader paddingX={6} paddingY={0}>
        <Flex className="insights-heading-row" alignX="space-between" alignY="center" gap={3} wrap>
          <Heading level={1} style={{ fontSize: 28, lineHeight: '36px', margin: 0 }}>
            Insights
          </Heading>
          <InsightsHeaderActions
            disabled={denied || scenario === 'loading'}
            onAskCopilot={() => setCopilot(true)}
            onExport={exportSummary}
          />
        </Flex>
        <nav aria-label="Insight views" className="insights-tabs">
          {['chart', 'summary'].map((value) => (
            <Tab
              key={value}
              href={`#${value}`}
              active={tab === value}
              aria-current={tab === value ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                setTab(value);
              }}
            >
              {value === 'chart' ? 'Chart' : 'Summary'}
            </Tab>
          ))}
        </nav>
      </AppPageHeader>
      <div className="insights-controls">
        <Toolbar
          topBorder={false}
          height="auto"
          style={{ flexShrink: 0, minHeight: 48, flexWrap: 'wrap', rowGap: 8 }}
          data-testid="insights-toolbar"
        >
          <StartContent
            className="insights-time-controls"
            alignY="center"
            style={{ width: 'auto', flex: '1 1 auto', minWidth: 0, flexWrap: 'wrap', gap: 8 }}
          >
            <div className="insights-date">
              <DatePicker
                isFullWidth
                value={date}
                onChange={setDate}
                size="small"
                data-qa="insights-date"
                formatDate={(value) =>
                  value.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
              />
            </div>
            <Flex gap={1} alignY="center">
              <Button
                shape="compact"
                size="small"
                type="secondary"
                aria-label="Previous period"
                onPress={() => shift(-1)}
              >
                <Icon name="chevron_left" />
              </Button>
              <Button
                size="small"
                type="secondary"
                variation="outline"
                onPress={() => setDate(new Date())}
              >
                Today
              </Button>
              <Button
                shape="compact"
                size="small"
                type="secondary"
                aria-label="Next period"
                onPress={() => shift(1)}
              >
                <Icon name="chevron_right" />
              </Button>
            </Flex>
            <SelectionGroup
              aria-label="Insight time range"
              data-testid="insights-time-range"
              size="small"
              style={{ width: 'auto', flex: 'none' }}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[range]}
              onSelectionChange={(keys) => {
                const value = keys[0];
                if (value === 'Day' || value === 'Week' || value === 'Month') setRange(value);
              }}
            >
              {(['Day', 'Week', 'Month'] as const).map((value) => (
                <SelectionGroupOption key={value} id={value}>
                  {value}
                </SelectionGroupOption>
              ))}
            </SelectionGroup>
          </StartContent>
          <EndContent style={{ width: 'auto', flex: 'none', gap: 8 }}>
            <Button
              size="small"
              type="secondary"
              variation="transparent"
              disabled={denied}
              prefix={<Icon name="add" size="tiny" />}
              onPress={() => {
                setDraft(DEFAULT_TITLE);
                setDialog(true);
              }}
            >
              Add chart
            </Button>
            <FilterButton activeCount={agents.length ? 1 : 0} onPress={() => setFilters(true)} />
            <Button
              size="small"
              shape="compact"
              type="secondary"
              variation="transparent"
              aria-label="Refresh insights"
              onPress={refresh}
            >
              <Icon name="refresh" />
            </Button>
          </EndContent>
        </Toolbar>
      </div>
      <div
        className="insights-filter-scroll"
        tabIndex={0}
        aria-label="Scroll applied insight filters"
        data-testid="insights-filter-scroll"
      >
        <Toolbar
          topBorder={false}
          height="48px"
          backgroundColor="var(--surface-elevation-1)"
          style={{ flexShrink: 0, minWidth: 640, flexWrap: 'nowrap', gap: 8 }}
          role="toolbar"
          aria-label="Applied insight filters"
          data-testid="insights-applied-filters"
        >
          <StartContent
            className="insights-filter-start"
            alignY="center"
            style={{ width: 'auto', flex: '1 0 auto', flexWrap: 'nowrap', gap: 8 }}
          >
            <Text>Filters:</Text>
            <Text variant="description">{agents.length ? 'Agents' : 'None'}</Text>
            <TagGroup
              aria-label="Selected insight agents"
              style={{ width: 'auto', flex: 'none' }}
              size="medium"
              onRemove={(keys) =>
                setAgents((previous) => previous.filter((value) => !keys.has(value)))
              }
            >
              {agents.slice(0, 3).map((agent) => (
                <Tag id={agent} key={agent} textValue={agent} data-testid="insights-agent-tag">
                  {agent}
                </Tag>
              ))}
            </TagGroup>
            {agents.length > 3 && (
              <Button
                type="primary"
                variation="transparent"
                size="tiny"
                className="insights-overflow-tag"
                data-testid="insights-agent-overflow"
                aria-label={`Show ${agents.length - 3} more agents`}
                onPress={() => setFilters(true)}
              >
                <Tag size="medium" color="theme">
                  +{agents.length - 3}
                </Tag>
              </Button>
            )}
          </StartContent>
          <EndContent style={{ width: 'auto', flex: 'none' }}>
            <Button
              size="small"
              type="secondary"
              disabled={!agents.length}
              onPress={() => setAgents([])}
            >
              Clear all
            </Button>
          </EndContent>
        </Toolbar>
      </div>
      <main className="insights-main" data-testid="insights-content">
        {denied ? (
          <Message variation="warning">You do not have access to Insights.</Message>
        ) : scenario === 'loading' ? (
          <Flex padding={8} alignX="center">
            <Spinner />
            <Text>Loading insights…</Text>
          </Flex>
        ) : scenario === 'error' && !retry ? (
          <Message variation="error">
            <Text>Could not load insights.</Text>
            <Button onPress={refresh}>Try again</Button>
          </Message>
        ) : scenario === 'empty' || !cards.length ? (
          <Card>
            <Text>No charts yet.</Text>
            <Button onPress={() => setDialog(true)}>Add chart</Button>
          </Card>
        ) : tab === 'summary' ? (
          <Card>
            <Heading level={2}>Summary</Heading>
            <BasicTable
              headers={[
                { key: 'metric', title: 'Metric' },
                { key: 'average', title: 'Predicted average' },
              ]}
              data={[
                { id: 'ata', metric: 'Average time to abandon', average: '273s' },
                {
                  id: 'awt',
                  metric: 'Average wait time',
                  average: scenario === 'partial' ? 'Unavailable' : '273s',
                },
              ]}
              currentPage={1}
              totalPages={1}
              onPageClick={() => {}}
            />
          </Card>
        ) : (
          <>
            {scenario === 'partial' && (
              <Message variation="warning">Average wait time is temporarily unavailable.</Message>
            )}
            {cards.map((card) => (
              <Card key={card.id} padding="6" data-qa="insights-chart-card">
                <Flex alignX="space-between" alignY="center" gap={3} style={{ marginBottom: 20 }}>
                  <Heading
                    level={2}
                    style={{ margin: 0, fontSize: 24, lineHeight: '32px', fontWeight: 400 }}
                  >
                    {card.title}
                  </Heading>
                  <Flex gap={2} style={{ flex: 'none' }}>
                    <MenuTrigger>
                      <Button
                        size="small"
                        shape="compact"
                        type="secondary"
                        variation="transparent"
                        aria-label={`Chart actions: ${card.title}`}
                      >
                        <Icon name="more_horiz" />
                      </Button>
                      <Menu
                        onAction={(key) => {
                          if (key === 'remove')
                            setCards((previous) =>
                              previous.filter((value) => value.id !== card.id),
                            );
                        }}
                      >
                        <MenuItem id="remove" icon="delete_outline">
                          Remove chart
                        </MenuItem>
                      </Menu>
                    </MenuTrigger>
                    <Button
                      size="small"
                      shape="compact"
                      type="secondary"
                      variation="transparent"
                      aria-label={`${collapsed.includes(card.id) ? 'Expand' : 'Collapse'} chart`}
                      aria-expanded={!collapsed.includes(card.id)}
                      onPress={() =>
                        setCollapsed((previous) =>
                          previous.includes(card.id)
                            ? previous.filter((value) => value !== card.id)
                            : [...previous, card.id],
                        )
                      }
                    >
                      <Icon name={collapsed.includes(card.id) ? 'expand_more' : 'unfold_less'} />
                    </Button>
                  </Flex>
                </Flex>
                {!collapsed.includes(card.id) && (
                  <InsightsChart
                    date={date}
                    range={range}
                    partial={scenario === 'partial'}
                    revision={revision}
                  />
                )}
              </Card>
            ))}
          </>
        )}
      </main>
      {filters && (
        <InsightsFilters
          selected={agents}
          onClose={() => setFilters(false)}
          onApply={(value) => {
            setAgents(value);
            setRevision((value) => value + 1);
            setFilters(false);
          }}
        />
      )}
      <InsightsCopilot open={copilot} onClose={() => setCopilot(false)} />
      <Dialog
        visible={dialog}
        title="Add insight chart"
        onClose={() => setDialog(false)}
        isConfirmDisabled={!draft.trim()}
        messages={{ confirmLabel: 'Add chart' }}
        onConfirm={() => {
          setCards((previous) => [...previous, { id: crypto.randomUUID(), title: draft.trim() }]);
          setDialog(false);
        }}
      >
        <FormField
          label="Chart title"
          htmlFor="insights-new-title"
          description="This prototype uses sample ATA and AWT predictions."
        >
          <Input
            id="insights-new-title"
            isFullWidth
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </FormField>
      </Dialog>
    </AppPage>
  );
}
