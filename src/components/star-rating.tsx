"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <div className={cn("flex text-gold-400", sizeClass)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "" : "text-ink-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div className="flex gap-1 text-3xl" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          className={cn(
            "transition-transform hover:scale-110",
            n <= active ? "text-gold-400" : "text-ink-200"
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
