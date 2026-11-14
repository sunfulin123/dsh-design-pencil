import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Box width="320px">
        <Typography variant="body" textAlign="left">
          Left-aligned body text
        </Typography>
      </Box>
      <Box width="320px">
        <Typography variant="body" textAlign="center">
          Center-aligned body text
        </Typography>
      </Box>
      <Box width="320px">
        <Typography variant="body" textAlign="right">
          Right-aligned body text
        </Typography>
      </Box>
    </Flex>
  );
}
