import { useState } from "react";
import { Textarea, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [reason, setReason] = useState("");
  const [bio, setBio] = useState("Workforce planner based in Lisbon.");
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <FormField isRequired label="Reason for change" description="Visible to schedule reviewers.">
        <Textarea
          isFullWidth
          rows={3}
          value={reason}
          placeholder="Describe the schedule change…"
          onChange={(e) => setReason(e.target.value)}
        />
      </FormField>
      <FormField label="Short bio" maxInput={120} currentInput={bio.length}>
        <Textarea
          isFullWidth
          rows={4}
          maxLength={120}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </FormField>
    </Flex>
  );
}
