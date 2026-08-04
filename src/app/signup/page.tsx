"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClientError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { isValidBdPhone, isValidPassword, normalizeBdPhone } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

const RESEND_COOLDOWN_SECONDS = 60;

export default function SignupPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const router = useRouter();

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
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">
        {step === "details" ? "Create an account" : "Enter your code"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500 text-center">
        {step === "details"
          ? "We'll text you a one-time code to confirm your number."
          : `Sent to ${normalizeBdPhone(phone)}`}
      </p>

      <div className="mt-6 space-y-4">
        {step === "details" && (
          <>
            <div>
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldHint>At least 8 characters.</FieldHint>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
              />
            </div>

            <div>
              <Label>I&apos;m signing up as</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("CONSUMER")}
                  className={`rounded border px-3 py-2 text-sm ${
                    role === "CONSUMER" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-600"
                  }`}
                >
                  A customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("BUSINESS_OWNER")}
                  className={`rounded border px-3 py-2 text-sm ${
                    role === "BUSINESS_OWNER" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-600"
                  }`}
                >
                  A business owner
                </button>
              </div>
              <FieldHint>One phone number can hold only one account type.</FieldHint>
            </div>

            <FieldError>{error}</FieldError>

            <Button className="w-full" onClick={requestOtp} loading={sending}>
              Send code
            </Button>
          </>
        )}

        {step === "otp" && (
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
                onKeyDown={(e) => e.key === "Enter" && verifyAndRegister()}
              />
              <FieldError>{error}</FieldError>
            </div>

            <Button className="w-full" onClick={verifyAndRegister} loading={verifying}>
              Verify &amp; create account
            </Button>

            <div className="flex justify-between text-xs text-ink-400">
              <button onClick={() => setStep("details")} className="hover:underline">
                ← Back
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
          Already have an account?{" "}
          <Link href="/login" className="hover:underline text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
