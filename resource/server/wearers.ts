import { PlayerMap } from "@aicore-fivem/lib/server";
import type { Sex } from "@aicore-fivem/shared";
import type { Appearance } from "common/appearance";

/** A loaded character's look in memory; `creating` until the creator is saved once. */
export class Wearer {
  constructor(
    readonly charId: number,
    readonly sex: Sex,
    public appearance: Appearance,
    public creating: boolean,
  ) {}
}

/** Looks of every player with a loaded character, by server id (freed on unload and drop). */
export const wearers = new PlayerMap<Wearer>();
