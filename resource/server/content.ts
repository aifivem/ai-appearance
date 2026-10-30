import { AdminPanel } from "@aicore-fivem/lib/server";
import { AppearanceContent } from "common/content";
import { appearanceSchema } from "./schema";

/** The panel store (it owns `data/*.json`) and the settings and shops the server works with. */
export const panel = new AdminPanel(appearanceSchema);
export const content = new AppearanceContent(panel);
