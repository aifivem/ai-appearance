import type { ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

/** Radix tabs as tgiann-clothing's category column: dark label pills with a round icon, one dashed green ring slides to the open one. */
export const Tabs = TabsPrimitive.Root;

/** Pill height plus the gap between pills, in vh (the ring moves by this per index). */
const PITCH = 5.2;

interface TabsListProps extends ComponentProps<typeof TabsPrimitive.List> {
  /** Index of the open tab, for the sliding ring; -1 hides it. */
  active: number;
}

export function TabsList({
  className,
  active,
  children,
  ...props
}: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative flex w-[17vh] flex-col gap-[0.8vh]", className)}
      {...props}
    >
      {children}
      {active >= 0 && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-[3] h-[4.4vh] w-full rounded-full border-[0.2vh] border-dashed border-tgi-green"
          initial={false}
          animate={{ y: `${active * PITCH}vh` }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        />
      )}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group relative z-[2] flex h-[4.4vh] w-full shrink-0 items-center justify-end gap-[1vh] rounded-full bg-black/60 pr-[0.4vh] pl-[1.6vh] text-[1.4vh] font-semibold text-white/70 transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#101010B3] hover:text-white active:[transform:scale(0.96)] data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}
