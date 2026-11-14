import Box from "@talkdesk/cobalt-react-box";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Box width="240px">
      <Typography variant="card-title" truncated>
        A very long card title that will not fit inside this fixed-width container
      </Typography>
    </Box>
  );
}
