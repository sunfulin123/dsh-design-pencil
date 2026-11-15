/** Read-only user fields shared by list cells and record details. */
import React from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import { ChipGroup } from '../../components/extensions/src';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { Text } from '@talkdesk/cobalt-react-typography';

export function StatusTag({ active }: { active: boolean }) {
  return (
    <Tag size="small" color={active ? 'light-green' : 'light-gray'}>
      {active ? 'Active' : 'Inactive'}
    </Tag>
  );
}

/** Existing ChipGroup owns truncation and the complete overflow popup. */
export function TagsCell({ values }: { values: string[] }) {
  if (!values.length) return <Text>-</Text>;
  return (
    <ChipGroup
      items={values.map((value) => ({ id: value, label: value }))}
      maxVisible={2}
      size="small"
      data-qa="user-queues"
    />
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Flex direction="column" gap={1}>
      <Text size="small" variant="description">
        {label}
      </Text>
      <div>{children}</div>
    </Flex>
  );
}
