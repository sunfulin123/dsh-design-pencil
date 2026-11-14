import { Input, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <FormField label="Email" variation="error" errorHint="Enter a valid email address.">
        <Input isFullWidth value="not-an-email" variation="error" onChange={() => null} />
      </FormField>
      <FormField
        label="Display name"
        variation="warning"
        warningHint="Trailing whitespace will be trimmed on save."
      >
        <Input isFullWidth value="Jane " variation="warning" onChange={() => null} />
      </FormField>
    </Flex>
  );
}
