import { ToolbarWrapper, Typography } from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const theme = useTheme();
  return (
    <Box style={{ border: `1px solid ${theme.basic300}`, borderRadius: 4 }}>
      <Box padding="3">
        <Typography variant="caption" color={theme.basic600}>
          Content above toolbar
        </Typography>
      </Box>
      <ToolbarWrapper
        isTopBordered
        start={
          <Typography variant="body-emphasis" color={theme.textDefault}>
            Toolbar with top border
          </Typography>
        }
      />
    </Box>
  );
}
