import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-crimson-600 text-white shadow-sm hover:bg-crimson-700 active:bg-crimson-800 disabled:bg-ink-200",
  secondary: "bg-gold-400 text-ink-900 hover:bg-gold-500 disabled:bg-ink-100",
<<<<<<< HEAD
  outline: "border border-ink-200 text-ink-800 bg-white hover:border-crimson-300 hover:text-crimson-700 disabled:text-ink-300",
=======
  outline: "border border-ink-200 text-ink-800 bg-surface hover:border-crimson-300 hover:text-crimson-700 disabled:text-ink-300",
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
  ghost: "text-ink-700 hover:bg-ink-100 disabled:text-ink-300",
  danger: "bg-rose-500 text-white hover:bg-rose-600 disabled:bg-ink-200",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3.5 py-1.5 gap-1.5",
  md: "text-sm px-5 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
          "disabled:cursor-not-allowed disabled:shadow-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
