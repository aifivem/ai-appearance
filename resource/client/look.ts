import { onServerEvent } from "@aicore-fivem/lib/client"
import { asArgs, waitFor } from "@aicore-fivem/lib/shared"
import { CORE } from "@aicore-fivem/shared"
import { toAppearance, type Appearance } from "common/appearance"
import { EVENTS } from "common/events"
import { applyAppearance, ensurePlayerModel } from "./skin"

/** The look the loaded character wears (the server's copy); shops start from it. */
class Look {
  current: Appearance | null = null

  /** Dresses the player once ai-core's spawn has put the right model on (it swaps the model by sex first). */
  async wear(appearance: Appearance): Promise<void> {
    this.current = appearance
    const hash = GetHashKey(appearance.model)
    await waitFor(
      () => GetEntityModel(PlayerPedId()) === hash || undefined,
      10_000
    ).catch(() => undefined)
    const ped = await ensurePlayerModel(appearance.model)
    applyAppearance(ped, appearance)
  }
}

export const look = new Look()

onServerEvent(
  EVENTS.apply,
  { args: ([raw]) => asArgs(toAppearance(raw)) },
  (appearance) => look.wear(appearance)
)

on(CORE.clientPlayerUnloadedEvent, () => {
  look.current = null
})
