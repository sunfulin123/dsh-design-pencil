/**
 * Recipe: form page — page header with a pre-title, the record's name, Cancel and Save; the form in sections
 * separated by full-width dividers; required fields, a format check, a read-only value, dropdowns and a toggle.
 *
 * Matches the Users app form layout in Figma (Edit user - Form layout), except that every field gets its own
 * row: Patterns › Forms and validation asks for one column, so Last name sits below First name. Also from
 * that guidance: the form column is half the page wide on large and medium viewports and full width on small
 * ones; 16px between inputs; 24px around dividers; no placeholder text. Save stays enabled; errors show under
 * a field once the user has left it, and on every field when Save is pressed.
 *
 * Copy this file and replace the fields. It needs the app setup from Get started › Develop (theme
 * stylesheet, ThemeProvider, ViewportProvider, PortalProvider) and these packages:
 *   @talkdesk/cobalt-react-button @talkdesk/cobalt-react-divider @talkdesk/cobalt-react-dropdown
 *   @talkdesk/cobalt-react-flex @talkdesk/cobalt-react-tag @talkdesk/cobalt-react-text-input
 *   @talkdesk/cobalt-react-toggle @talkdesk/cobalt-react-typography @talkdesk/cobalt-react-viewport-provider
 *
 * Compiled against the published packages on every docs build (scripts/check-examples.mjs).
 */
import React, { useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Divider from '@talkdesk/cobalt-react-divider';
import { Dropdown, DropdownItem } from '@talkdesk/cobalt-react-dropdown';
import Flex from '@talkdesk/cobalt-react-flex';
import { Tag } from '@talkdesk/cobalt-react-tag';
import { TextInput } from '@talkdesk/cobalt-react-text-input';
import { Toggle, ToggleGroup } from '@talkdesk/cobalt-react-toggle';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { useViewport } from '@talkdesk/cobalt-react-viewport-provider';

// Page padding and the space around dividers: 12px / 16px / 24px on small / medium / large viewports.
const PAGE_PADDING = { small: 12, medium: 16, large: 24 } as const;
// 16px between inputs, and between a section title and its first input.
const INPUT_GAP = 4;

import {
  FormControlExamples,
  SAMPLE_CONTROLS,
  type FormControlValues,
} from './support/form-control-examples';

/* ---------- data: replace with yours --------------------------------------------------- */

export interface Profile {
  /** Controlled Extensions values returned by Save; Dates use the local calendar. */
  controlExamples?: FormControlValues;
  firstName: string;
  lastName: string;
  role: string | null;
  active: boolean;
  email: string;
  externalId: string | null;
  team: string | null;
}

const ROLES = ['Administrator', 'Supervisor', 'Agent'];
const NO_TEAM = 'none';
const TEAMS = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];

// A fictional person; @example.com addresses only.
export const SAMPLE_PROFILE: Profile = {
  controlExamples: SAMPLE_CONTROLS,
  firstName: 'Avery',
  lastName: 'Example',
  role: 'Agent',
  active: true,
  email: 'avery.example@example.com',
  externalId: null,
  team: null,
};

type Errors = Partial<Record<keyof Profile, string>>;

function validate(p: Profile): Errors {
  const errors: Errors = {};
  if (!p.firstName.trim()) errors.firstName = 'Enter a first name.';
  if (!p.role) errors.role = 'Select a role.';
  if (!p.email.trim()) errors.email = 'Enter an email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()))
    errors.email = 'Enter an email like name@example.com.';
  return errors;
}

/* ---------- layout ----------------------------------------------------------------------- */

// One form section: an optional title, then its fields, in the form column. Sections are separated by
// full-width dividers, so the padding sits on the section, not on the page.
function Section({
  title,
  padding,
  width,
  children,
}: {
  title?: string;
  padding: number;
  width: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      direction="column"
      alignX="stretch"
      gap={INPUT_GAP}
      style={{ padding, width, boxSizing: 'border-box' }}
    >
      {title && (
        <Heading level={2} asLevel={6}>
          {title}
        </Heading>
      )}
      {children}
    </Flex>
  );
}

// A read-only value: a label above a tag, as in the design. Not an input, so nothing suggests it can be edited.
function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <Flex direction="column" gap={1}>
      <Text weight="medium">{label}</Text>
      <div>
        <Tag size="small" color="light-gray">
          {value}
        </Tag>
      </div>
    </Flex>
  );
}

/* ---------- page ----------------------------------------------------------------------- */

