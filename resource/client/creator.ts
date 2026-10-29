import { onServerEvent, resourceExport } from "@aicore-fivem/lib/client";
import { asArgs, createLogger, waitFor } from "@aicore-fivem/lib/shared";
import { toAppearance, type Appearance } from "common/appearance";
import { EVENTS } from "common/events";
import { ResourceName } from "common";
import { content } from "./content";
import { editor } from "./editor";
import { applyAppearance, ensurePlayerModel } from "./skin";

const log = createLogger(ResourceName);

async function fadeOut(): Promise<void> {
  DoScreenFadeOut(300);
  await waitFor(() => IsScreenFadedOut() || undefined, 2000).catch(() => undefined);
}

/**
 * `ground`: z is the floor (panel points), the game lifts the ped by its root height. Otherwise z is the ped's own
 * root (read with GetEntityCoords) and is used as it is; mixing the two buries the ped or drops it from 1 m.
 */
async function teleport(x: number, y: number, z: number, heading: number, ground: boolean): Promise<void> {
  const ped = PlayerPedId();
  RequestCollisionAtCoord(x, y, z);
  if (ground) SetEntityCoords(ped, x, y, z, false, false, false, false);
  else SetEntityCoordsNoOffset(ped, x, y, z, false, false, false);
  SetEntityHeading(ped, heading);
  await waitFor(() => HasCollisionLoadedAroundEntity(ped) || undefined, 5000).catch(() => undefined);
}

/** A new character: into the creator room (the server moved the player to a private bucket), back after saving. */
async function runCreator(start: Appearance): Promise<void> {
  await waitFor(() => resourceExport("ai-core").IsPlayerLoaded() || undefined, 30_000);
  await fadeOut();
  const [bx = 0, by = 0, bz = 0] = GetEntityCoords(PlayerPedId(), false);
  const backHeading = GetEntityHeading(PlayerPedId());
  const ped = await ensurePlayerModel(start.model);
  applyAppearance(ped, start);
  const c = content.settings.creator;
  await teleport(c.x, c.y, c.z, c.heading, true);
  DoScreenFadeIn(500);
  await editor.open("creator", start);
  await fadeOut();
  await teleport(bx, by, bz, backHeading, false);
  DoScreenFadeIn(500);
}

onServerEvent(EVENTS.create, { args: ([raw]) => asArgs(toAppearance(raw)) }, (start) =>
  runCreator(start).catch((error: unknown) => {
    log.error("character creator failed", error);
    DoScreenFadeIn(0);
  }),
);
