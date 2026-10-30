import { asArgs } from "@aicore-fivem/lib/shared"
import {
  aiLog,
  onClientCallback,
  resourceExport,
} from "@aicore-fivem/lib/server"
import { CORE, type CharacterInfo } from "@aicore-fivem/shared"
import {
  defaultAppearance,
  MODELS,
  toAppearance,
  type Appearance,
} from "common/appearance"
import { insideShop } from "common/content"
import { EVENTS, type SaveResult } from "common/events"
import { shopChange } from "common/pricing"
import { log } from "./log"
import { content } from "./content"
import { loadAppearances, saveAppearance } from "./repo"
import { Wearer, wearers } from "./wearers"

const core = resourceExport("ai-core")
const BUSY: SaveResult = { ok: false, error: "APPEARANCE_ERR_BUSY" }
/** Private routing bucket of the creator, one per player (ai-core's character screen uses 50000+). */
const CREATOR_BUCKET_BASE = 60_000

function enterCreatorBucket(source: number): void {
  const bucket = CREATOR_BUCKET_BASE + source
  SetRoutingBucketPopulationEnabled(bucket, false)
  SetRoutingBucketEntityLockdownMode(bucket, "strict")
  SetPlayerRoutingBucket(String(source), bucket)
}

/** Loads the character's look and dresses the player, or sends a new character to the creator. */
async function dress(source: number, character: CharacterInfo): Promise<void> {
  const stored = (await loadAppearances([character.id])).get(character.id)
  if (core.GetCharacter(source)?.id !== character.id) return
  if (stored) {
    wearers.set(source, new Wearer(character.id, character.sex, stored, false))
    emitNet(EVENTS.apply, source, stored)
    return
  }
  const start = defaultAppearance(character.sex)
  wearers.set(source, new Wearer(character.id, character.sex, start, true))
  enterCreatorBucket(source)
  emitNet(EVENTS.create, source, start)
}

on(CORE.playerLoadedEvent, (source: number, character: CharacterInfo) => {
  dress(source, character).catch((error: unknown) =>
    log.error(`loading the look of character ${character.id} failed`, error)
  )
})

on(CORE.playerUnloadedEvent, (source: number) => wearers.delete(source))

/** The character screen loaded: the cards' looks go to the client, which turns them into portraits. */
on(CORE.characterScreenEvent, (source: number, charIds: number[]) => {
  loadAppearances(charIds).then(
    (looks) => {
      const list = [...looks].map(([id, appearance]) => ({ id, appearance }))
      if (list.length)
        TriggerLatentClientEvent(EVENTS.portraits, String(source), 50_000, list)
    },
    (error: unknown) =>
      log.error(`loading the character screen looks of ${source} failed`, error)
  )
})

onClientCallback(
  EVENTS.saveCreator,
  { args: ([raw]) => asArgs(toAppearance(raw)), lock: true },
  async (source, appearance): Promise<SaveResult> => {
    const wearer = wearers.get(source)
    if (!wearer?.creating) return BUSY
    if (appearance.model !== MODELS[wearer.sex])
      return { ok: false, error: "APPEARANCE_ERR_INVALID" }
    await saveAppearance(wearer.charId, appearance)
    wearer.appearance = appearance
    wearer.creating = false
    SetPlayerRoutingBucket(String(source), 0)
    return { ok: true }
  }
)

/** Takes `price` from the first account that has it. */
function pay(source: number, price: number, reason: string): boolean {
  if (price <= 0) return true
  return content.settings.accounts.some((account) =>
    core.RemoveMoney(source, account, price, reason)
  )
}

onClientCallback(
  EVENTS.saveShop,
  {
    args: ([shopId, raw]) => {
      const appearance = toAppearance(raw)
      return typeof shopId === "string" && appearance
        ? [shopId, appearance]
        : null
    },
    lock: true,
  },
  async (source, shopId, next): Promise<SaveResult> => {
    const wearer = wearers.get(source)
    const shop = content.shops.get(shopId)
    if (!wearer || wearer.creating || !shop) return BUSY
    const [x = 0, y = 0, z = 0] = GetEntityCoords(GetPlayerPed(String(source)))
    if (!insideShop(shop, x, y, z))
      return { ok: false, error: "APPEARANCE_ERR_FAR" }
    if (next.model !== wearer.appearance.model)
      return { ok: false, error: "APPEARANCE_ERR_INVALID" }
    const { appearance, changes } = shopChange(
      shop.type,
      wearer.appearance,
      next
    )
    if (changes === 0) return { ok: true }
    const price =
      shop.type === "clothing"
        ? changes * content.settings.prices.clothing
        : content.settings.prices.barber
    if (!pay(source, price, `appearance:${shop.type}`))
      return { ok: false, error: "APPEARANCE_ERR_MONEY" }
    await saveAppearance(wearer.charId, appearance)
    wearer.appearance = appearance
    aiLog("purchases", `paid $${price} at ${shop.id}`, {
      source,
      metadata: { shop: shop.id, type: shop.type, changes, price },
    })
    return { ok: true }
  }
)

on("playerDropped", () => wearers.delete(Number(globalThis.source)))

/** After a restart of this resource: looks of the players already in the game. */
export async function restoreOnline(): Promise<void> {
  const loaded = core.GetLoadedSources().flatMap((source) => {
    const character = core.GetCharacter(source)
    return character ? [{ source, character }] : []
  })
  const looks = await loadAppearances(loaded.map((entry) => entry.character.id))
  for (const { source, character } of loaded) {
    const look: Appearance | undefined = looks.get(character.id)
    if (look)
      wearers.set(source, new Wearer(character.id, character.sex, look, false))
  }
}
