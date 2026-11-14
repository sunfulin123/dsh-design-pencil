import { useState } from "react";
import { FormField } from "../../components/extensions/src";
import Input from "@talkdesk/cobalt-react-input";
import Flex from "@talkdesk/cobalt-react-flex";
const MAX = 50;
export default function Demo() {
  const [value, setValue] = useState("Hello, World!");
  const isOver = value.length > MAX;
  return (
    <Flex direction="column" gap="6" padding="4" width="360px">
      <FormField
        htmlFor="short-desc"
        label="Short Description"
        currentInput={value.length}
        maxInput={MAX}
        variation={isOver ? "error" : undefined}
        description="Keep it brief"
        errorHint={isOver ? `Exceeds ${MAX} characters` : undefined}
      >
        <Input
          id="short-desc"
          value={value}
          size="medium"
          style={{ width: "100%", padding: "0 8px" }}
          onChange={(e) => setValue(e.target.value)}
        />
      </FormField>
    </Flex>
  );
}
