import { FormField } from "../../components/extensions/src";
import Input from "@talkdesk/cobalt-react-input";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="6" padding="4" width="320px">
      <FormField
        isRequired
        htmlFor="email-error"
        label="Email Address"
        variation="error"
        description="We will send your confirmation here"
        errorHint="Please enter a valid email address"
      >
        <Input
          id="email-error"
          value="not-an-email"
          size="medium"
          style={{ width: "100%", padding: "0 8px" }}
          onChange={() => {}}
        />
      </FormField>

      <FormField
        htmlFor="password-warning"
        label="Password"
        variation="warning"
        warningHint="Password is weak — consider adding numbers and symbols"
      >
        <Input
          id="password-warning"
          type="password"
          value="abc123"
          size="medium"
          style={{ width: "100%", padding: "0 8px" }}
          onChange={() => {}}
        />
      </FormField>
    </Flex>
  );
}
