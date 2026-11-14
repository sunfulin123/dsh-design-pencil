import { ToolbarWrapper, Typography } from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const theme = useTheme();
  return (
    <Flex direction="column" gap="4">
      <ToolbarWrapper
        paddingX={2}
        paddingY={1}
        start={
          <Typography variant="caption" color={theme.textDefault}>
            Compact padding (paddingX=2, paddingY=1)
          </Typography>
        }
      />
      <ToolbarWrapper
        paddingX={8}
        paddingY={4}
        start={
          <Typography variant="body-emphasis" color={theme.textDefault}>
            Generous padding (paddingX=8, paddingY=4)
          </Typography>
        }
      />
    </Flex>
  );
}
