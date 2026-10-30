import { OVERLAY } from "../../../../../resource/common/appearance";
import { Section, Stepper } from "../../../components/controls";
import { useLang } from "../../../lib/lang";
import { useAppDispatch, useAppSelector } from "../../../store";
import { eyeColorSet } from "../../../store/editor";
import { focusCamera } from "../actions";
import { FACE_PLANES, FACE_SLIDERS } from "../face/faceLayout";
import { FacePlane } from "../face/FacePlane";
import { FaceSlider } from "../face/FaceSlider";
import { OverlayControl } from "./Overlay";

const EYE_COLORS = 32;

export function FaceTab() {
  const t = useLang();
  const dispatch = useAppDispatch();
  const eyeColor = useAppSelector(
    (state) => state.editor.appearance?.eyeColor ?? 0,
  );
  return (
    <>
      <Section title={t("UI_FACE_FEATURES")}>
        <p className="text-[1.25vh] leading-[1.45] text-text-3">
          {t("UI_FACE_FEATURES_HINT")}
        </p>
        <div className="grid grid-cols-2 gap-x-[1.2vh] gap-y-[2.4vh]">
          {FACE_PLANES.map((plane) => (
            <FacePlane key={plane.key} plane={plane} />
          ))}
        </div>
        <div className="flex flex-col gap-[2vh] pt-[0.8vh]">
          {FACE_SLIDERS.map((slider) => (
            <FaceSlider key={slider.key} slider={slider} />
          ))}
        </div>
      </Section>
      <Section title={t("UI_EYE_COLOR")}>
        <Stepper
          label={t("UI_EYE_COLOR")}
          position={eyeColor}
          count={EYE_COLORS}
          onFocus={() => focusCamera("face")}
          onChange={(value) => dispatch(eyeColorSet(value))}
        />
      </Section>
    </>
  );
}

export function SkinTab() {
  const t = useLang();
  return (
    <Section title={t("UI_TAB_SKIN")}>
      {[
        OVERLAY.blemishes,
        OVERLAY.ageing,
        OVERLAY.complexion,
        OVERLAY.sunDamage,
        OVERLAY.moles,
        OVERLAY.bodyBlemishes,
      ].map((id) => (
        <OverlayControl key={id} id={id} />
      ))}
    </Section>
  );
}

export function MakeupTab() {
  const t = useLang();
  return (
    <Section title={t("UI_TAB_MAKEUP")}>
      {[OVERLAY.makeup, OVERLAY.blush, OVERLAY.lipstick].map((id) => (
        <OverlayControl key={id} id={id} />
      ))}
    </Section>
  );
}
