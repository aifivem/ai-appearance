import type { ComponentProps } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

interface SliderProps extends ComponentProps<typeof SliderPrimitive.Root> {
  /** Value the accent fill grows from (a two-ended slider fills from its centre); default the minimum. */
  origin?: number;
}

/** Radix slider, TGIANN look: 0.6vh white-alpha track, green fill, white round thumb with a 2.8vh hit area. */
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
      className={cn(
        "relative flex h-[2vh] w-full cursor-pointer touch-none items-center select-none data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-[0.6vh] w-full grow overflow-hidden rounded-full bg-white/12"
      >
        {origin === undefined ? (
          <SliderPrimitive.Range
            data-slot="slider-range"
            className="absolute h-full bg-tgi-green"
          />
        ) : (
          <span
            className="absolute h-full bg-tgi-green"
            style={{
              left: `${Math.min(from, to) * 100}%`,
              width: `${Math.abs(to - from) * 100}%`,
            }}
          />
        )}
      </SliderPrimitive.Track>
      {origin !== undefined && (
        <span
          aria-hidden
          className="pointer-events-none absolute -ml-px h-[1.2vh] w-[2px] bg-white/40"
          style={{ left: `${from * 100}%` }}
        />
      )}
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="relative z-[1] block size-[1.6vh] cursor-grab rounded-full bg-white transition-[box-shadow] duration-150 outline-none after:absolute after:-inset-[0.6vh] after:content-[''] hover:[box-shadow:0_0_0_0.4vh_var(--green-20)] active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  );
}
