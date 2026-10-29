/**
 * The face menu as the game lays it out: paired features share a 2D plane, single ones get a two-ended slider.
 * Numbers are face feature ids. `invertX` / `invertY` put the negative value at the right / top end (the game keeps
 * most "up" and "right" ends negative); `minY` limits the vertical axis (chin cleft runs 0..10).
 */
export interface FacePlaneConfig {
  key: string;
  x: number;
  y: number;
  labels: { top: string; bottom: string; left: string; right: string };
  invertX?: boolean;
  invertY?: boolean;
  minY?: number;
}

export interface FaceSliderConfig {
  key: string;
  feature: number;
  labels: { left: string; right: string };
  invert?: boolean;
}

export const FACE_PLANES: FacePlaneConfig[] = [
  { key: "BROW", x: 7, y: 6, labels: { top: "PAD_UP", bottom: "PAD_DOWN", left: "PAD_IN", right: "PAD_OUT" }, invertY: true },
  { key: "NOSE", x: 0, y: 1, labels: { top: "PAD_UP", bottom: "PAD_DOWN", left: "PAD_NARROW", right: "PAD_WIDE" }, invertY: true },
  { key: "NOSE_PROFILE", x: 2, y: 3, labels: { top: "PAD_CROOKED", bottom: "PAD_CURVED", left: "PAD_SHORT", right: "PAD_LONG" }, invertX: true, invertY: true },
  { key: "NOSE_TIP", x: 5, y: 4, labels: { top: "PAD_TIP_UP", bottom: "PAD_TIP_DOWN", left: "PAD_BROKEN_LEFT", right: "PAD_BROKEN_RIGHT" }, invertY: true },
  { key: "CHEEKBONES", x: 9, y: 8, labels: { top: "PAD_UP", bottom: "PAD_DOWN", left: "PAD_IN", right: "PAD_OUT" }, invertY: true },
  { key: "JAW", x: 13, y: 14, labels: { top: "PAD_ROUND", bottom: "PAD_SQUARE", left: "PAD_NARROW", right: "PAD_WIDE" }, invertY: true },
  { key: "CHIN_PROFILE", x: 16, y: 15, labels: { top: "PAD_UP", bottom: "PAD_DOWN", left: "PAD_IN", right: "PAD_OUT" }, invertY: true },
  {
    key: "CHIN_SHAPE",
    x: 17,
    y: 18,
    labels: { top: "PAD_ROUNDED", bottom: "PAD_BUM", left: "PAD_SQUARE", right: "PAD_POINTED" },
    invertX: true,
    invertY: true,
    minY: 0,
  },
];

export const FACE_SLIDERS: FaceSliderConfig[] = [
  { key: "EYES", feature: 11, labels: { left: "PAD_SQUINT", right: "PAD_WIDE" }, invert: true },
  { key: "CHEEKS", feature: 10, labels: { left: "PAD_GAUNT", right: "PAD_PUFFED" }, invert: true },
  { key: "LIPS", feature: 12, labels: { left: "PAD_THIN", right: "PAD_FAT" }, invert: true },
  { key: "NECK", feature: 19, labels: { left: "PAD_THIN", right: "PAD_THICK" } },
];

/** One axis of a plane or slider: the value at the left / bottom end and at the right / top end. */
export interface FaceAxis {
  from: number;
  to: number;
}

const MIN = -10;
const MAX = 10;

export function faceAxis(invert = false, min = MIN): FaceAxis {
  return invert ? { from: MAX, to: min } : { from: min, to: MAX };
}

/** 0..1 position of a value on the axis. */
export const axisRatio = (axis: FaceAxis, value: number): number => Math.min(1, Math.max(0, (value - axis.from) / (axis.to - axis.from || 1)));

/** The value at a 0..1 position. */
export const axisValue = (axis: FaceAxis, ratio: number): number => Math.round(axis.from + ratio * (axis.to - axis.from));

/** Position shown to the player on a -10..10 scale, centre 0. */
export const axisPosition = (ratio: number): number => Math.round(ratio * 20 - 10);
