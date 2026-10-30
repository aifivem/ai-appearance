import type { CameraZone, EditorMode } from "../../../../resource/common/nui";

export type Tab =
  "heritage" | "face" | "hair" | "skin" | "makeup" | "clothing" | "accessories";

export const TABS: Record<EditorMode, Tab[]> = {
  creator: [
    "heritage",
    "face",
    "hair",
    "skin",
    "makeup",
    "clothing",
    "accessories",
  ],
  clothing: ["clothing", "accessories"],
  barber: ["hair", "makeup"],
};

/** Framing the camera moves to when a tab opens. */
export const TAB_ZONE: Record<Tab, CameraZone> = {
  heritage: "face",
  face: "face",
  hair: "face",
  skin: "face",
  makeup: "face",
  clothing: "body",
  accessories: "head",
};

const ALL: readonly string[] = TABS.creator;
export const isTab = (value: unknown): value is Tab =>
  typeof value === "string" && ALL.includes(value);
