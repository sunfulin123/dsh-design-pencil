import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="6">
      <Box style={{ width: "320px", border: "1px dashed #ccc", padding: 8 }}>
        <PopupTrigger
          fullWidth
          content={<Typography variant="body">Panel aligns to the full trigger width.</Typography>}
        >
          <Button type="secondary" style={{ width: "100%" }}>
            Full-width trigger
          </Button>
        </PopupTrigger>
      </Box>
    </Flex>
  );
}
