/** Controlled Extensions examples; FormPage's Save callback receives these values. */
import React, { useId } from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import {
  DatePicker,
  DateRangePicker,
  TimeSelectInput,
  Choice,
  MultiDropdown,
  FormField,
  type DateRange,
} from '../../components/extensions/src';
export interface FormControlValues {
  startDate?: Date;
  startTime: number;
  availability: DateRange;
  emailNotifications: boolean;
  smsNotifications: boolean;
  channel: 'voice' | 'email';
  skills: string[];
}
export const SAMPLE_CONTROLS: FormControlValues = {
  startDate: new Date(2026, 10, 15),
  startTime: 540,
  availability: { startDate: new Date(2026, 10, 15), endDate: new Date(2026, 10, 21) },
  emailNotifications: true,
  smsNotifications: false,
  channel: 'voice',
  skills: ['support'],
};
export function FormControlExamples({
  value,
  onChange,
}: {
  value: FormControlValues;
  onChange: (value: FormControlValues) => void;
}) {
  const id = useId();
  const update = <K extends keyof FormControlValues>(key: K, next: FormControlValues[K]) =>
    onChange({ ...value, [key]: next });
  return (
    <Flex direction="column" alignX="stretch" gap={4} data-testid="form-control-examples">
      <DatePicker
        label="Start date"
        value={value.startDate}
        onChange={(date) => update('startDate', date)}
        isFullWidth
        data-qa="form-start-date"
      />
      <FormField
        label="Start time"
        htmlFor={`${id}-time`}
        description="24-hour format. Values are minutes from midnight."
      >
        <TimeSelectInput
          id={`${id}-time`}
          format24H
          value={value.startTime}
          onChange={(time) => update('startTime', time)}
          data-qa="form-start-time"
        />
      </FormField>
      <DateRangePicker
        label="Availability range"
        selectedRange={value.availability}
        onRangeChange={(range) => update('availability', range)}
        isFullWidth
        data-qa="form-availability"
      />
      <FormField label="Notifications">
        <Flex direction="column" gap={2} role="group" aria-label="Notifications">
          <Choice
            label="Email notifications"
            checked={value.emailNotifications}
            onChange={(checked) => update('emailNotifications', checked)}
            data-qa="form-email-notifications"
          />
          <Choice
            label="SMS notifications"
            checked={value.smsNotifications}
            onChange={(checked) => update('smsNotifications', checked)}
            data-qa="form-sms-notifications"
          />
        </Flex>
      </FormField>
      <FormField label="Preferred contact channel">
        <Flex direction="column" gap={2} role="radiogroup" aria-label="Preferred contact channel">
          <Choice
            type="radio"
            name={`${id}-channel`}
            value="voice"
            label="Voice"
            checked={value.channel === 'voice'}
            onChange={(checked) => {
              if (checked) update('channel', 'voice');
            }}
          />
          <Choice
            type="radio"
            name={`${id}-channel`}
            value="email"
            label="Email"
            checked={value.channel === 'email'}
            onChange={(checked) => {
              if (checked) update('channel', 'email');
            }}
          />
        </Flex>
      </FormField>
      <FormField label={<span id={`${id}-skills`}>Skills</span>}>
        <MultiDropdown
          aria-labelledby={`${id}-skills`}
          value={value.skills}
          onChange={(skills) => update('skills', skills.map(String))}
          options={[
            { value: 'support', label: 'Support' },
            { value: 'billing', label: 'Billing' },
            { value: 'sales', label: 'Sales' },
          ]}
          searchable
          renderSelectAll
          dismissValues
          maxVisibleValues={2}
          inputSize="medium"
          height={40}
          messages={{ placeholder: 'Select skills', searchPlaceholder: 'Search skills' }}
          data-qa="form-skills"
        />
      </FormField>
    </Flex>
  );
}
