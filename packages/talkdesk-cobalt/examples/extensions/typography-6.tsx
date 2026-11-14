import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Typography font="sans">Sans (default) — Roboto regular text</Typography>
      <Typography font="mono">Mono — req_8a3f9c12-4d5e-2026-04-28T14:30:00Z</Typography>
    </Flex>
  );
}
