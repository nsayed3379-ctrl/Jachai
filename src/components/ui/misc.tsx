import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-ink-100/70 bg-white shadow-card", className)}>
      {children}
    </div>
  );
}

type BadgeTone = "brand" | "gold" | "rose" | "neutral" | "crimson";

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  const toneClasses: Record<BadgeTone, string> = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    gold: "bg-gold-50 text-gold-700 border-gold-200",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    neutral: "bg-ink-50 text-ink-600 border-ink-200",
    crimson: "bg-crimson-50 text-crimson-700 border-crimson-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-5 w-5 text-crimson-600", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-ink-200 rounded-xl bg-sand-100/60">
      <p className="font-display text-lg text-ink-800">{title}</p>
      {description && <p className="mt-1.5 text-sm text-ink-500 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="px-4 py-1.5 text-sm font-medium rounded-full border border-ink-200 disabled:opacity-30 hover:border-crimson-300 hover:text-crimson-700"
      >
        Prev
      </button>
      <span className="text-sm text-ink-500 px-2">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="px-4 py-1.5 text-sm font-medium rounded-full border border-ink-200 disabled:opacity-30 hover:border-crimson-300 hover:text-crimson-700"
      >
        Next
      </button>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-600">
      {message}
    </div>
  );
}
