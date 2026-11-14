import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeProvider from '@talkdesk/cobalt-react-theme-provider';
import ViewportProvider from '@talkdesk/cobalt-react-viewport-provider';
import PortalProvider from '@talkdesk/cobalt-react-portal-provider';
import { SelectGroup } from '../select-group';
import { Textarea } from '../textarea';
import { Typography } from '../typography';
import { FormField } from '../form-field';
import { Tag } from '@talkdesk/cobalt-react-tag';
const wrap = (children: React.ReactNode) => (
  <ThemeProvider loader={async () => null}>
    <ViewportProvider>
      <PortalProvider>{children}</PortalProvider>
    </ViewportProvider>
  </ThemeProvider>
);
test('selection group preserves controlled single selection with Cobalt 3', async () => {
  function Demo() {
    const [value, setValue] = useState('a');
    return (
      <>
        <SelectGroup
          options={[
            { label: 'Alpha', value: 'a' },
            { label: 'Beta', value: 'b' },
          ]}
          value={value}
          onChange={setValue}
        />
        <output>{value}</output>
      </>
    );
  }
  render(wrap(<Demo />));
  await userEvent.click(await screen.findByRole('radio', { name: 'Beta' }));
  expect(screen.getByRole('status')).toHaveTextContent('b');
});
test('textarea preserves native change callback while using new TextField API', async () => {
  function Demo() {
    const [value, setValue] = useState('');
    return (
      <>
        <Textarea id="notes" value={value} onChange={(e) => setValue(e.target.value)} />
        <output>{value}</output>
      </>
    );
  }
  render(wrap(<Demo />));
  await userEvent.type(await screen.findByRole('textbox'), 'Hello');
  expect(screen.getByRole('status')).toHaveTextContent('Hello');
});
test('typography loading uses a skeleton and restores its text', async () => {
  const { rerender } = render(wrap(<Typography loading={2}>Pending text</Typography>));
  expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
  expect(screen.queryByText('Pending text')).not.toBeInTheDocument();
  rerender(wrap(<Typography>Ready text</Typography>));
  expect(screen.getByText('Ready text')).toBeInTheDocument();
});
test('new named Tag and grouped field render together', async () => {
  render(
    wrap(
      <>
        <Tag>Active</Tag>
        <FormField label="Amount" prefix="$">
          <input aria-label="Amount value" />
        </FormField>
      </>,
    ),
  );
  expect(await screen.findByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Amount value' })).toBeInTheDocument();
});
