/** List-page workflows compose editable Extensions; host callbacks own persistence. */
import React, { useState } from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import { Text } from '@talkdesk/cobalt-react-typography';
import { useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Dialog, FormField, Input, Dropdown, UploadFile } from '../../components/extensions/src';
import type { User } from '../list-page-data';
export type UserDraft = Pick<User, 'name' | 'email' | 'role' | 'team'>;
export type ListWorkflow = 'create' | 'import';
const roles: User['role'][] = ['Agent', 'Supervisor', 'Administrator'];

export function ListPageDialogs({ workflow, users, onClose, onCreate, onImport }: {
  workflow: ListWorkflow; users: User[]; onClose: () => void;
  onCreate: (draft: UserDraft) => void | Promise<void>;
  onImport: (file: File) => void | Promise<void>;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<UserDraft>({ name: '', email: '', role: 'Agent', team: '' });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email', string>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const close = () => { if (!busy) onClose(); };
  const submit = async () => {
    if (busy) return;
    const value = { ...draft, name: draft.name.trim(), email: draft.email.trim(), team: draft.team?.trim() || null };
    if (workflow === 'create') {
      const next: typeof errors = {};
      if (!value.name) next.name = 'Enter a full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) next.email = 'Enter a valid email address.';
      else if (users.some(user => user.email.toLowerCase() === value.email.toLowerCase())) next.email = 'A user with this email already exists.';
      setErrors(next);
      if (Object.keys(next).length) return;
    } else if (!file) { setError('Choose a CSV file.'); return; }
    setBusy(true); setError('');
    try {
      if (workflow === 'create') await onCreate(value);
      else await onImport(file!);
      onClose();
    } catch {
      setError(workflow === 'create' ? 'Could not create the user. Try again.' : 'Could not submit the import. Try again.');
    } finally { setBusy(false); }
  };
  const errorHint = (field: 'name' | 'email') => errors[field] && <span id={`create-${field}-error`} role="alert"><Text color={theme.error10}>{errors[field]}</Text></span>;
  return <Dialog visible title={workflow === 'create' ? 'New user' : 'Import users'}
    data-qa={workflow === 'create' ? 'list-create-dialog' : 'list-import-dialog'}
    onClose={close} onConfirm={() => { void submit(); }} isConfirmLoading={busy}
    isConfirmDisabled={busy || (workflow === 'import' && !file)}
    messages={{ confirmLabel: workflow === 'create' ? 'Create user' : 'Import file' }}>
    {workflow === 'create' ? <form aria-label="New user form" data-testid="create-user-form" noValidate onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={busy} style={{ border: 0, margin: 0, padding: 0 }}><Flex direction="column" gap={4} width="100%">
        <FormField label="Full name" htmlFor="create-name" isRequired variation={errors.name ? 'error' : undefined}>
          <Input id="create-name" isFullWidth autoFocus disabled={busy} value={draft.name} variation={errors.name ? 'error' : undefined}
            aria-describedby={errors.name ? 'create-name-error' : undefined}
            onChange={event => setDraft({ ...draft, name: event.target.value })}/>{errorHint('name')}
        </FormField>
        <FormField label="Email" htmlFor="create-email" isRequired variation={errors.email ? 'error' : undefined}>
          <Input id="create-email" type="email" isFullWidth disabled={busy} value={draft.email} variation={errors.email ? 'error' : undefined}
            aria-describedby={errors.email ? 'create-email-error' : undefined}
            onChange={event => setDraft({ ...draft, email: event.target.value })}/>{errorHint('email')}
        </FormField>
        <FormField label={<span id="create-role-label">Role</span>} isRequired>
          <Dropdown aria-labelledby="create-role-label" disabled={busy} value={draft.role} options={roles.map(role => ({value: role, label: role}))} data-qa="create-role"
            onChange={value => { const role = roles.find(role => role === value); if (role) setDraft({ ...draft, role }); }}/>
        </FormField>
        <FormField label="Team" htmlFor="create-team">
          <Input id="create-team" isFullWidth disabled={busy} value={draft.team ?? ''} onChange={event => setDraft({ ...draft, team: event.target.value })}/>
        </FormField>
      </Flex></fieldset>
      <button type="submit" hidden aria-hidden="true" tabIndex={-1}>Submit new user</button>
    </form> : <div data-testid="import-users-form" aria-busy={busy}>
      <fieldset disabled={busy} style={{ border: 0, margin: 0, padding: 0 }}><FormField label="Users file" isRequired description="Choose a CSV file up to 5 MB.">
        <UploadFile file={file} accept=".csv" maxSizeBytes={5 * 1024 * 1024} data-qa="import-users-upload"
          description="CSV files up to 5 MB" variation={error ? 'error' : undefined}
          onFileChange={value => { if (!busy) { setFile(value); setError(''); } }}
          onError={type => { if (!busy) { setFile(null); setError(type === 'tooLarge' ? 'Choose a file smaller than 5 MB.' : 'Choose a CSV file.'); } }}/>
      </FormField></fieldset>
    </div>}
    {error && <div role="alert" style={{ marginTop: 16 }}><Text color={theme.error10}>{error}</Text></div>}
  </Dialog>;
}
