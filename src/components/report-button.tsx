"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
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
        // unstyled — kept deliberately quiet (ink-400, not ghost's darker ink-700 default)
        // since Report is meant to stay low-priority, not compete visually with real actions.
        <Button
          variant="unstyled"
          size="sm"
          onClick={() => setOpen(true)}
          className="min-h-11 text-ink-400 hover:bg-rose-500/10 hover:text-rose-600"
        >
          <Flag size={14} strokeWidth={1.75} />
          Report
        </Button>
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
