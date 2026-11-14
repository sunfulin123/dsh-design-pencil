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
export default function Demo() {
  const theme = useTheme();
  const rows = Array.from({ length: 30 }, (_, i) => `Row item ${i + 1}`);
  const navItems = Array.from({ length: 20 }, (_, i) => `Nav item ${i + 1}`);
  return (
    <Box
      height={400}
      style={{
        border: `1px solid ${theme.basic300}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <AppPage data-qa="app-page">
        <AppPageHeader data-qa="app-header">
          <Flex alignY="center" gap={2} direction="column">
            <Typography variant="card-title" asLevel={4} color={theme.textDefault}>
              Meeting Finder
            </Typography>
            <Typography variant="caption" color={theme.basic600}>
              Recommends optimal meeting times based on agent availability
            </Typography>
          </Flex>
        </AppPageHeader>

        <AppPageMain data-qa="app-main">
          <AppPageAside isBordered data-qa="app-aside">
            <Flex direction="column" gap={2}>
              {navItems.map((item) => (
                <Box
                  key={item}
                  paddingX={3}
                  paddingY={2}
                  backgroundColor={theme.primarySurface}
                  style={{ borderRadius: 4, cursor: "pointer" }}
                >
                  <Typography variant="body" color={theme.primary600}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Flex>
          </AppPageAside>

          <AppPageContent data-qa="app-content">
            <Flex direction="column" gap={3}>
              {rows.map((row) => (
                <Box
                  key={row}
                  paddingX={4}
                  paddingY={3}
                  backgroundColor={theme.basic100}
                  style={{ borderRadius: 4 }}
                >
                  <Typography variant="body" color={theme.textDefault}>
                    {row}
                  </Typography>
                </Box>
              ))}
            </Flex>
          </AppPageContent>
        </AppPageMain>
      </AppPage>
    </Box>
  );
}
