"use client";

import { useState } from "react";
import { ApiClientError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { isValidBdPhone, isValidPassword, normalizeBdPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordForm({
  onSuccess,
  onSwitchToLogin,
}: {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}) {
  const { login } = useAuth();
  const { show } = useToast();

  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function requestOtp() {
    setError(null);
    if (!isValidBdPhone(phone)) {
      setError("Enter a valid Bangladeshi mobile number (e.g. 01712345678).");
      return;
    }
    setSending(true);
    try {
      await authApi.requestOtp(normalizeBdPhone(phone));
      setStep("reset");
      startCooldown();
      show("OTP sent — it expires in 5 minutes.", "success");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 429) {
        setError("Too many OTP requests — please wait before trying again.");
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSending(false);
    }
  }

  async function resetPassword() {
    setError(null);
    if (code.trim().length < 4) {
      setError("Enter the code you received.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setResetting(true);
    try {
      const tokens = await authApi.resetPassword(normalizeBdPhone(phone), code.trim(), newPassword);
      login(tokens);
      show("Password reset", "success");
      onSuccess();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  if (step === "reset") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-500">Sent to {normalizeBdPhone(phone)}</p>

        <div>
          <Label htmlFor="reset-code">6-digit code</Label>
          <Input
            id="reset-code"
            inputMode="numeric"
            autoFocus
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="reset-new-password">New password</Label>
          <Input
            id="reset-new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FieldHint>At least 8 characters.</FieldHint>
        </div>

        <div>
          <Label htmlFor="reset-confirm-password">Confirm new password</Label>
          <Input
            id="reset-confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && resetPassword()}
          />
        </div>

        <FieldError>{error}</FieldError>

        <Button className="w-full" size="lg" onClick={resetPassword} loading={resetting}>
          Reset password
        </Button>

        <div className="flex justify-between text-sm text-ink-500">
          <button type="button" onClick={() => setStep("phone")} className="hover:underline">
            ← Change number
          </button>
          <button
            type="button"
            onClick={requestOtp}
            disabled={cooldown > 0 || sending}
            className="hover:underline disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="forgot-phone">Mobile number</Label>
        <Input
          id="forgot-phone"
          inputMode="tel"
          placeholder="01712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && requestOtp()}
        />
      </div>

      <FieldError>{error}</FieldError>

      <Button className="w-full" size="lg" onClick={requestOtp} loading={sending}>
        Send code
      </Button>

      <p className="text-center text-sm text-ink-500">
        Remembered your password?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-crimson-700 hover:underline font-medium">
          Log in
        </button>
      </p>
    </div>
  );
}
