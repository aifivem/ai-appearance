/** NUI contract of ai-appearance (client script <-> web), shared by both sides. */
import type { Appearance } from "./appearance"

export type EditorMode = "creator" | "clothing" | "barber"

/** One wearable item of a component or prop: collection, local index, texture count. */
export interface Item {
  c: string
  i: number
  t: number
}

export interface Parent {
  id: number
  name: string
  /** Game texture shown as the portrait (`https://nui-img/<dict>/<name>`). */
  image: string
}

/** Everything the editor needs, sent once when it opens. */
export interface EditorData {
  mode: EditorMode
  appearance: Appearance
  /** Wearable items by component id / prop id (only the ones the mode edits). */
  components: Record<number, Item[]>
  props: Record<number, Item[]>
  /** Highest value of each head overlay (13 entries, -1 when the model has none). */
  overlayMax: number[]
  hairColors: string[]
  makeupColors: string[]
  mothers: Parent[]
  fathers: Parent[]
  /** Price of one changed item (clothing) or of the visit (barber); 0 in the creator. */
  price: number
  texts: Record<string, string>
}

/** Client -> NUI messages: `{ action, data }`. */
export const NuiMessage = {
  /** data: EditorData */
  open: "open",
  close: "close",
} as const

/** NUI -> client callbacks (fetch `https://ai-appearance/<name>`). */
export const NuiCallback = {
  /** (Appearance) -> true, the look being edited changed: put it on the ped. */
  preview: "preview",
  /** (zone: CameraZone) -> true */
  camera: "camera",
  /** ({ x, y }: drag in screen fractions) -> true, turns the ped / moves the camera. */
  drag: "drag",
  /** (delta: wheel deltaY) -> true */
  zoom: "zoom",
  /** (Appearance) -> SaveResult; closes on ok. */
  save: "save",
  /** () -> true, puts the old look back and closes (not in the creator). */
  cancel: "cancel",
} as const

export type CameraZone = "face" | "head" | "upper" | "body" | "feet"
