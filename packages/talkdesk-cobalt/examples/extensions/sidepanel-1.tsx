import type { DropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import {
  Choice,
  Dropdown,
  FormField,
  InteractiveMessage,
  SidePanel,
  Typography,
  UploadFile,
} from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
const fileFormatOptions = [
  { label: "Standard CSV", value: "csv" },
  { label: "Zendesk", value: "zendesk" },
];
const dateFormatOptions = [
  { label: "MM/dd/yyyy", value: "MM/dd/yyyy" },
  { label: "dd/MM/yyyy", value: "dd/MM/yyyy" },
  { label: "yyyy-MM-dd", value: "yyyy-MM-dd" },
];
const intervalOptions = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "60 min", value: "60" },
];
const timezoneOptions = [
  { label: "(UTC+00:00) Lisbon", value: "Europe/Lisbon" },
  { label: "(UTC+01:00) Madrid", value: "Europe/Madrid" },
  { label: "(UTC-05:00) New York", value: "America/New_York" },
  { label: "(UTC-08:00) Los Angeles", value: "America/Los_Angeles" },
];
export default function Demo() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<DropdownOptionValue | null>("csv");
  const [timezone, setTimezone] = useState<DropdownOptionValue | null>(null);
  const [dateFormat, setDateFormat] = useState<DropdownOptionValue | null>("MM/dd/yyyy");
  const [interval, setInterval] = useState<DropdownOptionValue | null>("15");
  const [updateForecast, setUpdateForecast] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Import historical data
      </Button>
      <SidePanel
        actions={[
          {
            label: "Cancel",
            type: "secondary",
            onClick: handleClose,
            "data-qa": "cancel",
          },
          {
            label: "Import",
            type: "primary",
            disabled: !file || !timezone,
            onClick: handleClose,
            "data-qa": "submit",
          },
        ]}
        title="Import historical data"
        visible={open}
        onClose={handleClose}
        data-qa="import-side-panel"
      >
        {/* Force every FormField inside this panel to fill the body width.
            Exclude checkbox/radio inputs so Choice labels keep their natural width. */}
        <style>{`
          [data-qa="import-side-panel"] [data-component="WFMFormField"],
          [data-qa="import-side-panel"] [data-component="WFMFormField"] input:not([type="checkbox"]):not([type="radio"]),
          [data-qa="import-side-panel"] [data-component="WFMFormField"] [class*="Dropdown"],
          [data-qa="import-side-panel"] [data-component="WFMFormField"] [class*="dropdown"] { width: 100%; }
        `}</style>
        <Flex direction="column" gap="4" width="100%">
          <Typography variant="body" tone="subdued">
            Choose the relevant file with your historical data to upload.
          </Typography>

          <FormField label="File upload" isRequired>
            <UploadFile
              file={file}
              accept=".csv"
              maxSizeBytes={10 * 1024 * 1024}
              description="Only .csv files up to 10MB are supported"
              templateUrl="#"
              onFileChange={setFile}
              data-qa="history-file-upload"
            />
          </FormField>

          <InteractiveMessage variation="info">
            Accept historical data within 3 years of today only.
          </InteractiveMessage>

          <FormField label="File format">
            <Flex gap="6">
              {fileFormatOptions.map((opt) => (
                <Choice
                  key={opt.value}
                  type="radio"
                  name="file-format"
                  value={opt.value}
                  checked={fileFormat === opt.value}
                  onChange={() => setFileFormat(opt.value)}
                  label={opt.label}
                  data-qa={`file-format-${opt.value}`}
                />
              ))}
            </Flex>
          </FormField>

          <FormField label="Timezone" isRequired>
            <Dropdown
              value={timezone}
              options={timezoneOptions}
              onChange={(v) => setTimezone(v)}
              messages={{ placeholder: "Select timezone" }}
              data-qa="timezone-dropdown"
            />
          </FormField>

          <FormField
            label="File date format"
            isRequired
            description="Time format supported: HH:mm:ss"
          >
            <Dropdown
              value={dateFormat}
              options={dateFormatOptions}
              onChange={(v) => setDateFormat(v)}
              data-qa="date-format-dropdown"
            />
          </FormField>

          <FormField label="Interval granularity" isRequired>
            <Dropdown
              value={interval}
              options={intervalOptions}
              onChange={(v) => setInterval(v)}
              data-qa="interval-dropdown"
            />
          </FormField>

          <FormField
            label="Forecast and schedules update"
            isRequired
            description="If selected, the application will run calculations immediately after importing the history file."
          >
            <Choice
              checked={updateForecast}
              onChange={(checked) => setUpdateForecast(checked)}
              label="Update forecast and schedules after import"
              data-qa="update-forecast-choice"
            />
          </FormField>
        </Flex>
      </SidePanel>
    </>
  );
}
