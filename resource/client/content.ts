import { AdminWorld } from "@aicore-fivem/lib/client";
import { AppearanceContent } from "common/content";

/** Settings and shops as the panel has them now: the files cached at start, then every change live. */
export const content = new AppearanceContent(new AdminWorld(["settings", "shops"]));
