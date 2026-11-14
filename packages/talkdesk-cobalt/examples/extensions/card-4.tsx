import { Card, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex gap="3">
      <Card width="240px">
        <Typography variant="body">width=&quot;240px&quot;</Typography>
      </Card>
      <Card width="50%" height="80px">
        <Typography variant="body">width=&quot;50%&quot; / height=&quot;80px&quot;</Typography>
      </Card>
    </Flex>
  );
}
