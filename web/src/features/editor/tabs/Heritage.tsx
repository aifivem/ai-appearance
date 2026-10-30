import { useState } from "react";
import type { Parent } from "../../../../../resource/common/nui";
import { LabeledSlider, Section } from "../../../components/controls";
import { useLang } from "../../../lib/lang";
import { cn } from "../../../lib/utils";
import { useAppDispatch, useAppSelector } from "../../../store";
import { headBlendSet } from "../../../store/editor";
import { focusCamera } from "../actions";

function Portrait({
  parent,
  selected,
  onPick,
}: {
  parent: Parent;
  selected: boolean;
  onPick: () => void;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={parent.name}
      onClick={onPick}
      className={cn(
        "flex aspect-square overflow-hidden rounded-[1vh] border transition-[border-color,background-color] duration-150 active:[transform:scale(0.96)]",
        selected
          ? "border-tgi-green bg-tgi-green-10"
          : "border-white/8 bg-white/3 hover:bg-white/6",
      )}
    >
      {broken ? (
        <span className="m-auto text-[1.4vh] font-semibold text-text-2">
          {parent.name.slice(0, 2)}
        </span>
      ) : (
        <img
          src={`https://nui-img/${parent.image}`}
          alt=""
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </button>
  );
}

interface GridProps {
  title: string;
  parents: Parent[];
  value: number;
  onPick: (id: number) => void;
}

function ParentGrid({ title, parents, value, onPick }: GridProps) {
  const name = parents.find((p) => p.id === value)?.name ?? "";
  return (
    <section className="flex flex-col gap-[1.4vh] border-b border-white/10 pb-[2vh]">
      <h3 className="flex items-baseline justify-between gap-[1vh]">
        <span className="font-display text-[1.6vh] leading-none font-extrabold tracking-[-0.01em] uppercase">
          {title}
        </span>
        <span className="truncate text-[1.4vh] text-tgi-green">{name}</span>
      </h3>
      <div
        role="radiogroup"
        aria-label={title}
        className="grid grid-cols-6 gap-[0.8vh]"
      >
        {parents.map((parent) => (
          <Portrait
            key={parent.id}
            parent={parent}
            selected={parent.id === value}
            onPick={() => onPick(parent.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function HeritageTab() {
  const t = useLang();
  const dispatch = useAppDispatch();
  const mothers = useAppSelector((state) => state.editor.data?.mothers ?? []);
  const fathers = useAppSelector((state) => state.editor.data?.fathers ?? []);
  const hb = useAppSelector((state) => state.editor.appearance?.headBlend);
  if (!hb) return null;
  const focus = () => focusCamera("face");
  return (
    <>
      <ParentGrid
        title={t("UI_MOTHER")}
        parents={mothers}
        value={hb.mother}
        onPick={(value) => dispatch(headBlendSet({ field: "mother", value }))}
      />
      <ParentGrid
        title={t("UI_FATHER")}
        parents={fathers}
        value={hb.father}
        onPick={(value) => dispatch(headBlendSet({ field: "father", value }))}
      />
      <Section title={t("UI_TAB_HERITAGE")}>
        <LabeledSlider
          label={t("UI_RESEMBLANCE")}
          value={hb.shapeMix}
          min={0}
          max={100}
          onFocus={focus}
          display={`${hb.shapeMix}%`}
          onChange={(value) =>
            dispatch(headBlendSet({ field: "shapeMix", value }))
          }
        />
        <LabeledSlider
          label={t("UI_SKIN_TONE")}
          value={hb.skinMix}
          min={0}
          max={100}
          onFocus={focus}
          display={`${hb.skinMix}%`}
          onChange={(value) =>
            dispatch(headBlendSet({ field: "skinMix", value }))
          }
        />
      </Section>
    </>
  );
}
