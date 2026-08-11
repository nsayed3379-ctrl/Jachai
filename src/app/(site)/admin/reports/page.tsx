"use client";

import { useCallback, useEffect, useState } from "react";
import { reportApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { REPORT_REASON_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn, formatDateTime, truncateId } from "@/lib/utils";
import type { Report, ReportStatus } from "@/lib/types";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

const OUTCOMES: { value: Exclude<ReportStatus, "PENDING">; label: string; variant: "danger" | "outline" }[] = [
  { value: "ACTION_TAKEN", label: "Action taken", variant: "danger" },
  { value: "DISMISSED", label: "Dismissed", variant: "outline" },
  { value: "DUPLICATE", label: "Duplicate", variant: "outline" },
];

function ReportsContent() {
  const { show } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    reportApi
      .queue(p, 20)
      .then((res) => {
        setReports(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(0), [load]);

  async function resolve(id: string, outcome: Exclude<ReportStatus, "PENDING">) {
    const resolutionNote = prompt("Resolution note (optional, internal only — never shown to the reporter):") ?? "";
    setResolving(id);
    try {
      await reportApi.resolve(id, outcome, resolutionNote);
      show("Report resolved", "success");
      load(page);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setResolving(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Moderation</h1>
      <p className="text-sm text-ink-500 mb-6">
        Reported reviews and listings awaiting review. Auto-triaged by priority; each has a 48h SLA.
      </p>
      <AdminNav />

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && reports.length === 0 && <EmptyState title="No pending reports" />}
      {!loading && !error && reports.length > 0 && (
        <div className="rounded-md border border-ink-100 bg-surface shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 uppercase tracking-wide">
                <th className="px-4 py-2.5">Ref</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Reporter</th>
                <th className="px-4 py-2.5">Filed / Due</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className={cn("border-b border-ink-50 last:border-0", r.isOverdue && "bg-rose-500/5")}>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.referenceCode}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.priority === "HIGH" ? "rose" : "neutral"}>{r.priority}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {r.targetType}: {truncateId(r.targetId, 10)}…
                  </td>
                  <td className="px-4 py-2.5">{REPORT_REASON_LABELS[r.reason]}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{truncateId(r.reporterUserId, 10)}…</td>
                  <td className="px-4 py-2.5 text-xs">
                    <div className="text-ink-400">{formatDateTime(r.createdAt)}</div>
                    <div className={cn(r.isOverdue ? "text-rose-600 font-semibold" : "text-ink-400")}>
                      Due {formatDateTime(r.dueAt)}
                      {r.isOverdue && " · OVERDUE"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {OUTCOMES.map((o) => (
                        <Button
                          key={o.value}
                          size="sm"
                          variant={o.variant}
                          onClick={() => resolve(r.id, o.value)}
                          loading={resolving === r.id}
                        >
                          {o.label}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <ReportsContent />
    </RoleGate>
  );
}
