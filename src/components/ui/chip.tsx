import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** md (default) hits the 44px touch-target minimum — use for primary pickers (time slots,
   *  filters people tap deliberately). sm stays compact for dense inline rows (sort pills). */
  size?: "sm" | "md";
}

/**
 * Toggleable filter/sort pill — distinct from Badge (ui/misc.tsx), which is a static label
 * with no interaction. This is the "rounded-full border px-3 py-1.5 text-xs font-semibold"
 * active/inactive toggle pattern already hand-rolled several times across the app (owner
 * review filters, business-form brand picker, checkout); this consolidates it going forward.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, size = "sm", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "md" ? "min-h-11 px-4 text-sm" : "px-3 py-1.5 text-xs",
          active
            ? "border-crimson-500 bg-crimson-50 text-crimson-700"
            : "border-ink-200 text-ink-600 hover:border-ink-300",
          className
        )}
        aria-pressed={active}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Chip.displayName = "Chip";
