import type { BasicTableColumn } from "../../components/extensions/src";
import { useState } from "react";
import { BasicTable, Button, ConfirmModal, SidePanel, Typography } from "../../components/extensions/src";
import Icon from "@talkdesk/cobalt-react-icon";
import Flex from "@talkdesk/cobalt-react-flex";
const rows = [
  { id: "1", name: "Alice", role: "Agent", status: "Active" },
  { id: "2", name: "Bob", role: "Supervisor", status: "Inactive" },
  { id: "3", name: "Carol", role: "Agent", status: "Active" },
];
export default function Demo() {
  const [editing, setEditing] = useState<(typeof rows)[number] | null>(null);
  const [deleting, setDeleting] = useState<(typeof rows)[number] | null>(null);
  const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
    { key: "name", title: "Name" },
    { key: "role", title: "Role" },
    { key: "status", title: "Status" },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <Flex alignY="center" gap="2" data-qa={`row-${row.id}-actions`}>
          <Button
            aria-label={`Edit ${row.name}`}
            data-qa={`row-${row.id}-edit`}
            shape="compact"
            type="secondary"
            variation="transparent"
            tooltip={`Edit ${row.name}`}
            onClick={() => setEditing(row)}
          >
            <Icon name="edit" size="tiny" />
          </Button>
          <Button
            aria-label={`Delete ${row.name}`}
            data-qa={`row-${row.id}-delete`}
            shape="compact"
            type="danger"
            variation="transparent"
            tooltip={`Delete ${row.name}`}
            onClick={() => setDeleting(row)}
          >
            <Icon name="trash" size="tiny" />
          </Button>
        </Flex>
      ),
    },
  ];
  return (
    <>
      <BasicTable
        headers={columns}
        data={rows}
        currentPage={1}
        totalPages={1}
        onPageClick={() => {}}
      />

      <SidePanel
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ""}
        size="small"
        actions={
          editing
            ? [
                {
                  label: "Cancel",
                  type: "secondary",
                  onClick: () => setEditing(null),
                },
                {
                  label: "Save",
                  type: "primary",
                  onClick: () => setEditing(null),
                },
              ]
            : []
        }
        data-qa="basictable-edit-side-panel"
      >
        {editing && (
          <Flex direction="column" gap="2">
            <Typography variant="body">
              Edit details for <strong>{editing.name}</strong>.
            </Typography>
            <Typography variant="caption">Role: {editing.role}</Typography>
            <Typography variant="caption">Status: {editing.status}</Typography>
          </Flex>
        )}
      </SidePanel>

      <ConfirmModal
        visible={!!deleting}
        onDismiss={() => setDeleting(null)}
        onAction={() => setDeleting(null)}
        iconName="trash"
        actionButtonType="danger"
        actionButtonText="Delete"
        data-qa="basictable-delete-confirm"
        content={
          deleting && (
            <>
              <Typography variant="body-emphasis">Delete {deleting.name}?</Typography>
              <Typography variant="caption">This action cannot be undone.</Typography>
            </>
          )
        }
      />
    </>
  );
}
