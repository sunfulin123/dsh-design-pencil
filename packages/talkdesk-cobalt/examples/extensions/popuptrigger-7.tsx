import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex padding="6" gap="4" alignX="center">
      <PopupTrigger
        contentPadding="2"
        width="180px"
        content={<Typography variant="caption">Compact padding (2 = 8px)</Typography>}
      >
        <Button type="secondary">padding 2</Button>
      </PopupTrigger>

      <PopupTrigger
        contentPadding="4"
        width="180px"
        content={<Typography variant="caption">Default padding (4 = 16px)</Typography>}
      >
        <Button type="secondary">padding 4</Button>
      </PopupTrigger>

      <PopupTrigger
        contentPadding="0"
        width="180px"
        content={
          <Box
            padding="3"
            style={{
              background: "var(--co-color-background-info-subtle, #e8f4fd)",
            }}
          >
            <Typography variant="caption">No padding — content fills edge to edge</Typography>
          </Box>
        }
      >
        <Button type="secondary">padding 0</Button>
      </PopupTrigger>
    </Flex>
  );
}
