"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
import { useOwnerBusiness } from "@/lib/owner-business-context";
import { canBook } from "@/lib/commerce";
import { errorMessage } from "@/lib/toast-context";
import type { ServiceOffering, TeamMember } from "@/lib/types";
import { StaffScheduleEditor } from "@/components/owner/staff-schedule-editor";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export default function OwnerStaffSchedulePage() {
  const { business } = useOwnerBusiness();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [services, setServices] = useState<ServiceOffering[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([catalogApi.team(business.id), catalogApi.services(business.id, "OFFERING")])
      .then(([t, s]) => {
        setTeam(t);
        setServices(s);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [business.id]);

  if (!canBook(business.categoryKind)) {
    return (
      <div className="rounded-xl border border-ink-100 bg-white p-6 text-center">
        <p className="text-sm text-ink-500">Staff scheduling isn&apos;t available for this business type yet.</p>
        <Link href={`/owner/${business.id}`} className="mt-2 inline-block text-sm font-medium text-crimson-700 hover:underline">
          ← Back to Overview
        </Link>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!team || !services) return <PageSpinner />;

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-ink-900">Staff schedules</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Which services each staff member provides, their weekly working hours, breaks, and time off — this is what
          powers the real appointment slots customers see.
        </p>
      </div>

      {team.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Add staff members under Staff first, then come back here to set up their schedule."
        />
      ) : (
        <div className="space-y-2">
          {team.map((t) => {
            const open = openId === t.id;
            return (
              <div key={t.id} className="rounded-2xl border border-ink-100 bg-surface p-4">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : t.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {t.name}
                      {!t.active && <span className="ml-1.5 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">Inactive</span>}
                    </p>
                    {t.role && <p className="text-xs text-ink-500">{t.role}</p>}
                  </div>
                  <svg
                    viewBox="0 0 20 20"
                    className={cn("h-4 w-4 flex-none text-ink-400 transition-transform", open && "rotate-180")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {open && (
                  <div className="mt-4 border-t border-ink-100 pt-4">
                    <StaffScheduleEditor businessId={business.id} staff={t} services={services} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
