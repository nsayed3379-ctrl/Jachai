"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { orderApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  paymentMethodLabel,
  formatTk,
} from "@/lib/commerce";
import { errorMessage, useToast } from "@/lib/toast-context";
import { formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    orderApi
      .get(id)
      .then(setOrder)
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  useEffect(load, [load]);

  async function cancel() {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      setOrder(await orderApi.cancel(id));
      show("Order cancelled", "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorBanner message={error} />;
  if (!order) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/orders" className="text-sm text-ink-500 hover:underline">
        ← My orders
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink-900">{order.orderNumber}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_TONE[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-ink-400">
        <Link href={`/business/${order.businessSlug}`} className="hover:underline">
          {order.businessName}
        </Link>{" "}
        · {formatDateTime(order.createdAt)}
      </p>

      {order.status === "REJECTED" && order.rejectionReason && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Rejected: {order.rejectionReason}
        </p>
      )}

      {/* Items */}
      <section className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <ul className="divide-y divide-ink-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink-800">
                {i.quantity} × {i.itemName}
              </span>
              <span className="font-medium text-ink-900">{formatTk(i.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-sm">
          <Row label="Subtotal" value={formatTk(order.subtotal)} />
          {order.deliveryFee > 0 && <Row label="Delivery fee" value={formatTk(order.deliveryFee)} />}
          <Row label="Total" value={formatTk(order.totalAmount)} bold />
        </div>
      </section>

      {/* Fulfillment + payment */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-surface p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Fulfillment</p>
          <p className="mt-1 font-medium text-ink-900">{FULFILLMENT_LABELS[order.fulfillmentType]}</p>
          {order.fulfillmentType === "PICKUP" ? (
            <>
              <p className="mt-1 text-ink-600">{order.businessAddress}</p>
              <p className="text-ink-600">{order.businessPhone}</p>
            </>
          ) : (
            <>
              {order.deliveryAddress && <p className="mt-1 text-ink-600">{order.deliveryAddress}</p>}
              {order.deliveryDistanceKm != null && (
                <p className="mt-0.5 text-xs text-ink-400">{order.deliveryDistanceKm} km away</p>
              )}
            </>
          )}
          {order.estimatedReadyAt && (
            <p className="mt-1 text-xs font-medium text-crimson-700">
              {order.fulfillmentType === "PICKUP" ? "Ready for pickup by " : "Estimated by "}
              {formatDateTime(order.estimatedReadyAt)}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-ink-100 bg-surface p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Payment</p>
          <p className="mt-1 font-medium text-ink-900">{paymentMethodLabel(order.paymentMethod, order.fulfillmentType)}</p>
          <p className="mt-0.5 text-xs text-ink-400">{order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</p>
        </div>
      </section>

      {order.customerNote && (
        <p className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4 text-sm text-ink-600">
          <span className="font-semibold text-ink-800">Your note: </span>
          {order.customerNote}
        </p>
      )}

      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <section className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Progress</p>
          <ol className="space-y-2">
            {order.timeline.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-crimson-500" />
                <span className="text-ink-700">
                  {ORDER_STATUS_LABELS[e.toStatus]}
                  {e.note ? ` — ${e.note}` : ""}
                  <span className="ml-1.5 text-xs text-ink-400">{formatDateTime(e.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>
        {order.status === "PENDING" && (
          <Button variant="ghost" className="text-rose-600" onClick={cancel} loading={busy}>
            Cancel order
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink-900" : "text-ink-500"}>{label}</span>
      <span className={bold ? "font-bold text-ink-900" : "text-ink-700"}>{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RoleGate>
      <OrderDetailContent />
    </RoleGate>
  );
}
