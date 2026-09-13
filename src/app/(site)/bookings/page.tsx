"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bookingApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONE, formatBookingDate, formatBookingTime } from "@/lib/commerce";
import { errorMessage } from "@/lib/toast-context";
import type { Booking } from "@/lib/types";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

function BookingsContent() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBookings(null);
    bookingApi
      .mine(page, 20)
      .then((res) => {
        if (cancelled) return;
        setBookings(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error) return <ErrorBanner message={error} />;
  if (!bookings) return <PageSpinner />;

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold text-ink-900">My bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When you request an appointment with a business, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="block rounded-2xl border border-ink-100 bg-surface p-4 transition-colors hover:border-ink-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    {b.bookingNumber} · {b.businessName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {b.serviceName}
                    {b.staffName ? ` with ${b.staffName}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    {formatBookingDate(b.preferredDate)} · {formatBookingTime(b.preferredTime)}
                  </p>
                </div>
                <span className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold ${BOOKING_STATUS_TONE[b.status]}`}>
                  {BOOKING_STATUS_LABELS[b.status]}
                </span>
              </div>
            </Link>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <RoleGate>
      <BookingsContent />
    </RoleGate>
  );
}
