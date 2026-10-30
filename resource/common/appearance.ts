import { isRecord, readInt } from "@aicore-fivem/lib/shared";
import type { Sex } from "@aicore-fivem/shared";

/** A character's look, stored as JSON per character and applied on the client. Indexes are the game's own ids. */

export const MODELS = {
  male: "mp_m_freemode_01",
  female: "mp_f_freemode_01",
} as const satisfies Record<Sex, string>;
export type PedModel = (typeof MODELS)[Sex];

/** Clothing slot: collection name ("" = base game) + index inside that collection. Props use index -1 for none. */
export interface Drawable {
  collection: string;
  index: number;
  texture: number;
}

/** Parents: ids are head blend faces; mixes 0-100 (0 = all mother, 100 = all father). */
export interface HeadBlend {
  mother: number;
  father: number;
  shapeMix: number;
  skinMix: number;
}

/** A head overlay (beard, makeup, ageing...): value -1 = none, opacity 0-10, palette colours. */
export interface Overlay {
  value: number;
  opacity: number;
  color1: number;
  color2: number;
}

export interface Appearance {
  version: 1;
  model: PedModel;
  headBlend: HeadBlend;
  /** 20 face features, -10..10. */
  faceFeatures: number[];
  /** 13 head overlays by overlay id. */
  overlays: Overlay[];
  hairColor: number;
  hairHighlight: number;
  eyeColor: number;
  /** 12 components by component id (0 head ... 11 tops). */
  components: Drawable[];
  /** 8 props by prop id (0 hats, 1 glasses, 2 ears, 6 watches, 7 bracelets; 3-5 unused). */
  props: Drawable[];
}

export const FACE_FEATURES = 20;
export const OVERLAYS = 13;
export const COMPONENTS = 12;
export const PROPS = 8;
/** Component and prop ids the menus edit. */
export const CLOTHING_COMPONENTS = [11, 8, 3, 4, 6, 5, 7, 1, 9, 10] as const;
export const HAIR_COMPONENT = 2;
export const PROP_IDS = [0, 1, 2, 6, 7] as const;

/** Overlay ids by name; colour kind decides the palette (hair or makeup). */
export const OVERLAY = {
  blemishes: 0,
  beard: 1,
  eyebrows: 2,
  ageing: 3,
  makeup: 4,
  blush: 5,
  complexion: 6,
  sunDamage: 7,
  lipstick: 8,
  moles: 9,
  chestHair: 10,
  bodyBlemishes: 11,
} as const;
export const HAIR_COLOURED_OVERLAYS: readonly number[] = [
  OVERLAY.beard,
  OVERLAY.eyebrows,
  OVERLAY.chestHair,
];
export const MAKEUP_COLOURED_OVERLAYS: readonly number[] = [
  OVERLAY.makeup,
  OVERLAY.blush,
  OVERLAY.lipstick,
];
/** What a barber may change besides the hair component and hair colours. */
export const BARBER_OVERLAYS: readonly number[] = [
  OVERLAY.beard,
  OVERLAY.eyebrows,
  OVERLAY.chestHair,
  OVERLAY.makeup,
  OVERLAY.blush,
  OVERLAY.lipstick,
];

const drawable = (index: number, texture = 0, collection = ""): Drawable => ({
  collection,
  index,
  texture,
});
const none = (): Drawable => drawable(-1);

/** The starting look of a new character (base game items only), edited in the creator. */
export function defaultAppearance(sex: Sex): Appearance {
  const male = sex === "male";
  const components = Array.from({ length: COMPONENTS }, () => drawable(0));
  if (male) {
    components[4] = drawable(7);
    components[6] = drawable(1);
    components[8] = drawable(15);
  } else {
    components[3] = drawable(3);
    components[4] = drawable(0, 10);
    components[6] = drawable(3);
    components[8] = drawable(14);
    components[11] = drawable(3, 2);
  }
  const overlays = Array.from({ length: OVERLAYS }, (): Overlay => ({
    value: -1,
    opacity: 0,
    color1: 0,
    color2: 0,
  }));
  overlays[OVERLAY.eyebrows] = { value: 0, opacity: 10, color1: 0, color2: 0 };
  return {
    version: 1,
    model: MODELS[sex],
    headBlend: { mother: 21, father: 0, shapeMix: male ? 70 : 30, skinMix: 50 },
    faceFeatures: Array.from({ length: FACE_FEATURES }, () => 0),
    overlays,
    hairColor: 0,
    hairHighlight: 0,
    eyeColor: 0,
    components,
    props: Array.from({ length: PROPS }, none),
  };
}

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

export const sameDrawable = (
  a: Drawable | undefined,
  b: Drawable | undefined,
): boolean =>
  a?.collection === b?.collection &&
  a?.index === b?.index &&
  a?.texture === b?.texture;

export const sameOverlay = (
  a: Overlay | undefined,
  b: Overlay | undefined,
): boolean =>
  a?.value === b?.value &&
  a?.opacity === b?.opacity &&
  a?.color1 === b?.color1 &&
  a?.color2 === b?.color2;
