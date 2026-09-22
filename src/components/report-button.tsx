"use client";

import { useState } from "react";
import { reportApi } from "@/lib/api";
import { REPORT_REASON_LABELS } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { ReportReason, ReportTargetType } from "@/lib/types";
import { Button } from "./ui/button";
import { Select } from "./ui/field";
import { Modal } from "./ui/modal";

const REPORT_TARGET_NOUN: Record<ReportTargetType, string> = {
  REVIEW: "review",
  LISTING: "listing",
  COMMUNITY_POST: "post",
  COMMUNITY_COMMENT: "comment",
  OFFER: "offer",
};

export function ReportButton({
  targetType,
  targetId,
  trigger,
}: {
  targetType: ReportTargetType;
  targetId: string;
  /** Renders a custom trigger instead of the default text link — receives the "open the modal" callback. */
  trigger?: (openModal: () => void) => React.ReactNode;
}) {
  const { user } = useAuth();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) return null;

  async function submit() {
    setSubmitting(true);
    try {
      await reportApi.create(targetType, targetId, reason);
      setDone(true);
      show("Report submitted — thanks for flagging this.", "success");
      setTimeout(() => setOpen(false), 900);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-ink-400 hover:text-rose-600 inline-flex items-center gap-1"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 3v14M4 3h9l-1.5 3L13 9H4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Report
        </button>
      )}

      {/*
        Uses the shared, portal-based Modal (renders into document.body) —
        not a hand-rolled `fixed inset-0` div — so the modal still displays
        correctly even when <ReportButton> itself sits inside a menu/dropdown
        that gets visually hidden (or would otherwise unmount) the moment
        it's clicked. A plain inline overlay would have been torn down along
        with its hidden ancestor before ever painting.
      */}
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="report-modal-heading" panelClassName="max-w-sm">
        <div className="p-5">
          <h3 id="report-modal-heading" className="font-display font-semibold text-ink-900">
            Report this {REPORT_TARGET_NOUN[targetType]}
          </h3>
          {done ? (
            <p className="mt-3 text-sm text-crimson-700">Thanks — our moderation team will take a look.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-500">Pick the reason that fits best.</p>
              <Select className="mt-3" value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={submit} loading={submitting}>
                  Submit report
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
