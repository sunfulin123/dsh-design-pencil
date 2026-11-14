import type { DropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { Dropdown, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
const OPTIONS = [
  { value: "red", label: "Red", swatch: "#E74C3C" },
  { value: "green", label: "Green", swatch: "#27AE60" },
  { value: "blue", label: "Blue", swatch: "#2980B9" },
  { value: "purple", label: "Purple", swatch: "#8E44AD" },
];
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>("green");
  const theme = useTheme();
  return (
    <Dropdown
      value={value}
      options={OPTIONS}
      onChange={setValue}
      renderOption={(option, { selected, onSelect }) => (
        <Box
          paddingX="3"
          paddingY="2"
          backgroundColor={selected ? theme.primarySurface : undefined}
          style={{ cursor: "pointer" }}
          onClick={onSelect}
        >
          <Flex alignY="center" gap="3">
            <Box
              width="16px"
              height="16px"
              backgroundColor={OPTIONS.find((item) => item.value === option.value)?.swatch}
              style={{ borderRadius: 4 }}
            />
            <Typography variant="body">{option.label}</Typography>
            {selected && (
              <Box style={{ marginLeft: "auto" }}>
                <Icon color={theme.primary600} name="check" size="tiny" />
              </Box>
            )}
          </Flex>
        </Box>
      )}
      data-qa="global-render-dropdown"
    />
  );
}
