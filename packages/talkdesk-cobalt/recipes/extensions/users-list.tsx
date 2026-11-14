import React, { useState } from 'react';
import {
  AppPage,
  AppPageHeader,
  AppPageMain,
  AppPageContent,
  BasicTable,
  Button,
  Input,
  FormField,
  SidePanel,
  Typography,
} from '../../components/extensions/src';
const initial = [
  { id: '1', name: 'Alex Sample', role: 'Supervisor' },
  { id: '2', name: 'Morgan Example', role: 'Agent' },
  { id: '3', name: 'Jamie Demo', role: 'Agent' },
];
/** A reusable business recipe. The host controls scenario selection outside this page. */
export default function UsersList({ scenario = 'success' }: { scenario?: string }) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const filtered = rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()));
  const data = scenario === 'empty' ? [] : scenario === 'partial' ? filtered.slice(0, 1) : filtered;
  return (
    <AppPage>
      <AppPageHeader>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="page-title">Users</Typography>
          <Button onClick={() => setOpen(true)}>Create user</Button>
        </div>
      </AppPageHeader>
      <AppPageMain>
        <AppPageContent paddingX={0} paddingY={0}>
          <div style={{ minWidth: 0, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            {scenario === 'permission' ? (
              <Typography>You do not have permission to manage users.</Typography>
            ) : (
              <>
                <div style={{ padding: 16 }}><FormField htmlFor="user-search" label="Search users"><Input isFullWidth
                  id="user-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name"
                /></FormField></div>
                <BasicTable
                  headers={[
                    { key: 'name', title: 'Name', sortable: true, width: 50 },
                    { key: 'role', title: 'Role', width: 50 },
                  ]}
                  data={data}
                  currentPage={1}
                  totalPages={1}
                  onPageClick={() => {}}
                  isFetching={scenario === 'loading'}
                  isRequestError={scenario === 'error'}
                  onRefresh={() => setSearch('')}
                />
              </>
            )}
          </div>
        </AppPageContent>
      </AppPageMain>
      <SidePanel
        title="Create user"
        closeLabel="Close create user panel"
        visible={open}
        onClose={() => setOpen(false)}
        actions={[
          {
            label: 'Save user',
            type: 'primary',
            onClick: () => {
              if (name.trim()) {
                setRows((previous) => [
                  ...previous,
                  { id: String(Date.now()), name: name.trim(), role: 'Agent' },
                ]);
                setName('');
                setOpen(false);
              }
            },
          },
        ]}
      >
        <FormField htmlFor="user-name" label="Full name"><Input isFullWidth id="user-name" value={name} onChange={(event) => setName(event.target.value)} /></FormField>
      </SidePanel>
    </AppPage>
  );
}
