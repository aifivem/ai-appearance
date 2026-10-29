import { createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Editor } from "./features/editor/Editor";
import { TabContent } from "./features/editor/TabContent";

/** Which tab is open lives in the router (memory history: NUI has no url); the browser preview seeds it from the hash. */
const rootRoute = createRootRoute({ component: Editor });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => null });
const tabRoute = createRoute({ getParentRoute: () => rootRoute, path: "/$tab", component: TabContent });

const start = window.location.hash.startsWith("#/") ? window.location.hash.slice(1) : "/";

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, tabRoute]),
  history: createMemoryHistory({ initialEntries: [start] }),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
