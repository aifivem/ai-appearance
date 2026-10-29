import { waitFor } from "@aicore-fivem/lib/shared";
import type { Item } from "common/nui";

/** Wearable items of a freemode model, by collection; built once per model and kept. */
export interface ModelItems {
  components: Record<number, Item[]>;
  props: Record<number, Item[]>;
}

const COMPONENT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const PROP_IDS = [0, 1, 2, 6, 7];

function collectionNames(ped: number): string[] {
  return Array.from({ length: GetPedCollectionsCount(ped) }, (_, i) => GetPedCollectionName(ped, i));
}

/** Right after a model change the collections are not resolved yet: their counts must add up to the global ones. */
function countsReady(ped: number): boolean {
  const names = collectionNames(ped);
  if (names.length === 0) return false;
  const sum = (count: (name: string) => number): number => names.reduce((total, name) => total + count(name), 0);
  return (
    COMPONENT_IDS.every((id) => sum((n) => GetNumberOfPedCollectionDrawableVariations(ped, id, n)) === GetNumberOfPedDrawableVariations(ped, id)) &&
    PROP_IDS.every((id) => sum((n) => GetNumberOfPedCollectionPropDrawableVariations(ped, id, n)) === GetNumberOfPedPropDrawableVariations(ped, id))
  );
}

function build(ped: number): ModelItems {
  const names = collectionNames(ped);
  const components: Record<number, Item[]> = {};
  const props: Record<number, Item[]> = {};
  for (const id of COMPONENT_IDS) {
    const items: Item[] = [];
    for (const c of names) {
      const count = GetNumberOfPedCollectionDrawableVariations(ped, id, c);
      for (let i = 0; i < count; i++) {
        // Enhanced-only items show as broken meshes on the legacy game.
        if (IsPedCollectionComponentVariationGen9Exclusive(ped, id, c, i)) continue;
        items.push({ c, i, t: Math.max(1, GetNumberOfPedCollectionTextureVariations(ped, id, c, i)) });
      }
    }
    components[id] = items;
  }
  for (const id of PROP_IDS) {
    const items: Item[] = [];
    for (const c of names) {
      const count = GetNumberOfPedCollectionPropDrawableVariations(ped, id, c);
      for (let i = 0; i < count; i++) items.push({ c, i, t: Math.max(1, GetNumberOfPedCollectionPropTextureVariations(ped, id, c, i)) });
    }
    props[id] = items;
  }
  return { components, props };
}

class Catalog {
  private readonly byModel = new Map<number, ModelItems>();

  /** The items of the ped's model (waits up to 5 s for the game to resolve its collections). */
  async items(ped: number): Promise<ModelItems> {
    const model = GetEntityModel(ped);
    const cached = this.byModel.get(model);
    if (cached) return cached;
    await waitFor(() => countsReady(ped) || undefined, 5000);
    const items = build(ped);
    this.byModel.set(model, items);
    return items;
  }
}

export const catalog = new Catalog();
