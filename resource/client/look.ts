import { onServerEvent, registerExport } from "@aicore-fivem/lib/client";
import { asArgs, waitFor } from "@aicore-fivem/lib/shared";
import { CORE } from "@aicore-fivem/shared";
import { toAppearance, type Appearance } from "common/appearance";
import { EVENTS } from "common/events";
import { applyAppearance, ensurePlayerModel } from "./skin";

/** The look the loaded character wears (the server's copy); shops start from it. */
class Look {
  current: Appearance | null = null;

  /** Dresses the player once ai-core's spawn has put the right model on (it swaps the model by sex first). */
  async wear(appearance: Appearance): Promise<void> {
    this.current = appearance;
    const hash = GetHashKey(appearance.model);
    await waitFor(
      () => GetEntityModel(PlayerPedId()) === hash || undefined,
      10_000,
    ).catch(() => undefined);
    const ped = await ensurePlayerModel(appearance.model);
    applyAppearance(ped, appearance);
  }
}

export const look = new Look();

onServerEvent(
  EVENTS.apply,
  { args: ([raw]) => asArgs(toAppearance(raw)) },
  (appearance) => look.wear(appearance),
);

on(CORE.clientPlayerUnloadedEvent, () => {
  look.current = null;
});

/**
 * `ApplyAppearance(ped, appearance)`: an `Appearance` on any ped of its model (ai-core's appearance layer: sleeping
 * bodies, the character screen); false when the look is invalid, the ped is gone or its model differs.
 */
registerExport("ApplyAppearance", (ped: unknown, raw: unknown): boolean => {
  const appearance = toAppearance(raw);
  if (
    !appearance ||
    typeof ped !== "number" ||
    !DoesEntityExist(ped) ||
    GetEntityModel(ped) !== GetHashKey(appearance.model)
  )
    return false;
  applyAppearance(ped, appearance);
  return true;
});

/** `GetPedAppearance(ped)`: the look the local player wears; null for other peds (only the player's is known). */
registerExport("GetPedAppearance", (ped: unknown): Appearance | null =>
  ped === PlayerPedId() ? look.current : null,
);
