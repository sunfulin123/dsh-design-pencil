import type { MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { MultiDropdown } from "../../components/extensions/src";
import { Tag } from "@talkdesk/cobalt-react-tag";
const OPTIONS = [
  {
    value: "admin",
    label: "Administrator",
    description: "Full access to all settings",
    right: <Tag color="light-purple">Owner</Tag>,
  },
  {
    value: "agent",
    label: "Agent",
    description: "Handle calls and chats",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access",
    disabled: true,
  },
];
export default function Demo() {
  const [value, setValue] = useState<MultiDropdownOptionValue[]>(["agent"]);
  return (
    <MultiDropdown
      value={value}
      options={OPTIONS}
      onChange={setValue}
      data-qa="metadata-multi-dropdown"
    />
  );
}
