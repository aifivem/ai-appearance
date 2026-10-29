import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Appearance, Drawable, HeadBlend, Overlay } from "../../../resource/common/appearance";
import type { EditorData } from "../../../resource/common/nui";

/** The editor: the client's snapshot (`data`, holding the look it opened with) and the look being edited. */
export interface EditorState {
  open: boolean;
  data: EditorData | null;
  appearance: Appearance | null;
  busy: boolean;
  error: string | null;
}

const initialState: EditorState = { open: false, data: null, appearance: null, busy: false, error: null };

const editor = createSlice({
  name: "editor",
  initialState,
  reducers: {
    opened(state, action: PayloadAction<EditorData>) {
      state.open = true;
      state.data = action.payload;
      state.appearance = action.payload.appearance;
      state.busy = false;
      state.error = null;
    },
    closed(state) {
      state.open = false;
      state.busy = false;
      state.error = null;
    },
    saveStarted(state) {
      state.busy = true;
      state.error = null;
    },
    saveFailed(state, action: PayloadAction<string>) {
      state.busy = false;
      state.error = action.payload;
    },
    headBlendSet(state, action: PayloadAction<{ field: keyof HeadBlend; value: number }>) {
      if (state.appearance) state.appearance.headBlend[action.payload.field] = action.payload.value;
    },
    faceFeatureSet(state, action: PayloadAction<{ id: number; value: number }>) {
      if (state.appearance) state.appearance.faceFeatures[action.payload.id] = action.payload.value;
    },
    overlaySet(state, action: PayloadAction<{ id: number; patch: Partial<Overlay> }>) {
      const overlay = state.appearance?.overlays[action.payload.id];
      if (overlay) Object.assign(overlay, action.payload.patch);
    },
    hairColorSet(state, action: PayloadAction<{ highlight: boolean; value: number }>) {
      if (!state.appearance) return;
      if (action.payload.highlight) state.appearance.hairHighlight = action.payload.value;
      else state.appearance.hairColor = action.payload.value;
    },
    eyeColorSet(state, action: PayloadAction<number>) {
      if (state.appearance) state.appearance.eyeColor = action.payload;
    },
    drawableSet(state, action: PayloadAction<{ kind: "components" | "props"; id: number; value: Drawable }>) {
      if (state.appearance) state.appearance[action.payload.kind][action.payload.id] = action.payload.value;
    },
  },
});

export const { opened, closed, saveStarted, saveFailed, headBlendSet, faceFeatureSet, overlaySet, hairColorSet, eyeColorSet, drawableSet } = editor.actions;

/** Actions that change the look: each one is previewed on the ped. */
export const editActions = [headBlendSet, faceFeatureSet, overlaySet, hairColorSet, eyeColorSet, drawableSet] as const;

export default editor.reducer;
