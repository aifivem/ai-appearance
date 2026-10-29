import type { ComponentProps } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

interface SliderProps extends ComponentProps<typeof SliderPrimitive.Root> {
  /** Value the accent fill grows from (a two-ended slider fills from its centre); default the minimum. */
  origin?: number;
}

/** Radix slider in Dark Minimal (docs/design.md): 0.6vh track, accent fill, white round thumb with a 2.8vh hit area. */
export function Slider({ className, origin, ...props }: SliderProps) {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const value = props.value?.[0] ?? min;
  const span = max - min || 1;
  const from = ((origin ?? min) - min) / span;
  const to = (value - min) / span;
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex h-[2vh] w-full cursor-pointer touch-none select-none items-center data-[disabled]:opacity-40", className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="relative h-[0.6vh] w-full grow overflow-hidden rounded-full bg-raised">
        {origin === undefined ? (
          <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-accent" />
        ) : (
          <span className="absolute h-full bg-accent" style={{ left: `${Math.min(from, to) * 100}%`, width: `${Math.abs(to - from) * 100}%` }} />
        )}
      </SliderPrimitive.Track>
      {origin !== undefined && <span aria-hidden className="pointer-events-none absolute h-[1.2vh] w-[2px] -ml-px bg-line-strong" style={{ left: `${from * 100}%` }} />}
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="relative z-[1] block size-[1.6vh] cursor-grab rounded-full bg-text outline-none transition-[box-shadow] duration-150 after:absolute after:-inset-[0.6vh] after:content-[''] hover:[box-shadow:0_0_0_0.4vh_rgba(var(--accent-rgb),0.2)] focus-visible:[box-shadow:0_0_0_0.4vh_rgba(var(--accent-rgb),0.4)] active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  );
}
