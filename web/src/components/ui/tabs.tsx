import type { ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

/** Radix tabs as tgiann-clothing's category column: round dark icon buttons stacked, one dashed green ring slides to the open one. */
export const Tabs = TabsPrimitive.Root;

/** Button size plus the gap between buttons, in vh (the ring moves by this per index). */
const PITCH = 5.4;

interface TabsListProps extends ComponentProps<typeof TabsPrimitive.List> {
  /** Index of the open tab, for the sliding ring; -1 hides it. */
  active: number;
}

export function TabsList({ className, active, children, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={cn("relative flex flex-col gap-[1vh]", className)} {...props}>
      {children}
      {active >= 0 && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-[3] size-[4.4vh] rounded-full border-[0.2vh] border-dashed border-tgi-green"
          initial={false}
          animate={{ y: `${active * PITCH}vh` }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        />
      )}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-[2] flex size-[4.4vh] shrink-0 items-center justify-center rounded-full bg-black/60 text-[1.8vh] text-white/70 transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#101010B3] hover:text-white active:[transform:scale(0.92)] data-[state=active]:text-tgi-green",
        className,
      )}
      {...props}
    />
  );
}
