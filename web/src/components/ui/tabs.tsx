import type { ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

/** Radix tabs in Dark Minimal (docs/design.md "Tabs"): equal cells in a `--line` frame, one accent underline that slides. */
export const Tabs = TabsPrimitive.Root;

interface TabsListProps extends ComponentProps<typeof TabsPrimitive.List> {
  /** Index of the active cell and the cell count, for the sliding underline. */
  active: number;
  count: number;
}

export function TabsList({ className, active, count, children, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={cn("relative flex rounded-[0.6vh] border border-line", className)} {...props}>
      {children}
      {active >= 0 && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 z-[1] flex h-[0.2vh] justify-center"
          style={{ width: `${100 / count}%` }}
          initial={false}
          animate={{ x: `${active * 100}%` }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        >
          <span className="h-full w-[60%] rounded-full bg-accent" />
        </motion.span>
      )}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-[2] flex min-w-0 flex-1 flex-col items-center gap-[0.5vh] py-[1vh] text-[1.1vh] text-text-3 transition-colors duration-150 hover:text-text-2 data-[state=active]:font-medium data-[state=active]:text-accent",
        className,
      )}
      {...props}
    />
  );
}
