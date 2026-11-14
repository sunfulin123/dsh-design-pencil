/** Reusable list page: marketplace Toolbar and Cobalt Extensions BasicTable.
 * Read recipes/list-page.md before adapting. The table owns columns, sort controls,
 * loading/error/empty rendering and pagination; the page owns data and selection state.
 */
import React, { useMemo, useState } from 'react';
import Toolbar, {
  StartContent,
  EndContent,
  Search,
  Filters,
} from '@talkdesk/cobalt-marketplace-react-toolbar';
import Button from '@talkdesk/cobalt-react-button';
import { Checkbox } from '@talkdesk/cobalt-react-checkbox';
import Divider from '@talkdesk/cobalt-react-divider';
import Flex from '@talkdesk/cobalt-react-flex';
// The default export loads the icon font itself; the named `Icon` export needs an IconsProvider above it.
import Icon from '@talkdesk/cobalt-react-icon';
import { Link } from '@talkdesk/cobalt-react-link';
import { Menu, MenuItem, MenuTrigger } from '@talkdesk/cobalt-react-menu';
import Message from '@talkdesk/cobalt-react-message';
import { BasicTable, SidePanel, SortDirection, type BasicTableColumn } from '../components/extensions/src';
import Tab from '@talkdesk/cobalt-react-tab';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { useViewport } from '@talkdesk/cobalt-react-viewport-provider';

const PAGE_SIZE = 15;
// Page padding from the layout guidance: 12px / 16px / 24px on small / medium / large viewports.
const PAGE_PADDING = { small: 12, medium: 16, large: 24 } as const;

/* ---------- data: replace with yours --------------------------------------------------- */

import { SAMPLE_USERS, type User } from './list-page-data';
import { ListPageDialogs, type UserDraft, type ListWorkflow } from './support/list-page-dialogs';
import { StatusTag, TagsCell, DetailRow } from './support/list-user-fields';
export { SAMPLE_USERS, type User } from './list-page-data';

type SortKey = 'name' | 'role' | 'team' | 'email' | 'active';
type TableUser = User & { actions?: never };
const isSortKey = (key: string): key is SortKey =>
  ['name', 'role', 'team', 'email', 'active'].includes(key);

/* ---------- cells ---------------------------------------------------------------------- */

/* An active filter, 20px tall as in the design: a small core Tag with a clickable close Icon. Known gaps:
   core TagGroup won't take a small size (and names every remove button just "Remove"); Marketplace
   DismissibleTag is small but its close button has no accessible name. The Icon's `accessibilityLabel` names
   the button. Its 16px target passes WCAG 2.5.8 through the spacing exception: keep chips 8px apart. */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Tag size="small" color="light-gray">
      <Flex alignY="center" gap={1}>
        {label}
        <Icon
          name="close"
          size="micro"
          accessibilityLabel={`Remove filter ${label}`}
          onClick={onRemove}
        />
      </Flex>
    </Tag>
  );
}

// Known gap: a Checkbox with no visible label collapses to 0px height and sits off-centre in a table cell;
// the wrapper gives it its box.
function CellCheckbox(props: React.ComponentProps<typeof Checkbox>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 20, flex: 'none' }}>
      <Checkbox {...props} />
    </div>
  );
}

/* ---------- page ----------------------------------------------------------------------- */

interface Props {
  users?: User[];
  onCreate?: (draft: UserDraft) => void | Promise<void>;
  onEdit?: (user: User) => void;
  onExport?: () => void;
  onImport?: (file: File) => void | Promise<void>;
  onBulkManagement?: (users: User[]) => void;
  onRefresh?: () => void;
  scenario?: string;
}

