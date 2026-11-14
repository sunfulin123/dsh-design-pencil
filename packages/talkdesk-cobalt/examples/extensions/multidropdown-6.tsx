import type { MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { MultiDropdown, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";

import Input from "@talkdesk/cobalt-react-input";
import Label from "@talkdesk/cobalt-react-label";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
const OPTIONS = [
  { value: "red", label: "Red", swatch: "#E74C3C" },
  { value: "green", label: "Green", swatch: "#27AE60" },
  { value: "blue", label: "Blue", swatch: "#2980B9" },
  { value: "purple", label: "Purple", swatch: "#8E44AD" },
];
export default function Demo() {
  const [value, setValue] = useState<MultiDropdownOptionValue[]>(["green", "blue"]);
  const theme = useTheme();
  return (
    <MultiDropdown
      value={value}
      options={OPTIONS}
      onChange={setValue}
      renderOption={(option, { selected, onToggle }) => (
        <Box
          paddingX="3"
          paddingY="2"
          backgroundColor={selected ? theme.primarySurface : undefined}
          style={{ cursor: "pointer" }}
          onClick={onToggle}
        >
          <Label htmlFor={`swatch-${option.value}`} style={{ display: "block" }}>
            <Flex alignY="center" gap="3">
              <Input
                checked={selected}
                id={`swatch-${option.value}`}
                size="small"
                type="checkbox"
                onChange={onToggle}
              />
              <Box
                width="16px"
                height="16px"
                backgroundColor={OPTIONS.find((item) => item.value === option.value)?.swatch}
                style={{ borderRadius: 4 }}
              />
              <Typography variant="body">{option.label}</Typography>
            </Flex>
          </Label>
        </Box>
      )}
      data-qa="global-render-multi-dropdown"
    />
  );
}
