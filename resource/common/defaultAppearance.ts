import type { Sex } from "@aicore-fivem/shared";
import {
  COMPONENTS,
  FACE_FEATURES,
  MODELS,
  OVERLAY,
  OVERLAYS,
  PROPS,
  type Appearance,
  type Drawable,
  type Overlay,
} from "./appearance";

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
