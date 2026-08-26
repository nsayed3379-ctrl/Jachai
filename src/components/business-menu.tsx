"use client";

import { useEffect, useMemo, useState } from "react";
import { catalogApi } from "@/lib/api";
import type { MenuItem } from "@/lib/types";
import { errorMessage } from "@/lib/toast-context";
import { EmptyState, PageSpinner } from "./ui/misc";

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {item.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photoUrl} alt="" className="h-14 w-14 flex-none rounded-lg border border-ink-200 object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">
            {item.name}
            {item.popular && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                ★
              </span>
            )}
          </p>
          {item.priceText && <p className="flex-none text-sm font-medium text-ink-700">{item.priceText}</p>}
        </div>
        {item.description && <p className="mt-0.5 text-sm text-ink-500">{item.description}</p>}
      </div>
    </li>
  );
}

/**
 * Public restaurant menu. Shows a "Popular items" strip first (if any), then the
 * full menu grouped by the free-text `menuSection` label. Fetches on mount.
 */
export function BusinessMenu({ businessId }: { businessId: string }) {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .menuItems(businessId)
      .then((rows) => !cancelled && setItems(rows))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const groups = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of items ?? []) {
      const key = it.menuSection?.trim() || "Menu";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!items) return <PageSpinner />;
  if (items.length === 0) return <EmptyState title="No menu items yet" />;

  const popular = items.filter((i) => i.popular);
  const collapsed = popular.length > 0 && !showFull;

  return (
    <div className="space-y-6">
      {popular.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">Popular items</h2>
          <ul className="divide-y divide-ink-100">
            {popular.map((it) => (
              <MenuRow key={it.id} item={it} />
            ))}
          </ul>
        </section>
      )}

      {collapsed ? (
        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="text-sm font-semibold text-crimson-700 hover:underline"
        >
          View full menu ({items.length} items)
        </button>
      ) : (
        groups.map(([section, rows]) => (
          <section key={section}>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{section}</h2>
            <ul className="divide-y divide-ink-100">
              {rows.map((it) => (
                <MenuRow key={it.id} item={it} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
