import {
  bool,
  flatDistance,
  int,
  num,
  type PlacePed,
  readBlipStyle,
  readPlacePed,
  record,
  vec4,
  type Vec4,
} from "@aicore-fivem/lib/shared";
import type { ShopType } from "./pricing";

/** Panel content (`data/settings.json`, `data/shops.json`): the server reads it from its admin panel store, clients from the world mirror. */

export type { ShopType };

export interface Shop {
  /** NPC standing at the place (panel), null for none. */
  ped: PlacePed | null;
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
  return readBlipStyle(v, { sprite: sprite, color: 47, scale: 0.7 });
};

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  const prices = record(s.prices);
  const blips = record(s.blips);
  const accounts = Array.isArray(s.accounts)
    ? s.accounts.filter(
        (a): a is string =>
          typeof a === "string" && /^[a-z0-9_]{2,32}$/.test(a),
      )
    : [];
  return {
    creator: vec4(s.creator, {
      x: -795.57,
      y: 331.79,
      z: 200.42,
      heading: 270,
    }),
    prices: {
      clothing: int(prices.clothing, 50, 0),
      barber: int(prices.barber, 100, 0),
    },
    accounts: accounts.length ? accounts : ["cash", "bank"],
    blips: {
      clothing: blip(blips.clothing, 73),
      barber: blip(blips.barber, 71),
    },
  };
}

/** One shop record (`records` / `RecordObjects` reader); null for a bad id or type. */
export function readShop(id: string, v: Record<string, unknown>): Shop | null {
  const c = record(v.coords);
  if (
    !/^[a-z0-9_]{2,32}$/.test(id) ||
    (v.type !== "clothing" && v.type !== "barber")
  )
    return null;
  return {
    id,
    type: v.type,
    x: num(c.x, 0),
    y: num(c.y, 0),
    z: num(c.z, 0),
    radius: num(v.radius, 5, 1, 30),
    blip: bool(v.blip, true),
    ped: readPlacePed(v.ped),
  };
}

/** Whether a point is inside a shop (ground distance within the radius, a floor or two of height). */
export function insideShop(
  shop: Shop,
  x: number,
  y: number,
  z: number,
): boolean {
  return (
    flatDistance({ x, y }, shop) <= shop.radius && Math.abs(z - shop.z) <= 4
  );
}

/** Where the content comes from: the server's AdminPanel or a client's AdminWorld (both have these two). */
interface ContentSource {
  view<T>(file: string, parse: (raw: unknown) => T): { readonly value: T };
  records<T>(
    file: string,
    readOne: (key: string, raw: Record<string, unknown>) => T | null,
  ): ReadonlyMap<string, T>;
}

/** Settings and shops, kept current by the panel views (one shop re-read per edit). */
export class AppearanceContent {
  private readonly settingsView: { readonly value: Settings };
  readonly shops: ReadonlyMap<string, Shop>;

  constructor(source: ContentSource) {
    this.settingsView = source.view("settings", readSettings);
    this.shops = source.records("shops", readShop);
  }

  get settings(): Settings {
    return this.settingsView.value;
  }
}
