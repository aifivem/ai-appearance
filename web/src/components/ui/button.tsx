import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../lib/utils";

/**
 * TGIANN buttons as in tgiann-clothing (docs/design.md): green `primary` with the display font for the view's one
 * main action, dark `secondary` over the game, round `icon` stepper arrow that turns green on hover.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[0.8vh] rounded-[0.6vh] px-[1.6vh] whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-out enabled:active:[transform:scale(0.97)] disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-tgi-green font-display font-extrabold text-tgi-green-text uppercase enabled:hover:bg-tgi-green-hover",
        secondary:
          "bg-black/55 font-medium text-white/80 enabled:hover:bg-white/15 enabled:hover:text-white",
        icon: "size-[3.4vh] shrink-0 rounded-full border border-white/30 px-0 text-[1.3vh] text-[#cbcbcb] enabled:hover:border-tgi-green enabled:hover:bg-tgi-green enabled:hover:text-tgi-green-text enabled:active:[transform:scale(0.9)]",
      },
      size: {
        md: "h-[4.6vh] text-[1.6vh]",
        sm: "h-[3.4vh] text-[1.3vh]",
      },
    },
    compoundVariants: [
      { variant: "icon", className: "h-[3.4vh] text-[1.3vh]" },
    ],
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

interface ButtonProps
  extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Shows a spinner next to the label and disables the button while an action runs. */
  busy?: boolean;
}

export function Button({
  className,
  variant,
  size,
  busy = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      data-slot="button"
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {busy && (
        <FontAwesomeIcon icon={faSpinner} spin data-icon="inline-start" />
      )}
      {children}
    </button>
  );
}
