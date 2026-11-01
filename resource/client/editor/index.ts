import { NUI_LAYER } from "@aicore-fivem/shared";
import { NuiCallback } from "common/nui";
import { BUSY, editor, page } from "./editor";

// Stacking among NUI pages (`NUI_LAYER`): set at start, not left to load order.
SetNuiZindex(NUI_LAYER.screen);

// The editor's own methods read the raw page data.
const raw = (data: unknown) => data;
page.on(NuiCallback.preview, raw, (data) => editor.preview(data));
page.on(NuiCallback.camera, raw, (data) => editor.focus(data));
page.on(NuiCallback.drag, raw, (data) => editor.drag(data));
page.on(NuiCallback.zoom, raw, (data) => editor.zoom(data));
page.on(NuiCallback.save, raw, (data) => editor.save(data).catch(() => BUSY));
page.on(
  NuiCallback.cancel,
  (data) => data ?? true,
  () => editor.cancel(),
);
