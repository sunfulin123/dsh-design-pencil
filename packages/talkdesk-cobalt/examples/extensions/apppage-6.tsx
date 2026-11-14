import {
  AppPage,
  AppPageHeader,
  AppPageMain,
  AppPageAside,
  AppPageContent,
  AppPageFooter,
} from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import { Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
import Button from "@talkdesk/cobalt-react-button";
export default function Demo() {
  const theme = useTheme();
  const rows = Array.from({ length: 20 }, (_, i) => `Row item ${i + 1}`);
  const navItems = ["Overview", "Agents", "Queues", "Reports"];
  return (
    <Box
      height={400}
      style={{
        border: `1px solid ${theme.basic300}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <AppPage>
        <AppPageHeader>
          <Typography variant="card-title" asLevel={4} color={theme.textDefault}>
            Queue Configuration
          </Typography>
        </AppPageHeader>

        <AppPageMain>
          <AppPageAside width={180}>
            <Flex direction="column" gap={2}>
              {navItems.map((item) => (
                <Box
                  key={item}
                  paddingX={3}
                  paddingY={2}
                  backgroundColor={theme.primarySurface}
                  style={{ borderRadius: 4, cursor: "pointer" }}
                >
                  <Typography variant="caption" color={theme.primary600}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Flex>
          </AppPageAside>

          <AppPageContent
            footer={
              <AppPageFooter>
                <Flex gap={3} alignX="end">
                  <Button type="secondary">Discard</Button>
                  <Button type="primary">Apply</Button>
                </Flex>
              </AppPageFooter>
            }
          >
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
