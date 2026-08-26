"use client";

import { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import type { ServiceOffering, ServiceSection } from "@/lib/types";
import { errorMessage } from "@/lib/toast-context";
import { EmptyState, PageSpinner } from "./ui/misc";

/**
 * Public showcase for the ServiceOffering list — services (GENERAL/SALON/CLINIC),
 * gym membership plans (section OFFERING), or gym facilities (section FACILITY,
 * rendered as a plain chip list since those have no price). Fetches on mount, so
 * the parent should only render it once its tab is opened.
 */
export function BusinessServiceShowcase({
  businessId,
  section = "OFFERING",
  heading,
}: {
  businessId: string;
  section?: ServiceSection;
  heading: string;
}) {
  const [items, setItems] = useState<ServiceOffering[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .services(businessId, section)
      .then((rows) => !cancelled && setItems(rows))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [businessId, section]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!items) return <PageSpinner />;
  if (items.length === 0) return <EmptyState title="Nothing listed here yet" />;

  if (section === "FACILITY") {
    return (
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{heading}</h2>
        <div className="flex flex-wrap gap-2">
          {items.map((f) => (
            <span key={f.id} className="rounded-full border border-ink-200 bg-white px-3 py-1 text-sm text-ink-700">
              {f.name}
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{heading}</h2>
      <ul className="divide-y divide-ink-100">
        {items.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">{s.name}</p>
              {s.description && <p className="mt-0.5 text-sm text-ink-500">{s.description}</p>}
            </div>
            {s.priceText && <p className="flex-none text-sm font-medium text-ink-700">{s.priceText}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
