import {
  HAIR_COMPONENT,
  OVERLAY,
} from "../../../../../resource/common/appearance"
import { ColorGrid, Section } from "../../../components/controls"
import { useLang } from "../../../lib/lang"
import { useAppDispatch, useAppSelector } from "../../../store"
import { hairColorSet } from "../../../store/editor"
import { DrawableControl } from "./Drawable"
import { OverlayControl } from "./Overlay"

export function HairTab() {
  const t = useLang()
  const dispatch = useAppDispatch()
  const colors = useAppSelector((state) => state.editor.data?.hairColors ?? [])
  const hairColor = useAppSelector(
    (state) => state.editor.appearance?.hairColor ?? 0
  )
  const highlight = useAppSelector(
    (state) => state.editor.appearance?.hairHighlight ?? 0
  )
  return (
    <>
      <Section title={t("UI_HAIRSTYLE")}>
        <DrawableControl
          kind="components"
          id={HAIR_COMPONENT}
          label={t("UI_STYLE")}
          zone="face"
        />
        <ColorGrid
          label={t("UI_HAIR_COLOR")}
          colors={colors}
          value={hairColor}
          onChange={(value) =>
            dispatch(hairColorSet({ highlight: false, value }))
          }
        />
        <ColorGrid
          label={t("UI_HAIR_HIGHLIGHT")}
          colors={colors}
          value={highlight}
          onChange={(value) =>
            dispatch(hairColorSet({ highlight: true, value }))
          }
        />
      </Section>
      <Section title={t("UI_OVERLAY_2")}>
        <OverlayControl id={OVERLAY.eyebrows} />
      </Section>
      <Section title={t("UI_OVERLAY_1")}>
        <OverlayControl id={OVERLAY.beard} />
        <OverlayControl id={OVERLAY.chestHair} />
      </Section>
    </>
  )
}
