import type { DropdownOptionValue, MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import {
  Choice,
  DatePicker,
  Dropdown,
  FormField,
  MultiDropdown,
  SidePanel,
} from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import Input from "@talkdesk/cobalt-react-input";
const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const tagOptions = [
  { label: "Onboarding", value: "onboarding" },
  { label: "Coaching", value: "coaching" },
  { label: "Compliance", value: "compliance" },
  { label: "Quality", value: "quality" },
];
export default function Demo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("Weekly review");
  const [priority, setPriority] = useState<DropdownOptionValue | null>("medium");
  const [tags, setTags] = useState<MultiDropdownOptionValue[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [recurring, setRecurring] = useState(false);
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 2000);
  };
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Edit schedule
      </Button>
      <SidePanel
        actions={[
          {
            label: "Cancel",
            type: "secondary",
            disabled: loading,
            onClick: () => setOpen(false),
            "data-qa": "cancel",
          },
          {
            label: "Save",
            type: "primary",
            disabled: loading || !title,
            state: loading ? "inline-loading" : undefined,
            onClick: handleSave,
            "data-qa": "save",
          },
        ]}
        title="Edit schedule"
        visible={open}
        onClose={() => setOpen(false)}
        data-qa="loading-side-panel"
      >
        {/* Force every FormField inside this panel to fill the body width.
            Scoped to [data-component="WFMFormField"] so Choice (a bare Flex
            sibling of the FormFields) is not affected and its checkbox
            stays its natural size. */}
        <style>{`
          [data-qa="loading-side-panel"] [data-component="WFMFormField"],
          [data-qa="loading-side-panel"] [data-component="WFMFormField"] input,
          [data-qa="loading-side-panel"] [data-component="WFMFormField"] [class*="Dropdown"],
          [data-qa="loading-side-panel"] [data-component="WFMFormField"] [class*="dropdown"] { width: 100%; }
        `}</style>
        <Flex direction="column" gap="4" width="100%">
          <FormField
            label="Title"
            htmlFor="schedule-title"
            isRequired
            variation={!title ? "error" : undefined}
            errorHint={!title ? "Title is required." : undefined}
          >
            <Input
              id="schedule-title"
              value={title}
              placeholder="e.g. Weekly 1:1"
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              style={{ width: "100%" }}
              data-qa="schedule-title-input"
            />
          </FormField>

          <FormField label="Priority" isRequired>
            <Dropdown
              value={priority}
              options={priorityOptions}
              onChange={(v) => setPriority(v)}
              disabled={loading}
              messages={{ placeholder: "Select priority" }}
              data-qa="priority-dropdown"
            />
          </FormField>

          <FormField label="Tags" description="Help your team filter and find this schedule later.">
            <MultiDropdown
              options={tagOptions}
              value={tags}
              onChange={(values) => setTags(values)}
              searchable
              disabled={loading}
              messages={{ placeholder: "Select tags" }}
              data-qa="tags-multi-dropdown"
            />
          </FormField>

          <FormField label="Scheduled date">
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Pick a date"
              isFullWidth
              data-qa="schedule-date"
            />
          </FormField>

          <Choice
            checked={recurring}
            onChange={(checked) => setRecurring(checked)}
            label="Repeat weekly"
            disabled={loading}
            data-qa="recurring-choice"
          />
        </Flex>
      </SidePanel>
    </>
  );
}
