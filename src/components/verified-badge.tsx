import { cn } from "@/lib/utils";

/**
 * The platform's signature trust mark — a seal-in-shield motif reused
 * anywhere a business's NID-verified status is shown (spec §8). Deliberately
 * distinct from a generic checkmark-in-circle so it reads as an official
 * verification, not a social-media "blue check".
 */
export function VerifiedBadge({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-brand-700 text-white pl-1 pr-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        className
      )}
      title="NID-verified business"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
        <path
          d="M10 2 L16.5 4.5 V9.8 C16.5 13.7 13.7 16.7 10 18 C6.3 16.7 3.5 13.7 3.5 9.8 V4.5 Z"
          fill="currentColor"
          opacity="0.25"
        />
        <path
          d="M10 2 L16.5 4.5 V9.8 C16.5 13.7 13.7 16.7 10 18 C6.3 16.7 3.5 13.7 3.5 9.8 V4.5 Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <path d="M7 9.8 L9.1 12 L13.2 7.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && "Verified"}
    </span>
  );
}
