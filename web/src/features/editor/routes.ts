import { rootRoute, tabRoute } from "../../router";
import { Editor } from "./Editor";
import { TabContent } from "./TabContent";

// The editor is the root screen, a tab's body the child route; attached before the first render.
rootRoute.update({ component: Editor });
tabRoute.update({ component: TabContent });
