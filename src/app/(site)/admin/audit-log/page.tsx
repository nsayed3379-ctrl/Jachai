"use client";

import { useState } from "react";
import { moderationApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { errorMessage } from "@/lib/toast-context";
import { formatDateTime, truncateId } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";

const ENTITY_TYPES = ["REPORT", "NID_VERIFICATION", "REVIEW", "BUSINESS_CLAIM"];

function AuditLogContent() {
  const [entityType, setEntityType] = useState(ENTITY_TYPES[0]);
  const [entityId, setEntityId] = useState("");
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!entityId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await moderationApi.auditLog(entityType, entityId.trim(), 0, 50);
      setLogs(res.content);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Moderation</h1>
      <p className="text-sm text-ink-500 mb-6">
        Audit trail lookup — the backend scopes this per entity, so search by type + id rather than
        browsing a global feed.
      </p>
      <AdminNav />

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <Label>Entity type</Label>
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 min-w-[16rem]">
          <Label>Entity ID (UUID)</Label>
          <Input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="e.g. from a report or NID row above" />
        </div>
        <Button onClick={search} loading={loading}>
          Search
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <PageSpinner />}
      {!loading && logs !== null && logs.length === 0 && <EmptyState title="No audit entries for that entity" />}
      {!loading && logs !== null && logs.length > 0 && (
        <div className="rounded-md border border-ink-100 bg-surface shadow-card divide-y divide-ink-100">
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink-800">{l.action}</p>
                {l.notes && <p className="text-xs text-ink-500 mt-0.5">{l.notes}</p>}
                <p className="text-xs text-ink-400 mt-1">
                  by admin {truncateId(l.performedByAdmin, 10)}… · {formatDateTime(l.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAuditLogPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <AuditLogContent />
    </RoleGate>
  );
}
