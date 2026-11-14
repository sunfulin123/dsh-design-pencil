import { Badge, Collapse, Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Collapse defaultOpen title="Notifications" extra={<Badge status="info">3 new</Badge>}>
      <Typography variant="body">New messages from your team will appear here.</Typography>
    </Collapse>
  );
}
