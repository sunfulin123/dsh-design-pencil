/** Compact title/description block aligned with naturally sized actions. */
import React from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import Button from '@talkdesk/cobalt-react-button';
import Divider from '@talkdesk/cobalt-react-divider';
import Icon from '@talkdesk/cobalt-react-icon';
import Tab from '@talkdesk/cobalt-react-tab';
import { AppPageHeader, Typography } from '../../components/extensions/src';
export function ListPageHeader({ padding, viewport, tab, setTab, selectedCount, onRefresh, onExport, onBulkManagement, onWorkflow }: {
 padding: number; viewport: 'small' | 'medium' | 'large'; tab: 'users' | 'invitations';
 setTab: (tab: 'users' | 'invitations') => void; selectedCount: number;
 onRefresh?: () => void; onExport?: () => void; onBulkManagement?: () => void;
 onWorkflow: (workflow: 'create' | 'import') => void;
}) {
 return <AppPageHeader paddingX={0} paddingY={0} isBordered={false}>
      <Flex direction="column" alignX="stretch">
        <Flex data-testid="list-heading-row" alignX="space-between" alignY="center" gap={2} wrap style={{ padding, flexShrink: 0 }}>
          <Flex data-testid="list-heading-text" direction="column" gap={0} style={{ minWidth: 0 }}>
            <Typography variant="page-title" scale="medium" data-qa="list-page-title">Users</Typography>
            <Flex alignY="center" gap={2}>
              <Typography variant="body" tone="subdued" data-qa="list-page-description">Manage users and access.</Typography>
              <Button
                size="tiny"
                variation="transparent"
                disabled={!onRefresh}
                onPress={onRefresh}
                prefix={<Icon name="refresh" size="tiny" />}
              >
                Refresh
              </Button>
            </Flex>
          </Flex>
          {/* Natural width beside the title while they fit; when they don't, as in a 768px app, they wrap below
              it, and on small viewports they also wrap onto more lines. */}
          <Flex
            data-testid="list-heading-actions"
            gap={3}
            alignY="center"
            style={viewport === 'small' ? { flexWrap: 'wrap' } : { flex: 'none' }}
          >
            <Button
              type="secondary"
              variation="transparent"
              disabled={!onBulkManagement || !selectedCount}
              onPress={() => onBulkManagement?.()}
              prefix={<Icon name="all_inbox" />}
            >
              Bulk management
            </Button>
            <Divider vertical style={{ height: 40 }} />
            {/* Icons as in the Figma layout (upload on Export, download on Import); an open question on the
                List View page, since the opposite reading is common. */}
            <Button
              type="primary"
              variation="outline"
              disabled={!onExport}
              onPress={onExport}
              prefix={<Icon name="upload" />}
            >
              Export
            </Button>
            <Button
              type="primary"
              variation="outline"
              onPress={() => { onWorkflow('import'); }}
              data-testid="list-import"
              prefix={<Icon name="download" />}
            >
              Import
            </Button>
            <Button type="primary" data-testid="list-create-user" onPress={() => { onWorkflow('create'); }}>
              Create user
            </Button>
          </Flex>
        </Flex>
        <nav
          aria-label="Users sections"
          style={{ display: 'flex', gap: 16, paddingInline: padding }}
        >
          {(['users', 'invitations'] as const).map((key) => (
            <Tab
              key={key}
              href={`#${key}`}
              active={tab === key}
              aria-current={tab === key ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setTab(key);
              }}
            >
              {key === 'users' ? 'Users' : 'Invitations'}
            </Tab>
          ))}
        </nav>
        <Divider />
      </Flex>

</AppPageHeader>;
}
