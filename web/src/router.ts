import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/**
 * Which tab is open lives in the router (memory history: NUI has no url); the browser preview seeds it from the hash.
 * The screens are attached in `features/editor/routes.ts`: they import the actions that navigate through this router.
 */
export const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null,
});
export const tabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$tab",
});

const start = window.location.hash.startsWith("#/")
  ? window.location.hash.slice(1)
  : "/";

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, tabRoute]),
  history: createMemoryHistory({ initialEntries: [start] }),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
