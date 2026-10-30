import { asArgs, fail, readText } from "@aicore-fivem/lib/shared";
import {
  aiLog,
  buckets,
  onCharacter,
  onClientCallback,
  PlayerMap,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { CORE, type CharacterInfo } from "@aicore-fivem/shared";
import { defaultAppearance, MODELS, toAppearance } from "common/appearance";
import { insideShop } from "common/content";
import { EVENTS, type SaveResult } from "common/events";
import { shopChange } from "common/pricing";
import { log } from "./log";
import { content } from "./content";
import { loadAppearances, saveAppearance, tablesReady } from "./repo";
import { Wearer, wearers } from "./wearers";

const core = resourceExport("ai-core");
const BUSY = fail("APPEARANCE_ERR_BUSY");
/** The creator's private routing bucket per player, from ai-core's allocator (given back on save, unload or drop). */
const creatorBuckets = new PlayerMap<number>({
  onDrop: (_source, bucket) => buckets.release(bucket),
});

function enterCreatorBucket(source: number): void {
  leaveCreatorBucket(source);
  const bucket = buckets.acquire("creator");
  creatorBuckets.set(source, bucket);
  SetRoutingBucketPopulationEnabled(bucket, false);
  SetRoutingBucketEntityLockdownMode(bucket, "strict");
  SetPlayerRoutingBucket(String(source), bucket);
}

/** `move`: the player goes back to the shared world (not on unload: ai-core puts them in the character screen's). */
function leaveCreatorBucket(source: number, move = true): void {
  const bucket = creatorBuckets.get(source);
  if (bucket === undefined) return;
  creatorBuckets.delete(source);
  if (move) SetPlayerRoutingBucket(String(source), 0);
  buckets.release(bucket);
}

/** Loads the character's look and dresses the player, or sends a new character to the creator. */
async function dress(source: number, character: CharacterInfo): Promise<void> {
  await tablesReady;
  const stored = (await loadAppearances([character.id])).get(character.id);
  if (core.GetCharacter(source)?.id !== character.id) return;
  if (stored) {
    wearers.set(source, new Wearer(character.id, character.sex, stored, false));
    emitNet(EVENTS.apply, source, stored);
    return;
  }
  const start = defaultAppearance(character.sex);
  wearers.set(source, new Wearer(character.id, character.sex, start, true));
  enterCreatorBucket(source);
  emitNet(EVENTS.create, source, start);
}

// Also replays the characters already in the world after a restart: the restarted client needs its look again.
onCharacter({
  loaded: (source, character) =>
    dress(source, character).catch((error: unknown) =>
      log.error(`loading the look of character ${character.id} failed`, error),
    ),
  unloaded: (source) => {
    wearers.delete(source);
    leaveCreatorBucket(source, false);
  },
});

/** The character screen loaded: the cards' looks go to the client, which turns them into portraits. */
on(CORE.characterScreenEvent, (source: number, charIds: number[]) => {
  loadAppearances(charIds).then(
    (looks) => {
      const list = [...looks].map(([id, appearance]) => ({ id, appearance }));
      if (list.length)
        TriggerLatentClientEvent(
          EVENTS.portraits,
          String(source),
          50_000,
          list,
        );
    },
    (error: unknown) =>
      log.error(
        `loading the character screen looks of ${source} failed`,
        error,
      ),
  );
});

onClientCallback(
  EVENTS.saveCreator,
  { args: ([raw]) => asArgs(toAppearance(raw)), lock: true },
  async (source, appearance): Promise<SaveResult> => {
    const wearer = wearers.get(source);
    if (!wearer?.creating) return BUSY;
    if (appearance.model !== MODELS[wearer.sex])
      return fail("APPEARANCE_ERR_INVALID");
    await saveAppearance(wearer.charId, appearance);
    wearer.appearance = appearance;
    wearer.creating = false;
    leaveCreatorBucket(source);
    return { ok: true };
  },
);

/** Takes `price` from the first account that has it. */
function pay(source: number, price: number, reason: string): boolean {
  if (price <= 0) return true;
  return content.settings.accounts.some((account) =>
    core.RemoveMoney(source, account, price, reason),
  );
}

onClientCallback(
  EVENTS.saveShop,
  {
    args: ([rawShop, raw]) => {
      const shopId = readText(rawShop, 64);
      const appearance = toAppearance(raw);
      return shopId !== null && appearance ? [shopId, appearance] : null;
    },
    lock: true,
  },
  async (source, shopId, next): Promise<SaveResult> => {
    const wearer = wearers.get(source);
    const shop = content.shops.get(shopId);
    if (!wearer || wearer.creating || !shop) return BUSY;
    const [x = 0, y = 0, z = 0] = GetEntityCoords(GetPlayerPed(String(source)));
    if (!insideShop(shop, x, y, z)) return fail("APPEARANCE_ERR_FAR");
    if (next.model !== wearer.appearance.model)
      return fail("APPEARANCE_ERR_INVALID");
    const { appearance, changes } = shopChange(
      shop.type,
      wearer.appearance,
      next,
    );
    if (changes === 0) return { ok: true };
    const price =
      shop.type === "clothing"
        ? changes * content.settings.prices.clothing
        : content.settings.prices.barber;
    if (!pay(source, price, `appearance:${shop.type}`))
      return fail("APPEARANCE_ERR_MONEY");
    await saveAppearance(wearer.charId, appearance);
    wearer.appearance = appearance;
    aiLog("purchases", `paid $${price} at ${shop.id}`, {
      source,
      metadata: { shop: shop.id, type: shop.type, changes, price },
    });
    return { ok: true };
  },
);
