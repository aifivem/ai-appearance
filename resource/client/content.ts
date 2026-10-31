import { AdminWorld } from "@aicore-fivem/lib/client";
import { AppearanceContent } from "common/content";

/** The panel files this client mirrors: cached at start, then every change live. */
export const world = new AdminWorld(["settings", "shops"]);

/** Settings and shops as the panel has them now. */
export const content = new AppearanceContent(world);
