import {
  cache,
  NuiScreen,
  player,
  triggerServerCallback,
} from "@aicore-fivem/lib/client";
import { fail, isRecord, replyError } from "@aicore-fivem/lib/shared";
import { toAppearance } from "common/appearanceParser";
import type { Appearance } from "common/appearance";
import { EVENTS, type SaveResult } from "common/events";
import { NuiMessage, type CameraZone, type EditorMode } from "common/nui";
import { PORTRAIT_DICT } from "common/parents";
import { shopChange } from "common/pricing";
import { EditorCamera } from "../camera";
import { look } from "../look";
import { applyChanges } from "../skin";
import { editorData } from "./editorData";

export const BUSY = fail("APPEARANCE_ERR_BUSY");
const ZONES: readonly string[] = [
  "face",
  "head",
  "upper",
  "body",
  "feet",
] satisfies CameraZone[];

interface Session {
  mode: EditorMode;
  shopId: string | null;
  original: Appearance;
  /** What the ped wears now. */
  worn: Appearance;
  done: (saved: boolean) => void;
}

/** The editor page: only the editor closes it (save or cancel; the creator cannot be left). */
export const page = new NuiScreen("editor", { closeCallback: false });

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
  async open(
    mode: EditorMode,
    appearance: Appearance,
    shopId: string | null = null,
  ): Promise<boolean> {
    if (this.session) return false;
    // May run right after a model swap, before the cache has the new ped.
    const ped = PlayerPedId();
    const data = await editorData(ped, mode, appearance);
    if (mode === "creator") RequestStreamedTextureDict(PORTRAIT_DICT, false);
    return new Promise((done) => {
      this.session = {
        mode,
        shopId,
        original: appearance,
        worn: appearance,
        done,
      };
      player.freeze(true);
      this.camera.start(ped, mode === "clothing" ? "body" : "face");
      page.open({ action: NuiMessage.open, data });
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
    if (typeof zone === "string" && ZONES.includes(zone))
      this.camera.focus(zone as CameraZone);
  }

  drag(raw: unknown): void {
    if (isRecord(raw) && typeof raw.x === "number" && typeof raw.y === "number")
      this.camera.drag(raw.x, raw.y);
  }

  zoom(delta: unknown): void {
    if (typeof delta === "number" && Number.isFinite(delta))
      this.camera.zoomBy(delta);
  }

  async save(raw: unknown): Promise<SaveResult> {
    const s = this.session;
    if (!s) return BUSY;
    this.preview(raw);
    const args = s.mode === "creator" ? [s.worn] : [s.shopId, s.worn];
    const answer = await triggerServerCallback(
      s.mode === "creator" ? EVENTS.saveCreator : EVENTS.saveShop,
      args,
    ).catch(() => null);
    // The editor shows the refusal itself (callAction would notify it).
    const error = replyError(answer, BUSY.error);
    if (error !== null) return fail(error);
    const stored =
      s.mode === "creator"
        ? s.worn
        : shopChange(s.mode, s.original, s.worn).appearance;
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
    page.close();
    this.camera.stop();
    player.freeze(false);
    if (s.mode === "creator")
      SetStreamedTextureDictAsNoLongerNeeded(PORTRAIT_DICT);
    s.done(saved);
    for (const listener of this.listeners) listener();
  }
}

export const editor = new Editor();
