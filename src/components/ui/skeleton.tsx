import { cn } from "@/lib/utils";

/**
 * Thin wrapper around the existing .skeleton shimmer background (globals.css) + the
 * animate-shimmer keyframe (tailwind.config.ts) — both already exist and are already used
 * ad hoc at ~15 call sites (heavily in app/page.tsx's loading state); this just gives them
 * a name instead of every call site repeating "skeleton animate-shimmer ...".
 */
export function Skeleton({ className }: { className?: string }) {
  // No default rounded-* here: cn() is plain clsx (no tailwind-merge in this project), so a
  // caller's own rounded-lg/rounded-full/etc in className could lose to a class defined here
  // depending on stylesheet source order, not JSX order. Radius is entirely opt-in per call site.
  return <div aria-hidden className={cn("skeleton animate-shimmer", className)} />;
}
