import { cache, onCache, Points } from "@aicore-fivem/lib/client"
import type { ShopType } from "common/content"
import { Locale } from "common"
import { content } from "./content"
import { editor } from "./editor"
import { look } from "./look"

const PROMPT: Record<ShopType, "HELP_CLOTHING" | "HELP_BARBER"> = {
  clothing: "HELP_CLOTHING",
  barber: "HELP_BARBER",
}
const BLIP: Record<ShopType, "BLIP_CLOTHING" | "BLIP_BARBER"> = {
  clothing: "BLIP_CLOTHING",
  barber: "BLIP_BARBER",
}
const ICON: Record<ShopType, string> = { clothing: "shirt", barber: "scissors" }

/**
 * Stores on this client: a point per store with its map blip, offered on foot, alive and not already editing; opens
 * once the character wears a look. Rebuilt whenever the panel changes a store or the settings.
 */
const points = new Points()

function rebuild(): void {
  points.clear()
  for (const shop of content.shops.values()) {
    points.add(shop.id, {
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
        !editor.isOpen && cache.vehicle === false && !IsEntityDead(cache.ped),
      onPressed: () =>
        look.current && editor.open(shop.type, look.current, shop.id),
    })
  }
}

rebuild()
content.subscribe(() => rebuild())
onCache("vehicle", () => points.refresh())
editor.onOpenChange(() => points.refresh())
