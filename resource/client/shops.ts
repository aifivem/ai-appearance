import { cache, medical, onCache, Points } from "@aicore-fivem/lib/client";
import { RecordObjects } from "@aicore-fivem/lib/shared";
import { readShop, type ShopType } from "common/content";
import { Locale } from "common";
import { content, world } from "./content";
import { editor } from "./editor/editor";
import { look } from "./look";

const PROMPT: Record<ShopType, "HELP_CLOTHING" | "HELP_BARBER"> = {
  clothing: "HELP_CLOTHING",
  barber: "HELP_BARBER",
};
const BLIP: Record<ShopType, "BLIP_CLOTHING" | "BLIP_BARBER"> = {
  clothing: "BLIP_CLOTHING",
  barber: "BLIP_BARBER",
};
const ICON: Record<ShopType, string> = {
  clothing: "shirt",
  barber: "scissors",
};

/**
 * Stores on this client: a point per store with its map blip, offered on foot, alive and not already editing; opens
 * once the character wears a look. A panel edit rebuilds that store's point; a settings change (blip styles) all.
 */
const points = new Points();

const shops = new RecordObjects(world, "shops", readShop, (id, shop) => {
  points.add(id, {
    ped: shop.ped ?? undefined,
    coords: { x: shop.x, y: shop.y, z: shop.z },
    label: Locale(PROMPT[shop.type]),
    icon: ICON[shop.type],
    radius: shop.radius,
    height: 4,
    targetRadius: 2,
    blip: shop.blip
      ? {
          ...content.settings.blips[shop.type],
          label: Locale(BLIP[shop.type]),
        }
      : undefined,
    canShow: () =>
      !editor.isOpen && cache.vehicle === false && !medical.isDead(),
    onPressed: () => look.current && editor.open(shop.type, look.current, id),
  });
  return () => points.remove(id);
});

world.onChange("settings", () => shops.rebuildAll());
onCache("vehicle", () => points.refresh());
editor.onOpenChange(() => points.refresh());
