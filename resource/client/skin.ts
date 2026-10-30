import { requestModel } from "@aicore-fivem/lib/client";
import {
  COMPONENTS,
  HAIR_COLOURED_OVERLAYS,
  MAKEUP_COLOURED_OVERLAYS,
  PROP_IDS,
  sameDrawable,
  sameOverlay,
  type Appearance,
  type Drawable,
  type HeadBlend,
} from "common/appearance";

/** Puts an Appearance on a ped part by part; values the ped cannot wear (a removed DLC) fall back to base items. */

const palette = (id: number): number => (id === 6 || id === 9 ? 2 : 0);

function applyComponent(ped: number, id: number, d: Drawable): void {
  if (
    IsPedCollectionComponentVariationValid(
      ped,
      id,
      d.collection,
      d.index,
      d.texture,
    )
  ) {
    SetPedCollectionComponentVariation(
      ped,
      id,
      d.collection,
      d.index,
      d.texture,
      palette(id),
    );
  } else {
    SetPedCollectionComponentVariation(ped, id, "", 0, 0, palette(id));
  }
}

function applyProp(ped: number, id: number, d: Drawable): void {
  if (
    d.index < 0 ||
    d.index >=
      GetNumberOfPedCollectionPropDrawableVariations(ped, id, d.collection)
  ) {
    ClearPedProp(ped, id);
    return;
  }
  SetPedCollectionPropIndex(ped, id, d.collection, d.index, d.texture, true);
}

function applyHeadBlend(ped: number, hb: HeadBlend): void {
  SetPedHeadBlendData(
    ped,
    hb.mother,
    hb.father,
    0,
    hb.mother,
    hb.father,
    0,
    hb.shapeMix / 100,
    hb.skinMix / 100,
    0,
    false,
  );
}

function applyOverlay(ped: number, id: number, a: Appearance): void {
  const overlay = a.overlays[id];
  if (!overlay) return;
  SetPedHeadOverlay(
    ped,
    id,
    overlay.value < 0 ? 255 : overlay.value,
    overlay.opacity / 10,
  );
  if (HAIR_COLOURED_OVERLAYS.includes(id))
    SetPedHeadOverlayColor(ped, id, 1, overlay.color1, overlay.color2);
  else if (MAKEUP_COLOURED_OVERLAYS.includes(id))
    SetPedHeadOverlayColor(ped, id, 2, overlay.color1, overlay.color2);
}

/** Swaps the ped's model when it differs; returns the (new) ped. Only for the player's own ped. */
export async function ensurePlayerModel(model: string): Promise<number> {
  const hash = GetHashKey(model);
  if (GetEntityModel(PlayerPedId()) === hash) return PlayerPedId();
  await requestModel(model);
  SetPlayerModel(PlayerId(), hash);
  SetModelAsNoLongerNeeded(hash);
  SetPedDefaultComponentVariation(PlayerPedId());
  return PlayerPedId();
}

/** Every part of the look. */
export function applyAppearance(ped: number, a: Appearance): void {
  applyHeadBlend(ped, a.headBlend);
  a.faceFeatures.forEach((value, index) =>
    SetPedFaceFeature(ped, index, value / 10),
  );
  a.overlays.forEach((_, id) => applyOverlay(ped, id, a));
  SetPedHairTint(ped, a.hairColor, a.hairHighlight);
  SetPedEyeColor(ped, a.eyeColor);
  for (let id = 1; id < COMPONENTS; id++)
    applyComponent(ped, id, a.components[id]!);
  for (const id of PROP_IDS) applyProp(ped, id, a.props[id]!);
}

/** Only the parts that differ between `prev` (what the ped wears) and `next`: cheap enough for slider drags. */
export function applyChanges(
  ped: number,
  prev: Appearance,
  next: Appearance,
): void {
  const a = prev.headBlend;
  const b = next.headBlend;
  if (
    a.mother !== b.mother ||
    a.father !== b.father ||
    !HasPedHeadBlendFinished(ped)
  )
    applyHeadBlend(ped, b);
  else if (a.shapeMix !== b.shapeMix || a.skinMix !== b.skinMix)
    UpdatePedHeadBlendData(ped, b.shapeMix / 100, b.skinMix / 100, 0);
  next.faceFeatures.forEach((value, index) => {
    if (prev.faceFeatures[index] !== value)
      SetPedFaceFeature(ped, index, value / 10);
  });
  next.overlays.forEach((overlay, id) => {
    if (!sameOverlay(prev.overlays[id], overlay)) applyOverlay(ped, id, next);
  });
  if (
    prev.hairColor !== next.hairColor ||
    prev.hairHighlight !== next.hairHighlight
  )
    SetPedHairTint(ped, next.hairColor, next.hairHighlight);
  if (prev.eyeColor !== next.eyeColor) SetPedEyeColor(ped, next.eyeColor);
  for (let id = 1; id < COMPONENTS; id++) {
    if (!sameDrawable(prev.components[id], next.components[id]))
      applyComponent(ped, id, next.components[id]!);
  }
  for (const id of PROP_IDS) {
    if (!sameDrawable(prev.props[id], next.props[id]))
      applyProp(ped, id, next.props[id]!);
  }
}
