/** Read-only user fields shared by list cells and record details. */
import React from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { Text } from '@talkdesk/cobalt-react-typography';

export function StatusTag({ active }: { active: boolean }) {
  return (
    <Tag size="small" color={active ? 'light-green' : 'light-gray'}>
      {active ? 'Active' : 'Inactive'}
    </Tag>
  );
}

// The first two values as tags, the rest as a "+N" tag.
export function TagsCell({ values }: { values: string[] }) {
  if (!values.length) return <Text>-</Text>;
  return (
    <Flex gap={1} alignY="center">
      {values.slice(0, 2).map((v) => (
        <Tag key={v} size="small" color="light-gray">
          {v}
        </Tag>
      ))}
      {values.length > 2 && (
        <Tag size="small" color="theme">
          {`+${values.length - 2}`}
        </Tag>
      )}
    </Flex>
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
