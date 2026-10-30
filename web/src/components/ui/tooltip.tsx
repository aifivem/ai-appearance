import type { ComponentProps } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

/** Radix tooltip, TGIANN floating surface (tgiann-ui components.md): #161616, ring, small text, no arrow. */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[80] max-w-[24vh] animate-fade rounded-[0.6vh] bg-float px-[0.8vh] py-[0.4vh] text-[1.2vh] text-white/90 [box-shadow:0_0_0_1px_rgba(255,255,255,0.08),0_0.4vh_1.2vh_rgba(0,0,0,0.4)]",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
