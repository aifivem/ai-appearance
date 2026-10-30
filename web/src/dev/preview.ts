import { isEnvBrowser } from "fivem-nui-react";
import { store } from "../store";
import { drawableSet, faceFeatureSet, hairColorSet } from "../store/editor";
import { mockChanged } from "./mock";

/** Browser preview only: a game-like backdrop (the page is transparent in game) and the `&changed=1` edits. */
export function applyPreview(): void {
  if (!isEnvBrowser()) return;
  document.body.style.background =
    "linear-gradient(135deg, #3a3a3a 0%, #0e0e0e 100%)";
  if (!mockChanged) return;
  // Edit once the mocked open has arrived and settled.
  const stop = store.subscribe(() => {
    if (!store.getState().editor.open) return;
    stop();
    setTimeout(edits, 500);
  });
}

function edits(): void {
  store.dispatch(
    drawableSet({
      kind: "components",
      id: 11,
      value: { collection: "", index: 5, texture: 0 },
    }),
  );
  store.dispatch(
    drawableSet({
      kind: "components",
      id: 4,
      value: { collection: "", index: 3, texture: 1 },
    }),
  );
  store.dispatch(
    drawableSet({
      kind: "components",
      id: 2,
      value: { collection: "", index: 4, texture: 0 },
    }),
  );
  store.dispatch(hairColorSet({ highlight: false, value: 12 }));
  store.dispatch(faceFeatureSet({ id: 0, value: 6 }));
  store.dispatch(faceFeatureSet({ id: 1, value: -4 }));
}
