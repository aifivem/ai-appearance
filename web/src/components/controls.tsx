import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

/** Editor form pieces built on the ui/ primitives: section card, labelled slider, item stepper, colour grid. */

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[1.2vh]">
      <h3 className="text-[1.2vh] font-medium uppercase tracking-[0.24em] text-text-3">{title}</h3>
      <div className="flex flex-col gap-[1.6vh] rounded-[1vh] border border-line bg-panel p-[1.6vh]">{children}</div>
    </section>
  );
}

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
    <div className="flex flex-col gap-[0.6vh]" onPointerDown={onFocus}>
      <span className="flex justify-between text-[1.3vh]">
        <span className="text-text-2">{label}</span>
        <span className="tabular-nums text-text">{display ?? value}</span>
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

/** An item index: arrows wrap around, the slider under it jumps through long lists. */
export function Stepper({ label, position, count, onChange, display, onFocus }: StepperProps) {
  const step = (by: number) => onChange((position + by + count) % count);
  return (
    <div className="flex flex-col gap-[0.6vh]" onPointerDown={onFocus}>
      <div className="flex items-center gap-[0.8vh]">
        <span className="min-w-0 flex-1 truncate text-[1.3vh] leading-[1.3] text-text-2">{label}</span>
        <Button variant="icon" aria-label={`${label} -1`} disabled={count < 2} onClick={() => step(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>
        <span className="min-w-[8vh] text-center text-[1.3vh] tabular-nums text-text">{display ?? `${position + 1} / ${count}`}</span>
        <Button variant="icon" aria-label={`${label} +1`} disabled={count < 2} onClick={() => step(1)}>
          <FontAwesomeIcon icon={faChevronRight} />
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
      <span className="text-[1.3vh] text-text-2">{label}</span>
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
              "relative aspect-square rounded-[0.4vh] border transition-[box-shadow] duration-150 before:absolute before:-inset-[0.25vh] before:content-['']",
              index === value ? "border-accent [box-shadow:0_0_0_1px_var(--accent)]" : "border-line hover:border-line-strong",
            )}
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
}
