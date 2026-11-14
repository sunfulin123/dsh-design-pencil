import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex alignY="center" gap="2">
      <Typography variant="body" inline>
        Status:
      </Typography>
      <Typography variant="body-emphasis" tone="success" inline>
        Active
      </Typography>
    </Flex>
  );
}
