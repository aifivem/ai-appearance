import {
  configureStore,
  createListenerMiddleware,
  isAnyOf,
} from "@reduxjs/toolkit"
import { Throttler } from "@tanstack/react-pacer"
import { useDispatch, useSelector } from "react-redux"
import { fetchNui } from "fivem-nui-react"
import type { Appearance } from "../../../resource/common/appearance"
import { NuiCallback } from "../../../resource/common/nui"
import editor, { editActions } from "./editor"

/** Slider drags change the look many times a second: the ped gets it at most every 50 ms, the last value always. */
const preview = new Throttler(
  (appearance: Appearance) =>
    void fetchNui<boolean>(NuiCallback.preview, appearance, { mockData: true }),
  {
    wait: 50,
    leading: true,
    trailing: true,
  }
)

const listener = createListenerMiddleware()

export const store = configureStore({
  reducer: { editor },
  middleware: (getDefault) => getDefault().prepend(listener.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

listener.startListening({
  matcher: isAnyOf(...editActions),
  effect: (_action, api) => {
    const appearance = (api.getState() as RootState).editor.appearance
    if (appearance) preview.maybeExecute(appearance)
  },
})

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
