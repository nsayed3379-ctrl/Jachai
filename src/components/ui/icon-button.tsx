import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { buttonVariantClasses, type ButtonVariant } from "./button";

type Size = "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  /** Required, not optional — this button has no visible text for a screen reader to read. */
  "aria-label": string;
}

/**
 * Icon-only button that always keeps a 44×44px minimum hit area (Apple/Material's
 * recommended touch target), independent of however small the visible icon inside
 * it is (16-24px is typical) — the icon doesn't need its own padding math at each
 * call site. Reuses Button's variant → color mapping for visual consistency.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "sm", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full",
          interactiveTransition,
          focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "md" && "min-h-12 min-w-12",
          buttonVariantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
