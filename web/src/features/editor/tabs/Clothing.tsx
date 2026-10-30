import type { CameraZone } from "../../../../../resource/common/nui";
import { Section } from "../../../components/controls";
import { useLang } from "../../../lib/lang";
import { DrawableControl } from "./Drawable";

const COMPONENTS: Array<{ id: number; zone: CameraZone }> = [
  { id: 11, zone: "upper" },
  { id: 8, zone: "upper" },
  { id: 3, zone: "upper" },
  { id: 4, zone: "body" },
  { id: 6, zone: "feet" },
  { id: 5, zone: "upper" },
  { id: 7, zone: "upper" },
  { id: 9, zone: "upper" },
  { id: 10, zone: "upper" },
];
const ACCESSORIES: Array<{
  kind: "components" | "props";
  id: number;
  zone: CameraZone;
}> = [
  { kind: "props", id: 0, zone: "head" },
  { kind: "props", id: 1, zone: "head" },
  { kind: "components", id: 1, zone: "head" },
  { kind: "props", id: 2, zone: "head" },
  { kind: "props", id: 6, zone: "upper" },
  { kind: "props", id: 7, zone: "upper" },
];

export function ClothingTab() {
  const t = useLang();
  return (
    <>
      {COMPONENTS.map(({ id, zone }) => (
        <Section key={id} title={t(`UI_COMPONENT_${id}`)}>
          <DrawableControl
            kind="components"
            id={id}
            label={t("UI_STYLE")}
            zone={zone}
          />
        </Section>
      ))}
    </>
  );
}

export function AccessoriesTab() {
  const t = useLang();
  return (
    <>
      {ACCESSORIES.map(({ kind, id, zone }) => (
        <Section
          key={`${kind}${id}`}
          title={t(kind === "props" ? `UI_PROP_${id}` : `UI_COMPONENT_${id}`)}
        >
          <DrawableControl
            kind={kind}
            id={id}
            label={t("UI_STYLE")}
            zone={zone}
          />
        </Section>
      ))}
    </>
  );
}
