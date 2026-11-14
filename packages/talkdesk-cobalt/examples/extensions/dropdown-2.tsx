import type { DropdownOptionValue, DropdownOption } from "../../components/extensions/src";
import { useState } from "react";
import { Dropdown } from "../../components/extensions/src";
import { Tag } from "@talkdesk/cobalt-react-tag";
const OPTIONS: DropdownOption[] = [
  {
    value: "admin",
    label: "Administrator",
    icon: "shield",
    description: "Full access to all settings",
    right: <Tag color="light-purple">Owner</Tag>,
  },
  {
    value: "agent",
    label: "Agent",
    icon: "person",
    description: "Handle calls and chats",
  },
  {
    value: "viewer",
    label: "Viewer",
    icon: "visibility",
    description: "Read-only access",
    disabled: true,
  },
];
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>("agent");
  return (
    <Dropdown value={value} options={OPTIONS} onChange={setValue} data-qa="metadata-dropdown" />
  );
}
