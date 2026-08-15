"use client";

import { useEffect, useRef, useState } from "react";
import { businessApi } from "@/lib/api";
import type { BusinessResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The main search box's text field + live suggestions dropdown. Reuses the
 * same free-text business search (word_similarity-ranked) that powers the
 * "is my business already listed" check in the Add Business flow — one
 * backend search capability, two different front-ends over it.
 */
export function SearchQueryInput({
  value,
  onChange,
  onSubmit,
  inputClassName,
  placeholder = "What are you looking for?",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  inputClassName: string;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<BusinessResponse[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      businessApi
        .potentialDuplicates(q)
        .then((results) => setSuggestions(results.slice(0, 6)))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function pick(name: string) {
    onChange(name);
    setOpen(false);
    onSubmit();
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setOpen(false);
              onSubmit();
            }
          }}
          placeholder={placeholder}
          className={cn("pl-10", inputClassName)}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-ink-100 bg-surface p-1.5 shadow-pop">
          {suggestions.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => pick(b.name)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-ink-50 transition-colors truncate"
            >
              <span className="font-medium text-ink-900">{b.name}</span>
              <span className="text-ink-400"> — {b.areaName}, {b.cityName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
