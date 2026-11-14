import {
  AppPage,
  AppPageHeader,
  AppPageMain,
  AppPageAside,
  AppPageContent,
} from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import { Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
function Shell({ isBordered, label }: { isBordered: boolean; label: string }) {
  const theme = useTheme();
  return (
    <Box
      height={200}
      backgroundColor={isBordered ? theme.white : theme.basic100}
      style={{
        border: `1px solid ${theme.basic300}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <AppPage>
        <AppPageHeader isBordered={isBordered} paddingX={6} paddingY={3}>
          <Typography variant="body-emphasis" color={theme.textDefault}>
            {label}
          </Typography>
        </AppPageHeader>
        <AppPageMain>
          <AppPageAside isBordered={isBordered} width={180}>
            <Flex direction="column" gap={2}>
              {["Overview", "Settings", "Reports"].map((item) => (
                <Box
                  key={item}
                  paddingX={3}
                  paddingY={2}
                  style={{ borderRadius: 4, cursor: "pointer" }}
                >
                  <Typography variant="caption" color={theme.primary600}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Flex>
          </AppPageAside>
          <AppPageContent>
            <Typography variant="caption" color={theme.basic600}>
              Main content area
            </Typography>
          </AppPageContent>
        </AppPageMain>
      </AppPage>
    </Box>
  );
}
export default function Demo() {
  return (
    <Flex direction="column" gap={4}>
      <Shell isBordered={true} label="isBordered={true} — default, separator lines visible" />
      <Shell
        isBordered={false}
        label="isBordered={false} — borderless, background provides separation"
      />
    </Flex>
  );
}
