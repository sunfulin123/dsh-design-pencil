import { Card, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Box style={{ background: "rgba(0,0,0,0.04)" }} padding="2">
      <Card marginY="3" marginX="6">
        <Typography variant="body">marginY=&quot;3&quot; / marginX=&quot;6&quot;</Typography>
      </Card>
    </Box>
  );
}
