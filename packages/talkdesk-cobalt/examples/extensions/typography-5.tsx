import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Typography variant="body" weight="light">
        Body — light weight
      </Typography>
      <Typography variant="body" weight="regular">
        Body — regular weight (default)
      </Typography>
      <Typography variant="body" weight="medium">
        Body — medium weight
      </Typography>
    </Flex>
  );
}