export default function ListPage({
  users: suppliedUsers = SAMPLE_USERS,
  onCreate,
  onEdit,
  onExport,
  onImport,
  onBulkManagement,
  onRefresh,
  scenario = 'success',
}: Props) {
  const viewport = useViewport();
  const padding = PAGE_PADDING[viewport];
  const [tab, setTab] = useState<'users' | 'invitations'>('users');
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [sort, setSort] = useState<Record<string, SortDirection>>({ name: SortDirection.ASC });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<User | null>(null);
  const [workflow, setWorkflow] = useState<ListWorkflow | null>(null);
  const [created, setCreated] = useState<User[]>([]);
  const [notice, setNotice] = useState('');
  const users = useMemo(() => [...suppliedUsers, ...created], [suppliedUsers, created]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const entry = Object.entries(sort).find(
      ([key, direction]) => isSortKey(key) && direction !== SortDirection.UNSORTED,
    );
    const key = entry?.[0];
    const direction = entry?.[1];
    const sortValue = (u: User) =>
      key && isSortKey(key)
        ? key === 'active'
          ? u.active
            ? '0'
            : '1'
          : (u[key] ?? '').toString()
        : '';
    const available =
      scenario === 'empty' ? [] : scenario === 'partial' ? users.slice(1, 2) : users;
    return available
      .filter(
        (u) =>
          (!onlyActive || u.active) &&
          (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          sortValue(a).localeCompare(sortValue(b), undefined, { numeric: true }) *
          (direction === SortDirection.ASC ? 1 : -1),
      );
  }, [users, search, onlyActive, sort, scenario]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rowIds = rows.map((u) => u.id);
  const selectedHere = rowIds.filter((id) => selected.has(id)).length;

  const select = (ids: string[], isSelected: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (isSelected ? next.add(id) : next.delete(id)));
      return next;
    });
  const changeFilters = (apply: () => void) => {
    apply();
    setPage(1);
  };
  const headers: BasicTableColumn<TableUser>[] = [
    {
      key: 'id',
      title: (
        <CellCheckbox
          aria-label="Select all users on this page"
          isSelected={rows.length > 0 && selectedHere === rows.length}
          isIndeterminate={selectedHere > 0 && selectedHere < rows.length}
          onChange={(checked) => select(rowIds, checked)}
        />
      ),
      width: 5,
      render: (user) => (
        <CellCheckbox
          aria-label={`Select ${user.name}`}
          isSelected={selected.has(user.id)}
          onChange={(checked) => select([user.id], checked)}
        />
      ),
    },
    {
      key: 'name',
      title: 'Name',
      width: 20,
      sortable: true,
      render: (user) => <Link onPress={() => setDetails(user)}>{user.name}</Link>,
    },
    { key: 'role', title: 'Role', width: 10, sortable: true },
    {
      key: 'queues',
      title: 'Queues',
      width: 10,
      render: (user) => <TagsCell values={user.queues} />,
    },
    { key: 'team', title: 'Team', width: 10, sortable: true, render: (user) => user.team ?? '-' },
    { key: 'integration', title: 'Integration', width: 10 },
    {
      key: 'email',
      title: 'Email',
      width: 20,
      sortable: true,
      render: (user) => (
        <Text truncated title={user.email}>
          {user.email}
        </Text>
      ),
    },
    {
      key: 'active',
      title: 'Activation',
      width: 10,
      sortable: true,
      render: (user) => <StatusTag active={user.active} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 5,
      render: (user) => (
        <MenuTrigger>
          <Button
            type="secondary"
            variation="transparent"
            shape="compact"
            size="small"
            aria-label={`More actions for ${user.name}`}
          >
            <Icon name="more_horiz" />
          </Button>
          <Menu
            placement="bottom end"
            disabledKeys={onEdit ? [] : ['edit']}
            onAction={(key) => {
              if (key === 'view') setDetails(user);
              if (key === 'edit') onEdit?.(user);
            }}
          >
            <MenuItem id="view" icon="visibility">
              View details
            </MenuItem>
            <MenuItem id="edit" icon="edit">
              Edit
            </MenuItem>
          </Menu>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <Flex direction="column" alignX="stretch">
      <span
        id="list-users-search-label"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      >
        Search users
      </span>
      {/* The page header is built from core parts. Marketplace Header splits its width into three equal columns,
          which leaves the actions a third of the page: too narrow for five actions. */}
      <Flex direction="column" alignX="stretch">
        <Flex alignX="space-between" alignY="start" gap={2} wrap style={{ padding }}>
          <Flex direction="column" gap={1}>
            <Heading level={1}>Users</Heading>
            <Flex alignY="center" gap={2}>
              <Text variant="description">Manage users and access.</Text>
              <Button
                size="small"
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
            gap={3}
            alignY="center"
            style={viewport === 'small' ? { flexWrap: 'wrap' } : { flex: 'none' }}
          >
            <Button
              type="secondary"
              variation="transparent"
              disabled={!onBulkManagement || !selected.size}
              onPress={() => onBulkManagement?.(users.filter((user) => selected.has(user.id)))}
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
              onPress={() => { setDetails(null); setWorkflow('import'); }}
              data-testid="list-import"
              prefix={<Icon name="download" />}
            >
              Import
            </Button>
            <Button type="primary" data-testid="list-create-user" onPress={() => { setDetails(null); setWorkflow('create'); }}>
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

      {tab === 'invitations' ? (
        <Flex padding={6}>
          <Text variant="description">There are no pending invitations.</Text>
        </Flex>
      ) : (
        <>
          <Toolbar topBorder={false} data-testid="list-toolbar">
            <StartContent style={{ minWidth: 0 }}>
              <Text weight="medium">
                {scenario === 'permission'
                  ? 'Users'
                  : `${filtered.length} ${filtered.length === 1 ? 'user' : 'users'}`}
              </Text>
            </StartContent>
            <EndContent style={{ flex: 'none', width: 'auto', gap: 4 }}>
              {viewport !== 'small' && (
                <Search
                  aria-labelledby="list-users-search-label"
                  value={search}
                  placeholder="Search users"
                  dismissable
                  triggerDelay={200}
                  onSearch={(value) => changeFilters(() => setSearch(value))}
                />
              )}
              <Filters
                badgeNumber={onlyActive ? 1 : 0}
                onClick={() => changeFilters(() => setOnlyActive(!onlyActive))}
              />
            </EndContent>
          </Toolbar>
          {viewport === 'small' && (
            <div style={{ padding }}>
              <Search
                aria-labelledby="list-users-search-label"
                value={search}
                placeholder="Search users"
                dismissable
                triggerDelay={200}
                onSearch={(value) => changeFilters(() => setSearch(value))}
              />
            </div>
          )}
          {/* Reserve the filter row so clearing filters does not move the table. */}
          <Toolbar topBorder={false} data-testid="list-filter-toolbar">
            <StartContent alignY="center" gap={3}>
              <Text>Filters:</Text>
              {onlyActive ? (
                <FilterChip
                  label="Active"
                  onRemove={() => changeFilters(() => setOnlyActive(false))}
                />
              ) : (
                <Text variant="description">None</Text>
              )}
            </StartContent>
            <EndContent style={{ flex: 'none', width: 'auto' }}>
              <Button
                size="small"
                type="secondary"
                disabled={!onlyActive}
                onPress={() => changeFilters(() => setOnlyActive(false))}
              >
                Clear all
              </Button>
            </EndContent>
          </Toolbar>

          {scenario === 'permission' ? (
            <div style={{ padding }}>
              <Text>You do not have permission to manage users.</Text>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }} data-testid="list-table-scroll">
              <div style={{ minWidth: 1280 }}>
                <BasicTable<TableUser>
                  headers={headers}
                  data={rows}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageClick={setPage}
                  defaultSort={{ name: SortDirection.ASC }}
                  onSortClick={(next) => {
                    setSort(next);
                    setPage(1);
                  }}
                  isFetching={scenario === 'loading'}
                  isRequestError={scenario === 'error'}
                  onRefresh={onRefresh}
                  maxPagesCount={5}
                  messageComponent={
                    <Message variation="info" style={{ padding: '12px 24px' }} data-testid="list-selection-message">
                      <Flex alignY="center" gap={2}>
                        <Icon name="info_outline" />
                        <Text weight="medium">Select users to perform batch actions.</Text>
                      </Flex>
                    </Message>
                  }
                  emptyStateComponent={
                    <Text>
                      {scenario === 'empty' || !users.length
                        ? 'There are no users yet.'
                        : 'No users match your search or filters.'}
                    </Text>
                  }
                />
              </div>
            </div>
          )}
        </>
      )}

      <div role="status" aria-live="polite" data-testid="list-workflow-status">{notice}</div>
      {workflow && <ListPageDialogs key={workflow} workflow={workflow} users={users} onClose={() => setWorkflow(null)}
        onCreate={async draft => {
          await onCreate?.(draft);
          if (!onCreate) setCreated(previous => [...previous, { ...draft, id: crypto.randomUUID(), queues: [], integration: 'Default', active: true }]);
          setNotice(`Created ${draft.name}.`);
        }}
        onImport={async file => { await onImport?.(file); setNotice(`Selected file: ${file.name}`); }}/>}
      <SidePanel
        title="User details"
        visible={details !== null}
        onClose={() => setDetails(null)}
        closeLabel="Close user details"
        actions={[{
          label: 'Edit',
          disabled: !onEdit,
          onClick: () => details && onEdit?.(details),
        }]}
      >
        {details && (
          <Flex direction="column" gap={4} width="100%">
            <Heading level={3} asLevel={4}>
              {details.name}
            </Heading>
            <Divider />
            <DetailRow label="Role">{details.role}</DetailRow>
            <DetailRow label="Email">{details.email}</DetailRow>
            <DetailRow label="Queues">
              <Flex gap={1} wrap>
                {details.queues.map((q) => (
                  <Tag key={q} size="small" color="light-gray">
                    {q}
                  </Tag>
                ))}
              </Flex>
            </DetailRow>
            <DetailRow label="Team">{details.team ?? '-'}</DetailRow>
            <DetailRow label="Activation">
              <StatusTag active={details.active} />
            </DetailRow>
          </Flex>
        )}
      </SidePanel>
    </Flex>
  );
}
