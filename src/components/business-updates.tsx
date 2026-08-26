"use client";

import { useEffect, useState } from "react";
import { updatesApi } from "@/lib/api";
import type { BusinessUpdate } from "@/lib/types";
import { errorMessage } from "@/lib/toast-context";
import { formatDate, timeAgo } from "@/lib/utils";
import { EmptyState, PageSpinner } from "./ui/misc";
import { Button } from "./ui/button";

/** Public "Updates" tab — published announcements, newest first, "Load more" paging. Fetches on mount. */
export function BusinessUpdates({ businessId }: { businessId: string }) {
  const [items, setItems] = useState<BusinessUpdate[] | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    updatesApi
      .publicList(businessId, 0)
      .then((res) => {
        if (cancelled) return;
        setItems(res.content);
        setTotalPages(res.totalPages);
        setPage(0);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await updatesApi.publicList(businessId, next);
      setItems((prev) => [...(prev ?? []), ...res.content]);
      setPage(next);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!items) return <PageSpinner />;
  if (items.length === 0) return <EmptyState title="No updates yet" />;

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Updates</h2>
      <ol className="space-y-4">
        {items.map((u) => (
          <li key={u.id} className="rounded-xl border border-ink-100 bg-white p-4">
            <p className="text-xs text-ink-400" title={formatDate(u.publishedAt ?? u.createdAt)}>
              {timeAgo(u.publishedAt ?? u.createdAt)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{u.body}</p>
            {u.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={u.imageUrl}
                alt=""
                loading="lazy"
                className="mt-3 max-h-80 w-full rounded-lg border border-ink-100 object-cover"
              />
            )}
          </li>
        ))}
      </ol>
      {page + 1 < totalPages && (
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={loadMore} loading={loadingMore}>
            Load more
          </Button>
        </div>
      )}
    </section>
  );
}
