import { ToolbarWrapper, Typography } from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
export default function Demo() {
  const theme = useTheme();
  return (
    <ToolbarWrapper
      isBottomBordered={false}
      start={
        <Typography variant="body-emphasis" color={theme.textDefault}>
          Borderless toolbar
        </Typography>
      }
    />
  );
}
