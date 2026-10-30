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

/** Looks of every player with a loaded character, by server id. */
class WearerRegistry {
  private readonly bySource = new Map<number, Wearer>();

  get(source: number): Wearer | undefined {
    return this.bySource.get(source);
  }

  set(source: number, wearer: Wearer): void {
    this.bySource.set(source, wearer);
  }

  delete(source: number): void {
    this.bySource.delete(source);
  }
}

export const wearers = new WearerRegistry();