interface Props {
  initial?: Profile;
  onCancel?: () => void;
  onSave?: (profile: Profile) => void;
}

export default function FormPage({ initial = SAMPLE_PROFILE, onCancel, onSave }: Props) {
  const viewport = useViewport();
  const padding = PAGE_PADDING[viewport];
  const columnWidth = viewport === 'small' ? '100%' : '50%';
  const [form, setForm] = useState<Profile>(() => ({
    ...initial,
    controlExamples: initial.controlExamples ?? SAMPLE_CONTROLS,
  }));
  const [touched, setTouched] = useState<Set<keyof Profile>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(form);
  const errorFor = (field: keyof Profile) =>
    submitted || touched.has(field) ? errors[field] : undefined;
  const update = <K extends keyof Profile>(field: K, value: Profile[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const leave = (field: keyof Profile) => () => setTouched((prev) => new Set(prev).add(field));

  const save = () => {
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    onSave?.({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    });
  };

  return (
    <Flex direction="column" alignX="stretch">
      {/* The page header, from core parts: a pre-title naming the page, the record's name as the title, the
          actions on the right, and a full-width divider. */}
      <Flex alignX="space-between" alignY="start" gap={2} wrap style={{ padding }}>
        <Flex direction="column" gap={1}>
          <Text size="small" variant="description">
            Profile
          </Text>
          <Heading level={1}>{`${initial.firstName} ${initial.lastName}`.trim()}</Heading>
        </Flex>
        <Flex gap={3} alignY="center" style={{ flex: 'none' }}>
          <Button type="secondary" onPress={onCancel}>
            Cancel
          </Button>
          <Button type="primary" onPress={save}>
            Save
          </Button>
        </Flex>
      </Flex>
      <Divider />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Section padding={padding} width={columnWidth}>
          <TextInput
            label="First name"
            isRequired
            validationBehavior="aria"
            value={form.firstName}
            onChange={(v) => update('firstName', v)}
            onBlur={leave('firstName')}
            isInvalid={!!errorFor('firstName')}
            errorMessage={errorFor('firstName')}
          />
          <TextInput
            label="Last name"
            value={form.lastName}
            onChange={(v) => update('lastName', v)}
          />
          <Dropdown
            label="Role"
            isRequired
            validationBehavior="aria"
            value={form.role}
            onChange={(key) => {
              update('role', key ? String(key) : null);
              leave('role')();
            }}
            isInvalid={!!errorFor('role')}
            errorMessage={errorFor('role')}
          >
            {ROLES.map((r) => (
              <DropdownItem key={r} id={r}>
                {r}
              </DropdownItem>
            ))}
          </Dropdown>
          {/* Inside a ToggleGroup the group holds the selection, so it's controlled there: a Toggle's own
              isSelected is ignored. */}
          <ToggleGroup
            label="Activation"
            value={form.active ? ['active'] : []}
            onChange={(values) => update('active', values.includes('active'))}
          >
            <Toggle value="active">Active</Toggle>
          </ToggleGroup>
        </Section>

        <Divider />
        <Section title="Contact information" padding={padding} width={columnWidth}>
          <TextInput
            label="Email"
            type="email"
            isRequired
            validationBehavior="aria"
            value={form.email}
            onChange={(v) => update('email', v)}
            onBlur={leave('email')}
            isInvalid={!!errorFor('email')}
            errorMessage={errorFor('email')}
          />
        </Section>

        <Divider />
        <Section title="Employee information" padding={padding} width={columnWidth}>
          <ReadOnlyValue label="External ID" value={form.externalId ?? 'N/A'} />
        </Section>

        <Divider />
        <Section title="Additional information" padding={padding} width={columnWidth}>
          <Dropdown
            label="Team"
            value={form.team ?? NO_TEAM}
            onChange={(key) => update('team', key && key !== NO_TEAM ? String(key) : null)}
          >
            {[NO_TEAM, ...TEAMS].map((t) => (
              <DropdownItem key={t} id={t}>
                {t === NO_TEAM ? 'None' : t}
              </DropdownItem>
            ))}
          </Dropdown>
          {submitted && Object.keys(errors).length > 0 && (
            <Text role="alert" variant="description">
              Fix the highlighted fields to save.
            </Text>
          )}
        </Section>
        <Divider />
        <Section title="Scheduling and preferences" padding={padding} width={columnWidth}>
          <FormControlExamples
            value={form.controlExamples ?? SAMPLE_CONTROLS}
            onChange={(value) => update('controlExamples', value)}
          />
        </Section>
      </form>
    </Flex>
  );
}
