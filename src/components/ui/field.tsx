import { cn } from "@/lib/utils";
import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";

const baseControl =
<<<<<<< HEAD
  "w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 " +
=======
  "w-full rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 " +
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
  "focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500 disabled:bg-ink-50 disabled:text-ink-300";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-xs font-medium uppercase tracking-wide text-ink-500 mb-1.5", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseControl, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseControl, "min-h-[96px] resize-y", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(baseControl, "pr-8 appearance-none bg-no-repeat bg-[right_0.6rem_center]", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-rose-600">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-ink-400">{children}</p>;
}
