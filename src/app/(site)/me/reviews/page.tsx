"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { reviewApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { errorMessage } from "@/lib/toast-context";
import { lookupBusiness } from "@/lib/business-cache";
import type { ReviewResponse } from "@/lib/types";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

function MyReviewsContent() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReviewResponse | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    reviewApi
      .mine(p, 10)
      .then((res) => {
        setReviews(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(0), [load]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-ink-900">My reviews</h1>
      <p className="mt-1 text-sm text-ink-500">
        Reviews you've submitted. You can edit or delete within 72 hours of posting.
      </p>

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && reviews.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="You haven't reviewed anything yet"
            description="Find a business and share your experience."
            action={
              <Link href="/" className="text-sm text-crimson-700 hover:underline">
                Browse businesses →
              </Link>
            }
          />
        </div>
      )}

      <div className="mt-4">
        {!loading &&
          !error &&
          reviews.map((r) => {
            const cached = lookupBusiness(r.businessId);
            return (
              <div key={r.id}>
                <p className="font-display font-bold text-ink-900 mb-1">
                  {cached ? (
                    <Link href={`/business/${cached.slug}`} className="hover:underline">
                      {cached.name}
                    </Link>
                  ) : (
                    `Business ${r.businessId.slice(0, 8)}`
                  )}
                </p>
                {editing?.id === r.id ? (
                  <ReviewForm
                    businessId={r.businessId}
                    editing={r}
                    onCancel={() => setEditing(null)}
                    onDone={() => {
                      setEditing(null);
                      load(page);
                    }}
                  />
                ) : (
                  <ReviewCard review={r} onChanged={() => load(page)} onEdit={setEditing} />
                )}
              </div>
            );
          })}
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => {
            setPage(p);
            load(p);
          }}
        />
      </div>
    </div>
  );
}

export default function MyReviewsPage() {
  return (
    <RoleGate>
      <MyReviewsContent />
    </RoleGate>
  );
}
