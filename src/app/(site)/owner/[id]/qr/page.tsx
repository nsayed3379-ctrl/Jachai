"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { qrApi } from "@/lib/api";
import { useOwnerBusiness } from "@/lib/owner-business-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { QrInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, ErrorBanner, PageSpinner } from "@/components/ui/misc";

/** Keeps only characters safe in a downloaded filename across OSes. */
function safeFilenamePart(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

/**
 * Business QR V1 — one permanent QR that opens this business's existing
 * public page (`/business/[slug]`) via the `/q/[token]` redirect route. The
 * QR image itself is generated client-side from the public URL; the backend
 * only ever hands out the opaque token (`qrApi.mine`).
 */
export default function OwnerQrPage() {
  const { business } = useOwnerBusiness();
  const { show } = useToast();

  const [qr, setQr] = useState<QrInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    qrApi
      .mine(business.id)
      .then((res) => !cancelled && setQr(res))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  const qrUrl = qr && typeof window !== "undefined" ? `${window.location.origin}/q/${qr.qrToken}` : null;

  useEffect(() => {
    if (!qrUrl) return;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, { width: 240, margin: 1 }).catch(() => {});
    }
    if (printCanvasRef.current) {
      QRCode.toCanvas(printCanvasRef.current, qrUrl, { width: 320, margin: 1 }).catch(() => {});
    }
  }, [qrUrl]);

  function downloadPng() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `jachai-business-qr-${safeFilenamePart(business.slug)}.png`;
    a.click();
  }

  async function downloadSvg() {
    if (!qrUrl) return;
    try {
      const svg = await QRCode.toString(qrUrl, { type: "svg", margin: 1 });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jachai-business-qr-${safeFilenamePart(business.slug)}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      show(errorMessage(e), "error");
    }
  }

  if (error) return <ErrorBanner message={error} />;
  if (!qr) return <PageSpinner />;

  return (
    <div>
      <div className="print:hidden">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Business QR</h2>
        <Card className="max-w-sm p-6 text-center">
          <p className="text-sm font-semibold text-ink-900">{business.name}</p>
          <p className="mt-0.5 text-xs text-ink-500">Scan to view your business on Jachai.</p>
          <div className="mt-4 flex justify-center">
            <canvas ref={canvasRef} className="h-auto max-w-full" />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={downloadPng}>
              Download PNG
            </Button>
            <Button size="sm" variant="outline" onClick={downloadSvg}>
              Download SVG
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()}>
              Print QR
            </Button>
          </div>
        </Card>
        <p className="mt-3 max-w-sm text-xs text-ink-400">
          This QR always opens your business&apos;s current page on Jachai — it keeps working even if your
          listing&apos;s URL changes later.
        </p>
      </div>

      {/* Print-only layout — deliberately excludes the dashboard chrome (see owner/[id]/layout.tsx's print:hidden hooks) */}
      <div className="hidden print:flex print:min-h-screen print:flex-col print:items-center print:justify-center print:gap-3">
        <p className="text-lg font-bold">Jachai</p>
        <canvas ref={printCanvasRef} />
        <p className="text-base font-semibold">{business.name}</p>
        <p className="text-sm text-gray-600">Scan to view this business on Jachai</p>
      </div>
    </div>
  );
}
