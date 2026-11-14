import { TimezoneDropdown, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex gap="6" padding="6" wrap>
      <Flex width="300px">
        <FormField label="Timezone">
          <TimezoneDropdown data-qa="tz-enabled" value="America/New_York" onChange={() => {}} />
        </FormField>
      </Flex>
      <Flex width="300px">
        <FormField label="Timezone" description="Locked by tenant policy.">
          <TimezoneDropdown
            disabled
            data-qa="tz-disabled"
            value="America/New_York"
            onChange={() => {}}
          />
        </FormField>
      </Flex>
    </Flex>
  );
}
