import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Typography variant="card-title" loading>
        Loaded card title
      </Typography>
      <Typography variant="body" loading>
        Single body line
      </Typography>
      <Typography variant="body" loading={3}>
        Three body lines
      </Typography>
    </Flex>
  );
}
