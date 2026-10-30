import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

/** Editor form pieces built on the ui/ primitives, in tgiann-clothing's menu look: section, labelled slider, stepper, colour grid. */

/** One menu section: display-font title, its controls, a hairline under it (none after the last). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[1.4vh] border-b border-white/10 pb-[2vh] last:border-b-0">
      <h3 className="font-display font-extrabold text-[1.6vh] uppercase leading-none tracking-[-0.01em]">{title}</h3>
      <div className="flex flex-col gap-[1.6vh]">{children}</div>
    </section>
  );
}

/** Two controls side by side with a hairline between them; a lone one takes the whole row. */
export const PAIR_GRID =
  "grid grid-cols-2 gap-x-[1vh] gap-y-[1.6vh] [&>*:last-child:nth-child(odd)]:col-span-full [&>*:nth-child(odd):not(:last-child)]:border-r [&>*:nth-child(odd):not(:last-child)]:border-white/10 [&>*:nth-child(odd):not(:last-child)]:pr-[1vh]";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  display?: string;
  onFocus?: () => void;
}

export function LabeledSlider({ label, value, min, max, onChange, display, onFocus }: LabeledSliderProps) {
  return (
    <div className="flex flex-col gap-[0.8vh]" onPointerDown={onFocus}>
      <span className="flex items-baseline justify-between text-[1.4vh]">
        <span className="text-white/90">{label}</span>
        <span className="text-[1.3vh] tabular-nums text-tgi-green">{display ?? value}</span>
      </span>
      <Slider aria-label={label} min={min} max={max} step={1} value={[value]} disabled={max <= min} onValueChange={([v]) => v !== undefined && onChange(v)} />
    </div>
  );
}

interface StepperProps {
  label: string;
  /** Position 0..count-1. */
  position: number;
  count: number;
  onChange: (position: number) => void;
  display?: string;
  onFocus?: () => void;
}

/** An item index: round arrows wrap around, "11 / 18" with the label under it, the slider below jumps through long lists. */
export function Stepper({ label, position, count, onChange, display, onFocus }: StepperProps) {
  const step = (by: number) => onChange((position + by + count) % count);
  return (
    <div className="flex min-w-0 flex-col gap-[1vh]" onPointerDown={onFocus}>
      <div className="flex items-center gap-[0.8vh]">
        <Button variant="icon" aria-label={`${label} -1`} disabled={count < 2} onClick={() => step(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-[0.2vh]">
          <span className="text-[1.6vh] tabular-nums leading-[1.3]">
            {display ?? (
              <>
                <span className="text-tgi-green">{position + 1}</span>
                <span className="text-text-2"> / {count}</span>
              </>
            )}
          </span>
          <span className="max-w-full truncate text-[1.2vh] leading-[1.3] text-text-2">{label}</span>
        </div>
        <Button variant="icon" aria-label={`${label} +1`} disabled={count < 2} onClick={() => step(1)}>
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
      {count > 2 && (
        <Slider aria-label={label} min={0} max={count - 1} step={1} value={[position]} onValueChange={([v]) => v !== undefined && onChange(v)} />
      )}
    </div>
  );
}

interface ColorGridProps {
  label: string;
  colors: string[];
  value: number;
  onChange: (index: number) => void;
}

export function ColorGrid({ label, colors, value, onChange }: ColorGridProps) {
  return (
    <div className="flex flex-col gap-[0.8vh]">
      <span className="text-[1.4vh] text-white/90">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-[repeat(16,1fr)] gap-[0.5vh]">
        {colors.map((color, index) => (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={index === value}
            aria-label={`${label} ${index + 1}`}
            onClick={() => onChange(index)}
            className={cn(
              "relative aspect-square rounded-full border transition-[box-shadow,border-color] duration-150 before:absolute before:-inset-[0.25vh] before:content-['']",
              index === value ? "border-tgi-green [box-shadow:0_0_0_0.2vh_var(--green)]" : "border-white/15 hover:border-white/50",
            )}
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
}
