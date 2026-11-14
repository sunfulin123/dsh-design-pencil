import { AppPage, AppPageHeader, AppPageMain, AppPageContent } from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import { Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const theme = useTheme();
  const rows = Array.from({ length: 20 }, (_, i) => `Content item ${i + 1}`);
  return (
    <Box
      height={360}
      style={{
        border: `1px solid ${theme.basic300}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <AppPage data-qa="app-page-no-aside">
        <AppPageHeader data-qa="app-header">
          <Flex alignY="center" alignX="space-between">
            <Typography variant="card-title" asLevel={4} color={theme.textDefault}>
              Agent Schedule
            </Typography>
            <Box
              paddingX={4}
              paddingY={2}
              backgroundColor={theme.primary600}
              style={{ borderRadius: 20, cursor: "pointer" }}
            >
              <Typography variant="body-emphasis" color={theme.white}>
                Export
              </Typography>
            </Box>
          </Flex>
        </AppPageHeader>

        <AppPageMain data-qa="app-main">
          <AppPageContent data-qa="app-content">
            <Flex direction="column" gap={3}>
              {rows.map((item) => (
                <Box
                  key={item}
                  paddingX={4}
                  paddingY={3}
                  backgroundColor={theme.basic100}
                  style={{ borderRadius: 4 }}
                >
                  <Typography variant="body" color={theme.textDefault}>
                    {item}
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
