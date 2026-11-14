import { Card, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Card data-qa="basic-card">
      <Typography variant="card-title" asLevel={4}>
        Adherence notification
      </Typography>
      <Box paddingTop="2">
        <Typography variant="body">
          Sends adherence notifications to the agent and their team manager.
        </Typography>
      </Box>
    </Card>
  );
}
