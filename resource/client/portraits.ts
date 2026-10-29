import { onServerEvent, requestModel } from "@aicore-fivem/lib/client";
import { asArgs, createLogger, isRecord, sleep, waitFor } from "@aicore-fivem/lib/shared";
import { CORE } from "@aicore-fivem/shared";
import { toAppearance, type Appearance } from "common/appearance";
import { EVENTS } from "common/events";
import { ResourceName } from "common";
import { applyAppearance } from "./skin";

const log = createLogger(ResourceName);

/**
 * Portraits for ai-core's character cards: each look goes on a local ped behind the full-screen menu, the
 * game renders a transparent headshot of it, ai-core shows it through `nui-img`. Headshots live until a character spawns.
 */
class Portraits {
  /** Character id -> headshot handle and the look it shows. */
  private readonly shots = new Map<number, { handle: number; key: string }>();
  private queue: Promise<void> = Promise.resolve();

  request(list: Array<{ id: number; appearance: Appearance }>): void {
    this.queue = this.queue.then(async () => {
      for (const { id, appearance } of list) {
        await this.make(id, appearance).catch((error: unknown) => log.error(`portrait of character ${id} failed`, error));
      }
    });
  }

  private async make(id: number, appearance: Appearance): Promise<void> {
    const key = JSON.stringify(appearance);
    const old = this.shots.get(id);
    if (old?.key === key && IsPedheadshotValid(old.handle)) return this.announce(id, old.handle);
    if (old) UnregisterPedheadshot(old.handle);
    this.shots.delete(id);

    const hash = await requestModel(appearance.model);
    // In front of the player, who waits behind ai-core's opaque character screen.
    const [x = 0, y = 0, z = 0] = GetOffsetFromEntityInWorldCoords(PlayerPedId(), 0, 1.5, 0);
    const ped = CreatePed(4, hash, x, y, z - 1, 0, false, false);
    SetModelAsNoLongerNeeded(hash);
    try {
      FreezeEntityPosition(ped, true);
      SetEntityInvincible(ped, true);
      SetBlockingOfNonTemporaryEvents(ped, true);
      applyAppearance(ped, appearance);
      await waitFor(() => (HasPedHeadBlendFinished(ped) && HasPedPreloadVariationDataFinished(ped)) || undefined, 3000).catch(() => undefined);
      await sleep(100);
      const handle = RegisterPedheadshotTransparent(ped);
      await waitFor(() => (IsPedheadshotReady(handle) && IsPedheadshotValid(handle)) || undefined, 5000);
      this.shots.set(id, { handle, key });
      this.announce(id, handle);
    } finally {
      DeletePed(ped);
    }
  }

  private announce(id: number, handle: number): void {
    const txd = GetPedheadshotTxdString(handle);
    emit(CORE.clientCharacterPortraitEvent, id, `https://nui-img/${txd}/${txd}`);
  }

  clear(): void {
    for (const { handle } of this.shots.values()) UnregisterPedheadshot(handle);
    this.shots.clear();
  }
}

const portraits = new Portraits();

/** Cards of the character screen: only entries with a numeric id and a valid look pass. */
function toPortraitList(raw: unknown): Array<{ id: number; appearance: Appearance }> | null {
  if (!Array.isArray(raw)) return null;
  return raw.flatMap((entry: unknown) => {
    if (!isRecord(entry) || typeof entry.id !== "number") return [];
    const appearance = toAppearance(entry.appearance);
    return appearance ? [{ id: entry.id, appearance }] : [];
  });
}

onServerEvent(EVENTS.portraits, { args: ([raw]) => asArgs(toPortraitList(raw)) }, (list) => portraits.request(list));

on(CORE.clientPlayerLoadedEvent, () => portraits.clear());
on("onResourceStop", (resource: string) => {
  if (resource === ResourceName) portraits.clear();
});
