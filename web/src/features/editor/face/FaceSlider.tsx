import { Slider } from "../../../components/ui/slider"
import { useLang } from "../../../lib/lang"
import { useAppDispatch, useAppSelector } from "../../../store"
import { faceFeatureSet } from "../../../store/editor"
import { focusCamera } from "../actions"
import {
  axisPosition,
  axisRatio,
  axisValue,
  faceAxis,
  type FaceSliderConfig,
} from "./faceLayout"

const STEPS = 20

/** A single face feature (eyes, cheeks, lips, neck): two-ended slider filling from the centre, double click resets. */
export function FaceSlider({ slider }: { slider: FaceSliderConfig }) {
  const t = useLang()
  const dispatch = useAppDispatch()
  const value = useAppSelector(
    (state) => state.editor.appearance?.faceFeatures[slider.feature] ?? 0
  )
  const axis = faceAxis(slider.invert)
  const ratio = axisRatio(axis, value)
  const set = (next: number) =>
    next !== value &&
    dispatch(faceFeatureSet({ id: slider.feature, value: next }))
  const label = t(`FACE_SINGLE_${slider.key}`)

  return (
    <div
      className="flex flex-col gap-[0.6vh]"
      onPointerDown={() => focusCamera("face")}
      onDoubleClick={() => set(0)}
    >
      <div className="flex items-baseline justify-between text-[1.3vh]">
        <span className="font-medium text-white/90">{label}</span>
        <span className="text-text-3 tabular-nums">{axisPosition(ratio)}</span>
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={STEPS}
        step={1}
        origin={STEPS / 2}
        value={[Math.round(ratio * STEPS)]}
        onValueChange={([step]) =>
          step !== undefined && set(axisValue(axis, step / STEPS))
        }
      />
      <div className="flex justify-between text-[1.1vh] text-text-3">
        <span>{t(slider.labels.left)}</span>
        <span>{t(slider.labels.right)}</span>
      </div>
    </div>
  )
}
