import { lazy, Suspense, type ComponentType } from "react";
import Spinner from "@talkdesk/cobalt-react-spinner";
import { useWorkspaceState } from "../workspace-shell";
import { prototypeApps } from "./apps";
import { PrototypeScenarioProvider } from "./scenarios";

const loaders = import.meta.glob<{ default: ComponentType }>("../apps/*/pages/*.tsx");
const pages = Object.fromEntries(Object.entries(loaders).map(([file, load]) => [file, lazy(load)]));

/** Load the active business page only; chart-heavy recipes stay outside initial Workspace boot. */
export default function App() {
  const state = useWorkspaceState();
  const params = new URLSearchParams(location.search);
  const app =
    prototypeApps.find((app) => app.id === (state.appId || params.get("app"))) ?? prototypeApps[0];
  const page =
    app.pages.find((page) => page.id === (state.page || params.get("page"))) ?? app.pages[0];
  const Page = pages[`../apps/${app.id}/pages/${page.id}.tsx`];
  if (!Page) throw new Error(`Missing prototype page: ${app.id}/${page.id}`);
  return (
    <PrototypeScenarioProvider key={app.id}>
      <Suspense
        fallback={
          <div role="status" aria-label="Loading page" data-prototype-loading>
            <Spinner />
          </div>
        }
      >
        <Page key={page.id} />
      </Suspense>
    </PrototypeScenarioProvider>
  );
}
