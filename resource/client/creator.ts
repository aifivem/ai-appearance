import {
  fadeIn,
  fadeOut,
  onServerEvent,
  player,
  resourceExport,
} from "@aicore-fivem/lib/client";
import { asArgs, createLogger, waitFor } from "@aicore-fivem/lib/shared";
import type { Appearance } from "common/appearance";
import { toAppearance } from "common/appearanceParser";
import { EVENTS } from "common/events";
import { ResourceName } from "common";
import { content } from "./content";
import { editor } from "./editor/editor";
import { applyAppearance, ensurePlayerModel } from "./skin";

const log = createLogger(ResourceName);
const core = resourceExport("ai-core");

/** A new character: into the creator room (the server moved the player to a private bucket), back after saving. */
async function runCreator(start: Appearance): Promise<void> {
  await waitFor(() => core.IsPlayerLoaded() || undefined, 30_000);
  await fadeOut();
  const back = player.coords();
  const backHeading = player.heading();
  const c = content.settings.creator;
  // Floor point (the way back is the ped's root); before any model swap, as `player` acts on cache.ped.
  await player.teleport(c, { heading: c.heading, fade: false });
  const ped = await ensurePlayerModel(start.model);
  applyAppearance(ped, start);
  await fadeIn(500);
  await editor.open("creator", start);
  await player.teleport(back, { heading: backHeading, ground: false });
}

onServerEvent(
  EVENTS.create,
  { args: ([raw]) => asArgs(toAppearance(raw)) },
  (start) =>
    runCreator(start).catch((error: unknown) => {
      log.error("character creator failed", error);
      void fadeIn(0);
    }),
);
