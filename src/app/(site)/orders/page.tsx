"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { orderApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, formatTk } from "@/lib/commerce";
import { errorMessage } from "@/lib/toast-context";
import { timeAgo } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

function MyOrdersContent() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOrders(null);
    orderApi
      .mine(page, 20)
      .then((res) => {
        if (cancelled) return;
        setOrders(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error) return <ErrorBanner message={error} />;
  if (!orders) return <PageSpinner />;

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold text-ink-900">My orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you order from a business that takes direct orders, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="block rounded-2xl border border-ink-100 bg-surface p-4 transition-colors hover:border-ink-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    {o.orderNumber} · {o.businessName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    {o.items.map((i) => `${i.quantity}× ${i.itemName}`).join(", ")}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">{timeAgo(o.createdAt)}</p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_TONE[o.status]}`}
                  >
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                  <span className="text-sm font-bold text-ink-900">{formatTk(o.totalAmount)}</span>
                </div>
              </div>
            </Link>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <RoleGate>
      <MyOrdersContent />
    </RoleGate>
  );
}
