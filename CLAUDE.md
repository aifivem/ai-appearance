# ai-appearance

Character looks: the creator a new character goes through, clothing stores, barber shops, and the portraits on ai-core's character cards. Depends on ai-core (characters, money, character screen events) and its own table through `@aicore-fivem/mysql`.

## Decisions

- Basic on purpose (owner decision): creator, clothing stores, barbers. Built from tgiann-clothing's core (collection-based clothing, head blend / overlay handling, framed editor camera), without its paid extras: no tattoos, outfits / wardrobe, clothing as items, price lists per item, ped models, job outfits, screenshot studio, store ownership.
- Freemode models only; the model follows the character's sex from ai-core (`MODELS`), the creator never changes it.
- One `Appearance` JSON per character (`resource/common/appearance.ts`, `version: 1`), indexed by the game's own component / prop / overlay ids. Clothing is collection name + local index (`""` = base game). Parents: mother and father ids drive both shape and skin.
- The server is the only writer: the creator save is accepted only while the character has no look yet (`Wearer.creating`); a shop save only inside that shop (server-side distance) and only for the parts the shop sells (`shopChange`: clothing = components except head / hair + props, barber = hair, hair colours, beard / brows / chest hair / makeup / blush / lipstick). The NUI prices with the same function.
- Prices are flat (owner wants basic): clothing per changed item, barber per visit with a change (`data/settings.json` `prices`), paid from `accounts` in order through ai-core's `RemoveMoney`.
- A new character is put in the creator after ai-core spawned it: private routing bucket `60000 + source`, the creator room from settings, back to the spawn point after saving.
- The character screen shows each character twice: a transparent headshot per card and a ped in ai-core's world scene. ai-core asks through its `characterScreen` event; this resource keeps the looks it gets (until a character spawns), announces each with `ai-core:client:characterLook (charId)` so ai-core dresses its scene ped through the `ApplyCharacterAppearance(ped, charId)` client export, and renders the headshots on local peds next to the hidden player (under the scene, out of the camera's view), handing back `nui-img` urls.
- Face features are edited like the game's creator: paired features on 2D planes (drag sets both, double click resets) and single ones on centre-filled sliders, layout and axis directions in `web/src/features/editor/face/faceLayout.ts` (ported from tgiann-clothing's FacePlane).
- The NUI uses the `tgiann-ui` stack (`.claude/rules/nui.md`): Radix primitives in `web/src/components/ui/`, Redux Toolkit for the snapshot and the edited look, TanStack Router (memory history) for the open tab, a Pacer throttler for the 50 ms ped preview, fivem-nui-react with mocks from `web/src/dev/mock.ts`.
- Settings and store locations are edited in ai-core's admin panel (`resource/server/schema.ts`, store `resource/server/content.ts`); both files are `sync: "all"`, so clients follow them live (`resource/client/content.ts`, blips and zones rebuild on every change). A store is a lib `Zones` cylinder checked every 500 ms; inside, ai-core's prompt shows and its interaction key opens the store (no GTA help text, no per-frame work). Stores are a centre point with a radius, converted from tgiann-clothing's zones (centre of the polygon, radius capped at 12 m).

## Contracts

- Net events and callbacks: `resource/common/events.ts`; NUI contract: `resource/common/nui.ts`.
- Listens to ai-core server events `playerLoaded` (dress or create), `playerUnloaded`, `characterScreen` (portraits); emits client events `ai-core:client:characterPortrait (charId, url)` and `ai-core:client:characterLook (charId)`; client export `ApplyCharacterAppearance(ped, charId)` (typed in `@aicore-fivem/shared` `exports.ts`).
- Table `ai_appearance_characters` (`char_id` = `ai_core_characters.id`, `data` = Appearance JSON).
- Panel content `data/settings.json` (creator point, prices, pay accounts, blips) and `data/shops.json` (`{ type, coords, radius, blip }`); both are in `files` and mirrored by the client's `AdminWorld`.
- Log channel `purchases`.

## Pitfalls

- Right after a model change the game has not resolved the model's collections: the catalog waits until per-collection drawable counts add up to the global counts before building (`client/catalog.ts`).
- ai-core swaps the model by sex during the spawn and resets clothing; the look is applied only once the model matches (`client/look.ts`).
- Gen9-only components are skipped in the catalog (broken meshes on the legacy game); props have no such native.
- The creator point is a floor position: teleport there with `SetEntityCoords` (the game lifts the ped by its root height); the way back uses the coordinates read with `GetEntityCoords` and `SetEntityCoordsNoOffset`. Mixing them buries the ped 1 m or drops it from 1 m.
- Headless Edge screenshots with `--virtual-time-budget` can catch the panel at the first frame of its enter animation; check a real-time render with puppeteer instead.

## Entry points

- Server: loading, creator and shop saves, portraits `resource/server/session.ts`; DB `repo.ts`.
- Client: applying a look `client/skin.ts`, editor session `client/editor.ts`, camera `client/camera.ts`, creator flow `client/creator.ts`, store prompts and blips `client/shops.ts`, card portraits `client/portraits.ts`.
- NUI: shell `web/src/features/editor/Editor.tsx` (root route), navigation and NUI calls `actions.ts`, tab bodies `tabs/`, face planes `face/`, state `web/src/store/`; browser preview `bun run webdev` with `?mode=creator|clothing|barber&changed=1&error=1#/<tab>`.
