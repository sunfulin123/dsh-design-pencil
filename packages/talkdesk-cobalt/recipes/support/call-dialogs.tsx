/** Local call-control workflows; production telephony belongs to the embedding app. */
import React, { useEffect, useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import { Text } from '@talkdesk/cobalt-react-typography';
import {
  Dialog,
  FormField,
  Input,
  DatePicker,
  TimeSelectInput,
  Textarea,
} from '../../components/extensions/src';
export type CallDialog =
  | 'callback'
  | 'keypad'
  | 'consult'
  | 'transfer'
  | 'guest'
  | 'new'
  | 'end'
  | null;
export interface Callback {
  date: string;
  time: string;
  note: string;
}
const TITLES = {
  callback: 'Add callback',
  keypad: 'Keypad',
  consult: 'Consult a teammate',
  transfer: 'Blind transfer',
  guest: 'Add guest',
  new: 'New conversation',
  end: 'End call',
};
export function CallDialogs({
  dialog,
  onClose,
  onCallback,
  onComplete,
}: {
  dialog: CallDialog;
  onClose: () => void;
  onCallback: (value: Callback) => void;
  onComplete: (action: string, value: string) => void;
}) {
  const [value, setValue] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState(540);
  const [note, setNote] = useState('');
  useEffect(() => {
    setValue('');
    setDate(undefined);
    setTime(540);
    setNote('');
  }, [dialog]);
  if (!dialog) return null;
  const callback = dialog === 'callback';
  const keypad = dialog === 'keypad';
  const end = dialog === 'end';
  const confirm = () => {
    if (callback)
      onCallback({
        date: date!.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`,
        note,
      });
    else if (!keypad) onComplete(dialog, value.trim());
    onClose();
  };
  return (
    <Dialog
      visible
      onClose={onClose}
      onConfirm={confirm}
      title={TITLES[dialog]}
      size="small"
      confirmButtonType={end ? 'danger' : 'primary'}
      isConfirmDisabled={
        callback
          ? !date || !Number.isInteger(time) || time < 0 || time > 1439
          : !end && !keypad && !value.trim()
      }
      messages={{
        confirmLabel: callback
          ? 'Schedule callback'
          : keypad
            ? 'Done'
            : end
              ? 'End call'
              : 'Confirm',
      }}
    >
      <div className="call-dialog-fields">
        {callback ? (
          <>
            <Text size="small">Schedule a callback with Carly Yates at +1 814 458 3728.</Text>
            <DatePicker
              label="Date"
              isRequired
              value={date}
              onChange={setDate}
              isFullWidth
              data-qa="callback-date"
            />
            <FormField label="Time" isRequired htmlFor="callback-time">
              <TimeSelectInput
                id="callback-time"
                format24H
                value={time}
                onChange={setTime}
                data-qa="callback-time"
              />
            </FormField>
            <FormField label="Note" htmlFor="callback-note">
              <Textarea id="callback-note" isFullWidth rows={3} value={note} onChange={event=>setNote(event.target.value)} placeholder="Reason for callback" data-qa="callback-note" />
            </FormField>
          </>
        ) : keypad ? (
          <>
            <FormField label="Dialed digits" htmlFor="call-digits">
              <Input
                id="call-digits"
                value={value}
                isFullWidth
                onChange={(event) => setValue(event.target.value.replace(/[^0-9*#]/g, ''))}
              />
            </FormField>
            <div className="call-keypad">
              {'123456789*0#'.split('').map((digit) => (
                <Button
                  key={digit}
                  variation="outline"
                  aria-label={`Dial ${digit}`}
                  onPress={() => setValue((current) => current + digit)}
                >
                  {digit}
                </Button>
              ))}
            </div>
            <Button
              variation="transparent"
              size="small"
              prefix={<Icon name="backspace" size="small" />}
              onPress={() => setValue((current) => current.slice(0, -1))}
            >
              Delete digit
            </Button>
            <Text size="small" style={{ fontSize: 12 }}>
              Prototype keypad only; no DTMF tones are transmitted.
            </Text>
          </>
        ) : end ? (
          <Text>End the current call with Carly Yates?</Text>
        ) : (
          <>
            <FormField
              label={dialog === 'consult' ? 'Teammate or number' : 'Name or phone number'}
              isRequired
              htmlFor="call-target"
            >
              <Input
                id="call-target"
                isFullWidth
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Search or enter a number"
              />
            </FormField>
            <Text size="small">
              This is a local prototype action. No call is placed or transferred.
            </Text>
          </>
        )}
      </div>
    </Dialog>
  );
}
