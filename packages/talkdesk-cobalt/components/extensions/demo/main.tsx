import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ThemeProvider from '@talkdesk/cobalt-react-theme-provider';
import ViewportProvider from '@talkdesk/cobalt-react-viewport-provider';
import PortalProvider from '@talkdesk/cobalt-react-portal-provider';
import '@talkdesk/cobalt-theme-base/dist/styles.css';
import { SelectGroup, Textarea, Typography, SidePanel, FormField, Button } from '../src';
function Demo() {
  const [selection, setSelection] = useState('a');
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <main style={{ padding: 24, maxWidth: 640, margin: 'auto' }}>
      <Typography variant="page-title">Cobalt Extensions</Typography>
      <SelectGroup
        value={selection}
        onChange={setSelection}
        options={[
          { label: 'Alpha', value: 'a' },
          { label: 'Beta', value: 'b' },
        ]}
      />
      <output aria-label="Selection">{selection}</output>
      <FormField label="Notes" prefix="Text">
        <Textarea id="notes" value={value} onChange={(e) => setValue(e.target.value)} />
      </FormField>
      <output aria-label="Notes value">{value}</output>
      <Button onClick={() => setOpen(true)}>Open details</Button>
      <SidePanel
        title="Details"
        visible={open}
        onClose={() => setOpen(false)}
        closeLabel="Close details"
      >
        <Typography>Panel content</Typography>
      </SidePanel>
      <Typography loading={2}>Loading content</Typography>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <ViewportProvider>
      <PortalProvider>
        <Demo />
      </PortalProvider>
    </ViewportProvider>
  </ThemeProvider>,
);
