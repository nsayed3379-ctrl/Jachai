"use client";

import { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import type { Faq } from "@/lib/types";

/**
 * Public FAQ accordion — fetches on mount like BusinessProducts. Renders
 * nothing when empty (most businesses won't have set any yet) rather than an
 * EmptyState, since this section is mounted unconditionally next to About,
 * not behind a tab the visitor chose to open.
 */
export function BusinessFaq({ businessId }: { businessId: string }) {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .faqs(businessId)
      .then((rows) => !cancelled && setFaqs(rows))
      .catch(() => !cancelled && setFaqs([]));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink-900 mb-2">Frequently asked questions</h2>
      <div className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
        {faqs.map((f) => (
          <details key={f.id} className="group p-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink-900">
              {f.question}
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 flex-none text-ink-400 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600 leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
