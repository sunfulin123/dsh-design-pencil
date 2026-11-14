import { FormField } from "../../components/extensions/src";
import Input from "@talkdesk/cobalt-react-input";
import Flex from "@talkdesk/cobalt-react-flex";

export default function Demo() {
  return (
    <Flex direction="column" gap="6" padding="4" width="320px">
      <FormField
        htmlFor="salary"
        label="Monthly Salary"
        prefix="$"
        description="Enter gross monthly salary in USD"
      >
        <Input
          id="salary"
          placeholder="5000"
          size="medium"
          type="number"
          variation="unstyled"
          style={{ width: "100%", padding: "0 8px" }}
        />
      </FormField>

      <FormField htmlFor="website" label="Website" suffix=".com" description="Enter your subdomain">
        <Input
          id="website"
          placeholder="my-company"
          size="medium"
          variation="unstyled"
          style={{ width: "100%", padding: "0 8px" }}
        />
      </FormField>
    </Flex>
  );
}
