/** Net events and callbacks of ai-appearance (payload types in ./appearance). */
export const EVENTS = {
  /** Server -> client: (appearance: Appearance) the loaded character's look. */
  apply: "ai-appearance:client:apply",
  /** Server -> client: (appearance: Appearance) the character has no look yet: open the creator with this start. */
  create: "ai-appearance:client:create",
  /** Server -> client (latent): (list: { id: number, appearance: Appearance }[]) looks of the character screen's cards. */
  portraits: "ai-appearance:client:portraits",
  /** Callback: (appearance) -> { ok } | { ok: false, error }, saves the creator. */
  saveCreator: "ai-appearance:saveCreator",
  /** Callback: (shopId, appearance) -> { ok } | { ok: false, error }, pays and saves a shop visit. */
  saveShop: "ai-appearance:saveShop",
} as const;

export type SaveResult = { ok: true } | { ok: false; error: string };
