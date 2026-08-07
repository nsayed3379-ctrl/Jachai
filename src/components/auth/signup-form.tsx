"use client";

import { useState } from "react";
import { ApiClientError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { isValidBdPhone, isValidPassword, normalizeBdPhone } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

const RESEND_COOLDOWN_SECONDS = 60;

export function SignupForm({
  onSuccess,
  onSwitchToLogin,
}: {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}) {
  const { login } = useAuth();
  const { show } = useToast();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CONSUMER");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
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
    if (!isValidPassword(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSending(true);
    try {
      await authApi.requestOtp(normalizeBdPhone(phone));
      setStep("otp");
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

  async function verifyAndRegister() {
    setError(null);
    if (code.trim().length < 4) {
      setError("Enter the code you received.");
      return;
    }
    setVerifying(true);
    try {
      const tokens = await authApi.register(normalizeBdPhone(phone), code.trim(), password, role);
      login(tokens);
      show("Account created", "success");
      onSuccess();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-500">Sent to {normalizeBdPhone(phone)}</p>

        <div>
          <Label htmlFor="signup-code">6-digit code</Label>
          <Input
            id="signup-code"
            inputMode="numeric"
            autoFocus
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyAndRegister()}
          />
          <FieldError>{error}</FieldError>
        </div>

        <Button className="w-full" size="lg" onClick={verifyAndRegister} loading={verifying}>
          Verify &amp; create account
        </Button>

        <div className="flex justify-between text-sm text-ink-500">
          <button type="button" onClick={() => setStep("details")} className="hover:underline">
            ← Back
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
        <Label htmlFor="signup-phone">Mobile number</Label>
        <Input
          id="signup-phone"
          inputMode="tel"
          placeholder="01712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldHint>At least 8 characters.</FieldHint>
      </div>

      <div>
        <Label htmlFor="signup-confirm-password">Confirm password</Label>
        <Input
          id="signup-confirm-password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && requestOtp()}
        />
      </div>

      <div>
        <Label>Account type</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("CONSUMER")}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              role === "CONSUMER" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600 hover:border-ink-300"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("BUSINESS_OWNER")}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              role === "BUSINESS_OWNER" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600 hover:border-ink-300"
            }`}
          >
            Business Owner
          </button>
        </div>
        <FieldHint>One phone number can hold only one account type.</FieldHint>
      </div>

      <FieldError>{error}</FieldError>

      <Button className="w-full" size="lg" onClick={requestOtp} loading={sending}>
        Create account
      </Button>

      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-crimson-700 hover:underline font-medium">
          Log in
        </button>
      </p>
    </div>
  );
}
