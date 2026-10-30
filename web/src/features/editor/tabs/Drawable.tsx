import type { CameraZone } from "../../../../../resource/common/nui";
import { PAIR_GRID, Stepper } from "../../../components/controls";
import { useLang } from "../../../lib/lang";
import { useAppDispatch, useAppSelector } from "../../../store";
import { drawableSet } from "../../../store/editor";
import { focusCamera } from "../actions";

interface Props {
  kind: "components" | "props";
  id: number;
  label: string;
  zone: CameraZone;
}

/** One clothing slot: style over every collection's items (props start with "none"), then its variant. */
export function DrawableControl({ kind, id, label, zone }: Props) {
  const t = useLang();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.editor.data?.[kind][id]);
  const current = useAppSelector(
    (state) => state.editor.appearance?.[kind][id],
  );
  if (!current || !items) return null;
  const none = kind === "props";
  const found = items.findIndex(
    (item) => item.c === current.collection && item.i === current.index,
  );
  const position = found < 0 ? 0 : found + (none ? 1 : 0);
  const item = found < 0 ? undefined : items[found];
  const focus = () => focusCamera(zone);

  const pick = (next: number) => {
    const chosen = items[next - (none ? 1 : 0)];
    const value = chosen
      ? { collection: chosen.c, index: chosen.i, texture: 0 }
      : { collection: "", index: -1, texture: 0 };
    dispatch(drawableSet({ kind, id, value }));
  };

  return (
    <div className={PAIR_GRID}>
      <Stepper
        label={label}
        position={position}
        count={items.length + (none ? 1 : 0)}
        onChange={pick}
        onFocus={focus}
        display={none && position === 0 ? t("UI_NONE") : undefined}
      />
      {item && item.t > 1 && (
        <Stepper
          label={t("UI_TEXTURE")}
          position={current.texture}
          count={item.t}
          onFocus={focus}
          onChange={(texture) =>
            dispatch(drawableSet({ kind, id, value: { ...current, texture } }))
          }
        />
      )}
    </div>
  );
}
