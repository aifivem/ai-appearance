import { cache, loadLocaleTexts, player, triggerServerCallback } from "@aicore-fivem/lib/client";
import { isRecord } from "@aicore-fivem/lib/shared";
import { CLOTHING_COMPONENTS, HAIR_COMPONENT, OVERLAYS, PROP_IDS, toAppearance, type Appearance } from "common/appearance";
import { EVENTS, type SaveResult } from "common/events";
import { NuiCallback, NuiMessage, type CameraZone, type EditorData, type EditorMode, type Item } from "common/nui";
import { FATHERS, MOTHERS, PORTRAIT_DICT } from "common/parents";
import { shopChange } from "common/pricing";
import { EditorCamera } from "./camera";
import { catalog } from "./catalog";
import { content } from "./content";
import { look } from "./look";
import { applyChanges } from "./skin";

const BUSY = { ok: false, error: "APPEARANCE_ERR_BUSY" } as const satisfies SaveResult;
const ZONES: readonly string[] = ["face", "head", "upper", "body", "feet"] satisfies CameraZone[];

const hex = ([r, g, b]: [number, number, number]): string => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const palette = (count: number, rgb: (i: number) => [number, number, number]): string[] => Array.from({ length: count }, (_, i) => hex(rgb(i)));

interface Session {
  mode: EditorMode;
  shopId: string | null;
  original: Appearance;
  /** What the ped wears now. */
  worn: Appearance;
  done: (saved: boolean) => void;
}

/** The look editor (creator, clothing shop, barber) on the player's own ped. */
class Editor {
  private session: Session | null = null;
  private readonly camera = new EditorCamera();
  private readonly listeners: Array<() => void> = [];

  get isOpen(): boolean {
    return this.session !== null;
  }

  /** Runs after the editor opened or closed. */
  onOpenChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  /** Opens the editor; resolves true after a save, false after a cancel. */
  async open(mode: EditorMode, appearance: Appearance, shopId: string | null = null): Promise<boolean> {
    if (this.session) return false;
    // May run right after a model swap, before the cache has the new ped.
    const ped = PlayerPedId();
    const items = await catalog.items(ped);
    const pick = (lists: Record<number, Item[]>, ids: readonly number[]): Record<number, Item[]> =>
      Object.fromEntries(ids.map((id) => [id, lists[id] ?? []]));
    const componentIds = mode === "barber" ? [HAIR_COMPONENT] : mode === "clothing" ? CLOTHING_COMPONENTS : [HAIR_COMPONENT, ...CLOTHING_COMPONENTS];
    if (mode === "creator") RequestStreamedTextureDict(PORTRAIT_DICT, false);
    const data: EditorData = {
      mode,
      appearance,
      components: pick(items.components, componentIds),
      props: mode === "barber" ? {} : pick(items.props, PROP_IDS),
      overlayMax: Array.from({ length: OVERLAYS }, (_, id) => GetNumHeadOverlayValues(id) - 1),
      hairColors: palette(GetNumHairColors(), GetPedHairRgbColor),
      makeupColors: palette(GetNumMakeupColors(), GetPedMakeupRgbColor),
      mothers: MOTHERS,
      fathers: FATHERS,
      price: mode === "creator" ? 0 : content.settings.prices[mode],
      texts: loadLocaleTexts(),
    };
    return new Promise((done) => {
      this.session = { mode, shopId, original: appearance, worn: appearance, done };
      FreezeEntityPosition(ped, true);
      DisplayRadar(false);
      this.camera.start(ped, mode === "clothing" ? "body" : "face");
      SetNuiFocus(true, true);
      SendNUIMessage({ action: NuiMessage.open, data });
      for (const listener of this.listeners) listener();
    });
  }

  preview(raw: unknown): void {
    const s = this.session;
    const next = toAppearance(raw);
    if (!s || !next || next.model !== s.original.model) return;
    applyChanges(cache.ped, s.worn, next);
    s.worn = next;
  }

  focus(zone: unknown): void {
    if (typeof zone === "string" && ZONES.includes(zone)) this.camera.focus(zone as CameraZone);
  }

  drag(raw: unknown): void {
    if (isRecord(raw) && typeof raw.x === "number" && typeof raw.y === "number") this.camera.drag(raw.x, raw.y);
  }

  zoom(delta: unknown): void {
    if (typeof delta === "number" && Number.isFinite(delta)) this.camera.zoomBy(delta);
  }

  async save(raw: unknown): Promise<SaveResult> {
    const s = this.session;
    if (!s) return BUSY;
    this.preview(raw);
    const args = s.mode === "creator" ? [s.worn] : [s.shopId, s.worn];
    const answer = await triggerServerCallback(s.mode === "creator" ? EVENTS.saveCreator : EVENTS.saveShop, args).catch(() => null);
    if (!isRecord(answer) || answer.ok !== true) return { ok: false, error: isRecord(answer) && typeof answer.error === "string" ? answer.error : BUSY.error };
    const stored = s.mode === "creator" ? s.worn : shopChange(s.mode, s.original, s.worn).appearance;
    applyChanges(cache.ped, s.worn, stored);
    look.current = stored;
    this.close(true);
    return { ok: true };
  }

  cancel(): void {
    const s = this.session;
    if (!s || s.mode === "creator") return;
    applyChanges(cache.ped, s.worn, s.original);
    this.close(false);
  }

  private close(saved: boolean): void {
    const s = this.session;
    if (!s) return;
    this.session = null;
    SetNuiFocus(false, false);
    SendNUIMessage({ action: NuiMessage.close });
    this.camera.stop();
    player.freeze(false);
    DisplayRadar(true);
    if (s.mode === "creator") SetStreamedTextureDictAsNoLongerNeeded(PORTRAIT_DICT);
    s.done(saved);
    for (const listener of this.listeners) listener();
  }
}

export const editor = new Editor();

type NuiReply = (value: unknown) => void;

RegisterNuiCallback(NuiCallback.preview, (data: unknown, cb: NuiReply) => {
  editor.preview(data);
  cb(true);
});
RegisterNuiCallback(NuiCallback.camera, (data: unknown, cb: NuiReply) => {
  editor.focus(data);
  cb(true);
});
RegisterNuiCallback(NuiCallback.drag, (data: unknown, cb: NuiReply) => {
  editor.drag(data);
  cb(true);
});
RegisterNuiCallback(NuiCallback.zoom, (data: unknown, cb: NuiReply) => {
  editor.zoom(data);
  cb(true);
});
RegisterNuiCallback(NuiCallback.save, (data: unknown, cb: NuiReply) => {
  editor.save(data).then(cb, () => cb(BUSY));
});
RegisterNuiCallback(NuiCallback.cancel, (_data: unknown, cb: NuiReply) => {
  editor.cancel();
  cb(true);
});
