import { loadLocaleTexts } from "@aicore-fivem/lib/client";
import {
  CLOTHING_COMPONENTS,
  HAIR_COMPONENT,
  OVERLAYS,
  PROP_IDS,
  type Appearance,
} from "common/appearance";
import type { EditorData, EditorMode, Item } from "common/nui";
import { FATHERS, MOTHERS } from "common/parents";
import { catalog } from "../catalog";
import { content } from "../content";

const hex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const palette = (
  count: number,
  rgb: (i: number) => [number, number, number],
): string[] => Array.from({ length: count }, (_, i) => hex(rgb(i)));

/** What the editor screen opens with: the mode's catalog lists, palettes, parents, price and texts. */
export async function editorData(
  ped: number,
  mode: EditorMode,
  appearance: Appearance,
): Promise<EditorData> {
  const items = await catalog.items(ped);
  const pick = (
    lists: Record<number, Item[]>,
    ids: readonly number[],
  ): Record<number, Item[]> =>
    Object.fromEntries(ids.map((id) => [id, lists[id] ?? []]));
  const componentIds =
    mode === "barber"
      ? [HAIR_COMPONENT]
      : mode === "clothing"
        ? CLOTHING_COMPONENTS
        : [HAIR_COMPONENT, ...CLOTHING_COMPONENTS];
  return {
    mode,
    appearance,
    components: pick(items.components, componentIds),
    props: mode === "barber" ? {} : pick(items.props, PROP_IDS),
    overlayMax: Array.from(
      { length: OVERLAYS },
      (_, id) => GetNumHeadOverlayValues(id) - 1,
    ),
    hairColors: palette(GetNumHairColors(), GetPedHairRgbColor),
    makeupColors: palette(GetNumMakeupColors(), GetPedMakeupRgbColor),
    mothers: MOTHERS,
    fathers: FATHERS,
    price: mode === "creator" ? 0 : content.settings.prices[mode],
    texts: loadLocaleTexts(),
  };
}
