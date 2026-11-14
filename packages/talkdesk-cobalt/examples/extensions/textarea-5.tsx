import { Textarea, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <FormField
        label="Reason for change"
        variation="error"
        errorHint="Reason is required before submitting."
      >
        <Textarea isFullWidth rows={3} value="" variation="error" onChange={() => null} />
      </FormField>
      <FormField
        label="Notes"
        variation="warning"
        warningHint="Notes will be visible to all reviewers."
      >
        <Textarea
          isFullWidth
          rows={3}
          value="Holiday rota draft."
          variation="warning"
          onChange={() => null}
        />
      </FormField>
    </Flex>
  );
}
