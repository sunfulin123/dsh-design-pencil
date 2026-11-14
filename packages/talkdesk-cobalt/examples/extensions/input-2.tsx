import { useState } from "react";
import { Input, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("Workforce planner based in Lisbon.");
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <FormField isRequired label="Full name" description="Shown to other team members.">
        <Input
          isFullWidth
          value={name}
          placeholder="Jane Doe"
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>
      <FormField label="Short bio" maxInput={60} currentInput={bio.length}>
        <Input isFullWidth maxLength={60} value={bio} onChange={(e) => setBio(e.target.value)} />
      </FormField>
    </Flex>
  );
}
