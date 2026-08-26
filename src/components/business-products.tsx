"use client";

import { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import type { FeaturedProduct } from "@/lib/types";
import { errorMessage } from "@/lib/toast-context";
import { EmptyState, PageSpinner } from "./ui/misc";

/** Public "Featured products" showcase (retail). Showcase only — no cart. Fetches on mount. */
export function BusinessProducts({ businessId }: { businessId: string }) {
  const [products, setProducts] = useState<FeaturedProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .products(businessId)
      .then((rows) => !cancelled && setProducts(rows))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!products) return <PageSpinner />;
  if (products.length === 0) return <EmptyState title="No featured products yet" />;

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Featured products</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-ink-100 bg-white">
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoUrl} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="aspect-square w-full bg-ink-100" />
            )}
            <div className="p-2.5">
              <p className="text-sm font-semibold text-ink-900">{p.name}</p>
              {p.priceText && <p className="mt-0.5 text-xs font-medium text-crimson-700">{p.priceText}</p>}
              {p.description && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{p.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
