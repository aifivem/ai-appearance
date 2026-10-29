import { defaultAppearance } from "../../../resource/common/appearance";
import type { EditorData, EditorMode, Item } from "../../../resource/common/nui";
import { FATHERS, MOTHERS } from "../../../resource/common/parents";
import en from "../../../locales/en.json";

/**
 * Browser preview only (`bun run webdev`): `?mode=creator|clothing|barber`, `#/<tab>` for the open tab,
 * `&changed=1` for a few edits (price), `&error=1` for a failed save. fivem-nui-react hands these mocks out
 * only outside the game.
 */
const params = new URLSearchParams(window.location.search);
const items = (count: number, textures = 4): Item[] =>
  Array.from({ length: count }, (_, i) => ({ c: i < count / 2 ? "" : "mp_m_heist", i, t: (i % textures) + 1 }));
const palette = (count: number, hue: number): string[] =>
  Array.from({ length: count }, (_, i) => `hsl(${(hue + i * 9) % 360}, ${30 + (i % 4) * 15}%, ${15 + (i % 8) * 9}%)`);

export function mockOpenData(): EditorData {
  const raw = params.get("mode");
  const mode: EditorMode = raw === "clothing" || raw === "barber" ? raw : "creator";
  return {
    mode,
    appearance: defaultAppearance("male"),
    components: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((id) => [id, items(40 + id * 10)])),
    props: Object.fromEntries([0, 1, 2, 6, 7].map((id) => [id, items(30 + id)])),
    overlayMax: [23, 28, 33, 14, 74, 6, 11, 10, 9, 17, 16, 11, 1],
    hairColors: palette(64, 20),
    makeupColors: palette(64, 320),
    mothers: MOTHERS,
    fathers: FATHERS,
    price: mode === "clothing" ? 50 : mode === "barber" ? 100 : 0,
    texts: en,
  };
}

export function mockSaveAnswer(): unknown {
  return params.get("error") ? { ok: false, error: "APPEARANCE_ERR_MONEY" } : { ok: true };
}

export const mockChanged = params.get("changed") !== null;
