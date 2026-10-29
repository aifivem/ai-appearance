import { bool, int, num, record, vec4, type Vec4 } from "@aicore-fivem/lib/shared";
import type { ShopType } from "./pricing";

/** Panel content (`data/settings.json`, `data/shops.json`): the server reads it from its admin panel store, clients from the world mirror. */

export type { ShopType };

export interface Shop {
  id: string;
  type: ShopType;
  x: number;
  y: number;
  z: number;
  /** Metres from the centre on the ground plane where the shop can be opened. */
  radius: number;
  blip: boolean;
}

export interface BlipStyle {
  sprite: number;
  color: number;
  scale: number;
}

export interface Settings {
  /** Where a new character stands in the creator (a private routing bucket). */
  creator: Vec4;
  /** Clothing: per changed item; barber: per visit with a change. */
  prices: Record<ShopType, number>;
  /** Accounts a purchase is paid from, tried in order. */
  accounts: string[];
  blips: Record<ShopType, BlipStyle>;
}

const blip = (value: unknown, sprite: number): BlipStyle => {
  const v = record(value);
  return { sprite: int(v.sprite, sprite, 0, 1000), color: int(v.color, 47, 0, 100), scale: num(v.scale, 0.7, 0.1, 2) };
};

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  const prices = record(s.prices);
  const blips = record(s.blips);
  const accounts = Array.isArray(s.accounts) ? s.accounts.filter((a): a is string => typeof a === "string" && /^[a-z0-9_]{2,32}$/.test(a)) : [];
  return {
    creator: vec4(s.creator, { x: -795.57, y: 331.79, z: 200.42, heading: 270 }),
    prices: { clothing: int(prices.clothing, 50, 0), barber: int(prices.barber, 100, 0) },
    accounts: accounts.length ? accounts : ["cash", "bank"],
    blips: { clothing: blip(blips.clothing, 73), barber: blip(blips.barber, 71) },
  };
}

export function readShops(raw: unknown): Map<string, Shop> {
  const shops = new Map<string, Shop>();
  for (const [id, value] of Object.entries(record(raw))) {
    const v = record(value);
    const c = record(v.coords);
    if (!/^[a-z0-9_]{2,32}$/.test(id) || (v.type !== "clothing" && v.type !== "barber")) continue;
    shops.set(id, {
      id,
      type: v.type,
      x: num(c.x, 0),
      y: num(c.y, 0),
      z: num(c.z, 0),
      radius: num(v.radius, 5, 1, 30),
      blip: bool(v.blip, true),
    });
  }
  return shops;
}

/** Whether a point is inside a shop (ground distance within the radius, a floor or two of height). */
export function insideShop(shop: Shop, x: number, y: number, z: number): boolean {
  return Math.hypot(x - shop.x, y - shop.y) <= shop.radius && Math.abs(z - shop.z) <= 4;
}

/** Where the content comes from: the server's AdminPanel or a client's AdminWorld (both have these two). */
interface ContentSource {
  get(file: string): unknown;
  onChange(file: string, handler: () => void): void;
}

/** Settings and shops, read once and again after every panel change. */
export class AppearanceContent {
  settings: Settings;
  shops: Map<string, Shop>;
  private readonly listeners: Array<() => void> = [];

  constructor(source: ContentSource) {
    this.settings = readSettings(source.get("settings"));
    this.shops = readShops(source.get("shops"));
    source.onChange("settings", () => {
      this.settings = readSettings(source.get("settings"));
      this.notify();
    });
    source.onChange("shops", () => {
      this.shops = readShops(source.get("shops"));
      this.notify();
    });
  }

  /** Runs after any change (blips, prompts). */
  subscribe(listener: () => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
