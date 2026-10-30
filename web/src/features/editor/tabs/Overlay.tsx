import {
  HAIR_COLOURED_OVERLAYS,
  MAKEUP_COLOURED_OVERLAYS,
} from "../../../../../resource/common/appearance"
import { ColorGrid, LabeledSlider, Stepper } from "../../../components/controls"
import { useLang } from "../../../lib/lang"
import { useAppDispatch, useAppSelector } from "../../../store"
import { overlaySet } from "../../../store/editor"
import { focusCamera } from "../actions"

/** Overlays whose second palette colour shows on the ped. */
const SECOND_COLOUR: readonly number[] = [4]

/** A head overlay: style (or none), opacity, and its palette colour when it has one. */
export function OverlayControl({ id }: { id: number }) {
  const t = useLang()
  const dispatch = useAppDispatch()
  const overlay = useAppSelector(
    (state) => state.editor.appearance?.overlays[id]
  )
  const max = useAppSelector((state) => state.editor.data?.overlayMax[id] ?? -1)
  const hairColors = useAppSelector((state) => state.editor.data?.hairColors)
  const makeupColors = useAppSelector(
    (state) => state.editor.data?.makeupColors
  )
  if (!overlay || max < 0) return null
  const colors = HAIR_COLOURED_OVERLAYS.includes(id)
    ? hairColors
    : MAKEUP_COLOURED_OVERLAYS.includes(id)
      ? makeupColors
      : undefined
  const set = (patch: Parameters<typeof overlaySet>[0]["patch"]) =>
    dispatch(overlaySet({ id, patch }))
  const focus = () => focusCamera("face")
  const on = overlay.value >= 0

  return (
    <div className="flex flex-col gap-[1.2vh]">
      <Stepper
        label={t(`UI_OVERLAY_${id}`)}
        position={overlay.value + 1}
        count={max + 2}
        onFocus={focus}
        display={on ? undefined : t("UI_NONE")}
        onChange={(position) =>
          set({
            value: position - 1,
            opacity:
              position > 0 && overlay.opacity === 0 ? 10 : overlay.opacity,
          })
        }
      />
      {on && (
        <LabeledSlider
          label={t("UI_OPACITY")}
          value={overlay.opacity}
          min={0}
          max={10}
          onFocus={focus}
          display={`${overlay.opacity * 10}%`}
          onChange={(opacity) => set({ opacity })}
        />
      )}
      {on && colors && (
        <ColorGrid
          label={t("UI_COLOR")}
          colors={colors}
          value={overlay.color1}
          onChange={(color1) => set({ color1 })}
        />
      )}
      {on && colors && SECOND_COLOUR.includes(id) && (
        <ColorGrid
          label={t("UI_COLOR_2")}
          colors={colors}
          value={overlay.color2}
          onChange={(color2) => set({ color2 })}
        />
      )}
    </div>
  )
}
