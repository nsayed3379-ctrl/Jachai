"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { OFFER_CLAIM_STATUS_META } from "@/lib/offer-constants";
import { formatDateTime } from "@/lib/utils";
import type { OfferClaimResponse } from "@/lib/types";
import { Badge, Card } from "./ui/misc";

/**
 * In-store redemption code — the code itself is the source of truth (a
 * business staff member types it into the "Redeem a code" box), the QR is
 * just a faster way to hand it over. Same QRCode.toCanvas call already used
 * for Business QR (owner/[id]/qr/page.tsx) — no new dependency.
 */
export function RedemptionCodeCard({ claim }: { claim: OfferClaimResponse }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meta = OFFER_CLAIM_STATUS_META[claim.status];

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, claim.redemptionCode, { width: 160, margin: 1 }).catch(() => {});
    }
  }, [claim.redemptionCode]);

  return (
    <Card className="p-5 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Your offer code</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-ink-900">{claim.redemptionCode}</p>
      <div className="mt-3 flex justify-center">
        <canvas ref={canvasRef} className="h-auto max-w-full" />
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span className="text-xs text-ink-400">
          {claim.status === "REDEEMED" && claim.redeemedAt ? `Redeemed ${formatDateTime(claim.redeemedAt)}` : `Claimed ${formatDateTime(claim.claimedAt)}`}
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-400">Show this code (or QR) to {claim.businessName ?? "the business"} to redeem in-store.</p>
    </Card>
  );
}
