import { useState } from "react";
import { Choice } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [accepted, setAccepted] = useState(false);
  return (
    <Flex direction="column" gap="2">
      <Choice
        checked={accepted}
        label="I accept the terms and conditions"
        variation={accepted ? undefined : "error"}
        onChange={setAccepted}
      />
      <Choice checked label="Apply to past schedules" variation="warning" />
    </Flex>
  );
}
