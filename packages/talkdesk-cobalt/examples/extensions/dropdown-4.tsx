import type { DropdownOptionValue, DropdownOption } from "../../components/extensions/src";
import { useState } from "react";
import { Dropdown, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import { Tag } from "@talkdesk/cobalt-react-tag";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>(null);
  const theme = useTheme();
  const options: DropdownOption[] = [
    { value: "sales", label: "Sales" },
    { value: "support", label: "Support" },
    {
      value: "__create__",
      label: "Create new tag",
      render: ({ onSelect }) => (
        <Box paddingX="3" paddingY="2" style={{ cursor: "pointer" }} onClick={onSelect}>
          <Flex alignY="center" gap="2">
            <Icon color={theme.primary600} name="add" size="tiny" />
            <Typography variant="body" color={theme.primary600}>
              Create new tag
            </Typography>
            <Tag color="light-purple" size="small">
              New
            </Tag>
          </Flex>
        </Box>
      ),
    },
  ];
  return (
    <Dropdown
      value={value}
      options={options}
      onChange={setValue}
      data-qa="custom-option-dropdown"
    />
  );
}
