"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

/**
 * Links the caller's account with an opposite-role account already
 * registered independently under the same phone number (the case where the
 * two weren't created together via CreateBusinessAccountModal's in-session
 * shortcut). Proves it's the same person via a fresh OTP to that phone —
 * see AuthService#linkAccounts.
 */
export function LinkAccountsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const { show } = useToast();
  const [step, setStep] = useState<"start" | "code">("start");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setStep("start");
    setCode("");
    setError(null);
    setBusy(false);
    onClose();
  }

  async function sendCode() {
    if (!profile) return;
    setError(null);
    setBusy(true);
    try {
      await authApi.requestOtp(profile.phoneNumber);
      setStep("code");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndLink() {
    setError(null);
    setBusy(true);
    try {
      await authApi.linkAccounts(code.trim());
      show("Accounts linked — you can now switch between them from the nav.", "success");
      handleClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="link-accounts-heading" panelClassName="max-w-sm">
      <div className="p-6 sm:p-8">
        <h2 id="link-accounts-heading" className="font-display text-xl font-bold text-ink-900">
          Link your accounts
        </h2>

        {step === "start" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-ink-500">
              If you already have both a personal and a Business account under this phone number, we&apos;ll text a
              code to confirm it&apos;s you before linking them.
            </p>
            <FieldError>{error}</FieldError>
            <Button className="w-full" onClick={sendCode} loading={busy}>
              Send code
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-ink-500">We sent a code to {profile?.phoneNumber}.</p>
            <div>
              <Label htmlFor="link-code">Verification code</Label>
              <Input
                id="link-code"
                inputMode="numeric"
                autoFocus
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyAndLink()}
              />
            </div>
            <FieldError>{error}</FieldError>
            <Button className="w-full" onClick={verifyAndLink} loading={busy} disabled={!code.trim()}>
              Verify &amp; link
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
