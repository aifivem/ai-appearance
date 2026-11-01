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
