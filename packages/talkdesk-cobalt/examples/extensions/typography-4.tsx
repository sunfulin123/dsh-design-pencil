import Flex from "@talkdesk/cobalt-react-flex";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  const theme = useTheme();
  return (
    <Flex direction="column" gap="2">
      <Typography color={theme.basic800}>Custom color via theme.basic800</Typography>
      <Typography color={theme.primary9}>Custom color via theme.primary9</Typography>
    </Flex>
  );
}
