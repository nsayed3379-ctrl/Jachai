"use client";

import { useState } from "react";
import { businessApi } from "@/lib/api";
import { REPORT_REASON_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";

/** The "this listing has been flagged" banner + its "request review" action.
 *  Lifted from the old dashboard; now shown by the workspace layout on every section. */
export function FlaggedNotice({ business }: { business: BusinessResponse }) {
  const { show } = useToast();
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!business.flagged) return null;

  async function requestFlagReview() {
    setRequesting(true);
    try {
      await businessApi.requestFlagReview(business.id);
      setRequested(true);
      show("Admins have been notified and will take another look.", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3.5">
      <p className="text-sm font-semibold text-rose-700">⚠ This listing has been flagged</p>
      <p className="mt-1 text-sm text-rose-700/90">
        A user report against this listing was reviewed and confirmed for{" "}
        {business.flagReason
          ? REPORT_REASON_LABELS[business.flagReason] ?? business.flagReason
          : "a policy violation"}
        . A warning is now visible on your public listing. Please review and update your listing so it
        complies with our community guidelines.
      </p>
      <div className="mt-3">
        {requested ? (
          <p className="text-xs text-rose-700/80">
            ✓ Admins have been notified — this will be reviewed again shortly.
          </p>
        ) : (
          <Button size="sm" variant="outline" onClick={requestFlagReview} loading={requesting}>
            I&apos;ve fixed this — request review
          </Button>
        )}
      </div>
    </div>
  );
}
