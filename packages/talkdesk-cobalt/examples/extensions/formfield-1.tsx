import type { DropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import {
  Button,
  Choice,
  DatePicker,
  Dropdown,
  FormField,
  Input,
  TimeSelectInput,
  Textarea,
} from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";
const zoneOptions = [
  { label: "Asia / Shanghai", value: "asia-shanghai" },
  { label: "Europe / Lisbon", value: "europe-lisbon" },
  { label: "America / New York", value: "america-ny" },
];
const activityTypes = [
  { label: "Online activities", value: "online" },
  { label: "Promotion activities", value: "promotion" },
  { label: "Offline activities", value: "offline" },
  { label: "Simple brand exposure", value: "brand" },
];
export default function Demo() {
  const [name, setName] = useState("");
  const [zone, setZone] = useState<DropdownOptionValue | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<number | undefined>(undefined);
  const [instant, setInstant] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [resource, setResource] = useState("sponsor");
  const [form, setForm] = useState("");
  const toggleType = (value: string) => {
    setTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };
  return (
    <Box padding="4" width="640px">
      <Flex direction="column" gap="4">
        <FormField isRequired htmlFor="activity-name" label="Activity name">
          <Input
            id="activity-name"
            value={name}
            placeholder="Enter activity name"
            onChange={(e) => setName(e.target.value)}
            data-qa="activity-name"
          />
        </FormField>

        <FormField isRequired label="Activity zone">
          <Dropdown
            value={zone}
            options={zoneOptions}
            onChange={(v) => setZone(v)}
            messages={{ placeholder: "Please select your zone" }}
            data-qa="activity-zone"
          />
        </FormField>

        <FormField isRequired label="Activity time">
          <Flex alignY="center" gap="2" width="100%">
            <Box grow>
              <DatePicker
                isFullWidth
                size="medium"
                value={date}
                onChange={setDate}
                placeholder="Pick a date"
                data-qa="activity-date"
              />
            </Box>
            <Box>—</Box>
            <Box grow>
              <TimeSelectInput
                value={time}
                size="medium"
                onChange={setTime}
                data-qa="activity-time"
              />
            </Box>
          </Flex>
        </FormField>

        <FormField label="Instant delivery">
          <Choice
            checked={instant}
            onChange={setInstant}
            label="Deliver immediately after creation"
            data-qa="instant-delivery"
          />
        </FormField>

        <FormField label="Activity type">
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: 8,
              columnGap: 24,
            }}
          >
            {activityTypes.map((opt) => (
              <Choice
                key={opt.value}
                checked={types.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
                label={opt.label}
                data-qa={`activity-type-${opt.value}`}
              />
            ))}
          </Box>
        </FormField>

        <FormField label="Resources">
          <Flex gap="6">
            {["sponsor", "venue"].map((value) => (
              <Choice
                key={value}
                type="radio"
                name="activity-resource"
                value={value}
                checked={resource === value}
                onChange={() => setResource(value)}
                label={value === "sponsor" ? "Sponsor" : "Venue"}
                data-qa={`resource-${value}`}
              />
            ))}
          </Flex>
        </FormField>

        <FormField label="Activity form" currentInput={form.length} maxInput={200}>
          <Textarea
            value={form}
            placeholder="Describe the activity"
            rows={4}
            maxLength={200}
            onChange={(e) => setForm(e.target.value)}
            data-qa="activity-form"
          />
        </FormField>

        <Flex gap="2">
          <Button data-qa="create" type="primary" onClick={() => null}>
            Create
          </Button>
          <Button data-qa="cancel" type="secondary" onClick={() => null}>
            Cancel
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
