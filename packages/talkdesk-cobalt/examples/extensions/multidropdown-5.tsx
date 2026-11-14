import type { MultiDropdownOptionValue, MultiDropdownOption } from "../../components/extensions/src";
import { useState } from "react";
import { MultiDropdown, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import { Tag } from "@talkdesk/cobalt-react-tag";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
export default function Demo() {
  const [value, setValue] = useState<MultiDropdownOptionValue[]>([]);
  const theme = useTheme();
  const options: MultiDropdownOption[] = [
    { value: "sales", label: "Sales" },
    { value: "support", label: "Support" },
    { value: "billing", label: "Billing" },
    {
      value: "__create__",
      label: "Create new tag",
      render: ({ onToggle }) => (
        <Box paddingX="3" paddingY="2" style={{ cursor: "pointer" }} onClick={onToggle}>
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
    <MultiDropdown
      value={value}
      options={options}
      onChange={setValue}
      data-qa="custom-option-multi-dropdown"
    />
  );
}
