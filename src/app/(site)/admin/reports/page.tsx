"use client";

import { useCallback, useEffect, useState } from "react";
import { reportApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { REPORT_REASON_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import { formatDateTime, truncateId } from "@/lib/utils";
import type { Report } from "@/lib/types";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

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

  async function resolve(id: string) {
    const notes = prompt("Resolution notes (optional):") ?? "";
    setResolving(id);
    try {
      await reportApi.resolve(id, notes);
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
      <p className="text-sm text-ink-500 mb-6">Reported reviews and listings awaiting review.</p>
      <AdminNav />

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && reports.length === 0 && <EmptyState title="No pending reports" />}
      {!loading && !error && reports.length > 0 && (
        <div className="rounded-md border border-ink-100 bg-white shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 uppercase tracking-wide">
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Reporter</th>
                <th className="px-4 py-2.5">Filed</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {r.targetType}: {truncateId(r.targetId, 10)}…
                  </td>
                  <td className="px-4 py-2.5">{REPORT_REASON_LABELS[r.reason]}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{truncateId(r.reporterUserId, 10)}…</td>
                  <td className="px-4 py-2.5 text-xs text-ink-400">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.status === "PENDING" ? "gold" : "brand"}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.status === "PENDING" && (
                      <Button size="sm" variant="outline" onClick={() => resolve(r.id)} loading={resolving === r.id}>
                        Resolve
                      </Button>
                    )}
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
