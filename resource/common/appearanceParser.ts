import { isRecord, readInt } from "@aicore-fivem/lib/shared";
import {
  COMPONENTS,
  FACE_FEATURES,
  MODELS,
  OVERLAYS,
  PROPS,
  type Appearance,
  type Drawable,
  type HeadBlend,
  type Overlay,
} from "./appearance";

const COLLECTION = /^[A-Za-z0-9_ ]{0,64}$/;

function toDrawable(value: unknown, minIndex: number): Drawable | null {
  if (
    !isRecord(value) ||
    typeof value.collection !== "string" ||
    !COLLECTION.test(value.collection)
  )
    return null;
  const index = readInt(value.index, minIndex, 4095);
  const texture = readInt(value.texture, 0, 255);
  return index === null || texture === null
    ? null
    : { collection: value.collection, index, texture };
}

function toList<T>(
  value: unknown,
  length: number,
  read: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value) || value.length !== length) return null;
  const out: T[] = [];
  for (const item of value) {
    const parsed = read(item);
    if (parsed === null) return null;
    out.push(parsed);
  }
  return out;
}

function toOverlay(value: unknown): Overlay | null {
  if (!isRecord(value)) return null;
  const overlay = {
    value: readInt(value.value, -1, 255),
    opacity: readInt(value.opacity, 0, 10),
    color1: readInt(value.color1, 0, 63),
    color2: readInt(value.color2, 0, 63),
  };
  return overlay.value === null ||
    overlay.opacity === null ||
    overlay.color1 === null ||
    overlay.color2 === null
    ? null
    : (overlay as Overlay);
}

/** Checks every field's type and range; anything else (a client payload, a DB row) is refused as a whole. */
export function toAppearance(value: unknown): Appearance | null {
  if (!isRecord(value) || value.version !== 1) return null;
  if (value.model !== MODELS.male && value.model !== MODELS.female) return null;
  const hb = isRecord(value.headBlend) ? value.headBlend : null;
  const headBlend = hb && {
    mother: readInt(hb.mother, 0, 255),
    father: readInt(hb.father, 0, 255),
    shapeMix: readInt(hb.shapeMix, 0, 100),
    skinMix: readInt(hb.skinMix, 0, 100),
  };
  if (!headBlend || Object.values(headBlend).some((v) => v === null))
    return null;
  const faceFeatures = toList(value.faceFeatures, FACE_FEATURES, (v) =>
    readInt(v, -10, 10),
  );
  const overlays = toList(value.overlays, OVERLAYS, toOverlay);
  const components = toList(value.components, COMPONENTS, (v) =>
    toDrawable(v, 0),
  );
  const props = toList(value.props, PROPS, (v) => toDrawable(v, -1));
  const hairColor = readInt(value.hairColor, 0, 63);
  const hairHighlight = readInt(value.hairHighlight, 0, 63);
  const eyeColor = readInt(value.eyeColor, 0, 31);
  if (
    !faceFeatures ||
    !overlays ||
    !components ||
    !props ||
    hairColor === null ||
    hairHighlight === null ||
    eyeColor === null
  )
    return null;
  return {
    version: 1,
    model: value.model,
    headBlend: headBlend as HeadBlend,
    faceFeatures,
    overlays,
    hairColor,
    hairHighlight,
    eyeColor,
    components,
    props,
  };
}
