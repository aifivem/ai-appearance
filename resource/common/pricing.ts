import {
  BARBER_OVERLAYS,
  HAIR_COMPONENT,
  PROP_IDS,
  sameDrawable,
  sameOverlay,
  type Appearance,
} from "./appearance";

export type ShopType = "clothing" | "barber";

/** Components a clothing shop sells (not the head, not the hair). */
const SHOP_COMPONENTS = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * What a shop visit may change: `next` laid over `current` for the shop's own parts only, plus how many parts
 * changed (clothing: per item; barber: 1 when anything changed). Server and NUI price a visit with this.
 */
export function shopChange(
  type: ShopType,
  current: Appearance,
  next: Appearance,
): { appearance: Appearance; changes: number } {
  const appearance: Appearance = {
    ...current,
    components: [...current.components],
    props: [...current.props],
    overlays: [...current.overlays],
  };
  let changes = 0;
  if (type === "clothing") {
    for (const id of SHOP_COMPONENTS) {
      if (sameDrawable(current.components[id], next.components[id])) continue;
      appearance.components[id] =
        next.components[id] ?? current.components[id]!;
      changes++;
    }
    for (const id of PROP_IDS) {
      if (sameDrawable(current.props[id], next.props[id])) continue;
      appearance.props[id] = next.props[id] ?? current.props[id]!;
      changes++;
    }
    return { appearance, changes };
  }
  let changed = !sameDrawable(
    current.components[HAIR_COMPONENT],
    next.components[HAIR_COMPONENT],
  );
  appearance.components[HAIR_COMPONENT] =
    next.components[HAIR_COMPONENT] ?? current.components[HAIR_COMPONENT]!;
  for (const id of BARBER_OVERLAYS) {
    if (sameOverlay(current.overlays[id], next.overlays[id])) continue;
    appearance.overlays[id] = next.overlays[id] ?? current.overlays[id]!;
    changed = true;
  }
  if (
    current.hairColor !== next.hairColor ||
    current.hairHighlight !== next.hairHighlight
  )
    changed = true;
  appearance.hairColor = next.hairColor;
  appearance.hairHighlight = next.hairHighlight;
  return { appearance, changes: changed ? 1 : 0 };
}
