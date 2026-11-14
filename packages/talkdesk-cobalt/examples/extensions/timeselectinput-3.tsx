import { TimeSelectInput, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="6" width="240px">
      <FormField label="Fully disabled">
        <TimeSelectInput isDisabled value={600} onChange={() => {}} />
      </FormField>
      <FormField label="Minutes disabled">
        <TimeSelectInput isMinutesDisabled value={720} onChange={() => {}} />
      </FormField>
    </Flex>
  );
}
