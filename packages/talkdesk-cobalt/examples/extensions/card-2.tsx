import { Card, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Card padding="2">
        <Typography variant="body">padding=&quot;2&quot; → 8px</Typography>
      </Card>
      <Card padding="6">
        <Typography variant="body">padding=&quot;6&quot; → 24px</Typography>
      </Card>
      <Card paddingX="8" paddingY="3">
        <Typography variant="body">paddingX=&quot;8&quot; / paddingY=&quot;3&quot;</Typography>
      </Card>
      <Card padding="0">
        <Typography variant="body">
          padding=&quot;0&quot; — for cards with their own internal headers
        </Typography>
      </Card>
    </Flex>
  );
}
