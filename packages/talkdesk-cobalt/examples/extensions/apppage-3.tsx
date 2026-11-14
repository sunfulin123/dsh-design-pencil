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
function PageShell({ asideWidth, label }: { asideWidth: number | string; label: string }) {
  const theme = useTheme();
  return (
    <Box
      height={220}
      style={{
        border: `1px solid ${theme.basic300}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <AppPage>
        <AppPageHeader>
          <Typography variant="body-emphasis" color={theme.textDefault}>
            {label}
          </Typography>
        </AppPageHeader>
        <AppPageMain>
          <AppPageAside width={asideWidth} data-qa="custom-aside">
            <Flex direction="column" gap={2}>
              {["Filter A", "Filter B", "Filter C"].map((f) => (
                <Box
                  key={f}
                  paddingX={3}
                  paddingY={2}
                  backgroundColor={theme.primarySurface}
                  style={{ borderRadius: 4 }}
                >
                  <Typography variant="caption" color={theme.primary600}>
                    {f}
                  </Typography>
                </Box>
              ))}
            </Flex>
          </AppPageAside>
          <AppPageContent>
            <Box height="100%" backgroundColor={theme.basic100} style={{ borderRadius: 4 }}>
              <Typography variant="caption" color={theme.basic600}>
                Content area
              </Typography>
            </Box>
          </AppPageContent>
        </AppPageMain>
      </AppPage>
    </Box>
  );
}
export default function Demo() {
  return (
    <Flex direction="column" gap={4}>
      <PageShell asideWidth={300} label="width={300} — fixed pixel width" />
      <PageShell asideWidth="30%" label='width="30%" — proportional width' />
    </Flex>
  );
}
