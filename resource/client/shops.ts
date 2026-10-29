import { hidePrompt, onPromptPressed, showPrompt, Zones } from "@aicore-fivem/lib/client";
import type { ShopType } from "common/content";
import { Locale } from "common";
import { content } from "./content";
import { editor } from "./editor";
import { look } from "./look";

const PROMPT: Record<ShopType, "HELP_CLOTHING" | "HELP_BARBER"> = { clothing: "HELP_CLOTHING", barber: "HELP_BARBER" };
const BLIP: Record<ShopType, string> = { clothing: "AIAPP_BLIP_CLOTHING", barber: "AIAPP_BLIP_BARBER" };
/** Height above and below a store's centre that still counts as inside (a floor or two). */
const ZONE_HEIGHT = 4;

AddTextEntry(BLIP.clothing, Locale("BLIP_CLOTHING"));
AddTextEntry(BLIP.barber, Locale("BLIP_BARBER"));

/**
 * Stores on this client: map blips, a zone per store (checked twice a second, no per-frame work) and ai-core's
 * prompt while the player is inside. Rebuilt whenever the panel changes a store or the settings.
 */
class Shops {
  private blips: number[] = [];
  private readonly zones = new Zones();

  rebuild(): void {
    for (const blip of this.blips) RemoveBlip(blip);
    this.blips = [];
    this.zones.clear();
    for (const shop of content.shops.values()) {
      if (shop.blip) this.blips.push(this.blip(shop.type, shop.x, shop.y, shop.z));
      this.zones.add(shop.id, {
        shape: { type: "cylinder", center: { x: shop.x, y: shop.y, z: shop.z }, radius: shop.radius, height: ZONE_HEIGHT },
        interval: 500,
        onEnter: () => showPrompt(shop.id, Locale(PROMPT[shop.type])),
        onExit: () => hidePrompt(shop.id),
      });
    }
  }

  /** The interaction key on a store's prompt: open it if the player is dressed, on foot and alive. */
  open(id: string): void {
    const shop = content.shops.get(id);
    const ped = PlayerPedId();
    if (!shop || !look.current || editor.isOpen || IsPedInAnyVehicle(ped, false) || IsEntityDead(ped)) return;
    hidePrompt(id);
    void editor.open(shop.type, look.current, shop.id).then(() => {
      if (this.zones.isInside(id)) showPrompt(id, Locale(PROMPT[shop.type]));
    });
  }

  private blip(type: ShopType, x: number, y: number, z: number): number {
    const style = content.settings.blips[type];
    const blip = AddBlipForCoord(x, y, z);
    SetBlipSprite(blip, style.sprite);
    SetBlipColour(blip, style.color);
    SetBlipScale(blip, style.scale);
    SetBlipAsShortRange(blip, true);
    BeginTextCommandSetBlipName(BLIP[type]);
    EndTextCommandSetBlipName(blip);
    return blip;
  }
}

const shops = new Shops();
shops.rebuild();
content.subscribe(() => shops.rebuild());
onPromptPressed((id) => shops.open(id));
