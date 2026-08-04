"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClientError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { isValidBdPhone, isValidPassword, normalizeBdPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const router = useRouter();

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
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">
        {step === "phone" ? "Reset your password" : "Set a new password"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500 text-center">
        {step === "phone"
          ? "We'll text you a one-time code to confirm it's you."
          : `Sent to ${normalizeBdPhone(phone)}`}
      </p>

      <div className="mt-6 space-y-4">
        {step === "phone" && (
          <>
            <div>
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
              />
            </div>

            <FieldError>{error}</FieldError>

            <Button className="w-full" onClick={requestOtp} loading={sending}>
              Send code
            </Button>
          </>
        )}

        {step === "reset" && (
          <>
            <div>
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoFocus
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <FieldHint>At least 8 characters.</FieldHint>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && resetPassword()}
              />
            </div>

            <FieldError>{error}</FieldError>

            <Button className="w-full" onClick={resetPassword} loading={resetting}>
              Reset password
            </Button>

            <div className="flex justify-between text-xs text-ink-400">
              <button onClick={() => setStep("phone")} className="hover:underline">
                ← Change number
              </button>
              <button
                onClick={requestOtp}
                disabled={cooldown > 0 || sending}
                className="hover:underline disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-ink-400">
          Remembered your password?{" "}
          <Link href="/login" className="hover:underline text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
