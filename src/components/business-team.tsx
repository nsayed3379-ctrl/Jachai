"use client";

import { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import type { TeamMember } from "@/lib/types";
import { errorMessage } from "@/lib/toast-context";
import { EmptyState, PageSpinner } from "./ui/misc";

/** Public showcase for doctors / staff / trainers. Fetches on mount. */
export function BusinessTeam({ businessId, heading }: { businessId: string; heading: string }) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .team(businessId)
      .then((rows) => !cancelled && setMembers(rows))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!members) return <PageSpinner />;
  if (members.length === 0) return <EmptyState title="No one listed here yet" />;

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{heading}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {members.map((m) => (
          <div key={m.id} className="flex gap-3 rounded-xl border border-ink-100 bg-white p-3">
            {m.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.photoUrl} alt="" className="h-14 w-14 flex-none rounded-full border border-ink-200 object-cover" />
            ) : (
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-ink-100 text-lg font-semibold text-ink-400">
                {m.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">{m.name}</p>
              {m.role && <p className="text-xs font-medium text-crimson-700">{m.role}</p>}
              {m.bio && <p className="mt-1 text-xs leading-relaxed text-ink-500">{m.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
