import { fetchNui } from "fivem-nui-react"
import {
  NuiCallback,
  type CameraZone,
  type EditorData,
} from "../../../../resource/common/nui"
import { mockSaveAnswer } from "../../dev/mock"
import { setTexts } from "../../lib/lang"
import { router } from "../../router"
import { store } from "../../store"
import { closed, opened, saveFailed, saveStarted } from "../../store/editor"
import { isTab, TAB_ZONE, TABS, type Tab } from "./tabs"

/** Every navigation and NUI call of the editor; components never call the router or fetchNui themselves. */

/** The client's open payload is this resource's own object; only the parts the screen reads are checked. */
export function toEditorData(value: unknown): EditorData | null {
  if (typeof value !== "object" || value === null) return null
  const data = value as Partial<EditorData>
  if (
    !data.appearance ||
    !data.mode ||
    !(data.mode in TABS) ||
    !Array.isArray(data.overlayMax)
  )
    return null
  return data as EditorData
}

export function focusCamera(zone: CameraZone): void {
  void fetchNui<boolean>(NuiCallback.camera, zone, { mockData: true })
}

export function goToTab(tab: Tab): void {
  void router.navigate({ to: "/$tab", params: { tab } })
  focusCamera(TAB_ZONE[tab])
}

/** Opens on the tab the player left last time when the mode has it, else on the mode's first tab. */
export function openEditor(data: EditorData): void {
  setTexts(data.texts)
  store.dispatch(opened(data))
  const tabs = TABS[data.mode]
  const params: Record<string, unknown> =
    router.state.matches.at(-1)?.params ?? {}
  const current = params.tab
  if (!isTab(current) || !tabs.includes(current))
    void router.navigate({ to: "/$tab", params: { tab: tabs[0] ?? "hair" } })
}

export function closeEditor(): void {
  store.dispatch(closed())
}

function toResult(value: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof value === "object" && value !== null) {
    const answer = value as { ok?: unknown; error?: unknown }
    if (answer.ok === true) return { ok: true }
    if (typeof answer.error === "string")
      return { ok: false, error: answer.error }
  }
  return { ok: false, error: "APPEARANCE_ERR_BUSY" }
}

export async function save(): Promise<void> {
  const { appearance, busy } = store.getState().editor
  if (!appearance || busy) return
  store.dispatch(saveStarted())
  const result = toResult(
    await fetchNui<unknown>(NuiCallback.save, appearance, {
      mockData: mockSaveAnswer(),
    }).catch(() => null)
  )
  // On success the client sends `close`, which resets the editor.
  if (!result.ok) store.dispatch(saveFailed(result.error))
}

export function cancel(): void {
  const { data, busy } = store.getState().editor
  if (busy || data?.mode === "creator") return
  void fetchNui<boolean>(NuiCallback.cancel, undefined, { mockData: true })
}
