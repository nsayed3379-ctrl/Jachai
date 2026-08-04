"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { isValidBdPhone, normalizeBdPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

export default function LoginPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!isValidBdPhone(phone)) {
      setError("Enter a valid Bangladeshi mobile number (e.g. 01712345678).");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await authApi.login(normalizeBdPhone(phone), password);
      login(tokens);
      show("Logged in", "success");
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">Log in</h1>
      <p className="mt-1.5 text-sm text-ink-500 text-center">
        Enter your mobile number and password to continue.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            inputMode="tel"
            placeholder="01712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <FieldError>{error}</FieldError>

        <Button className="w-full" onClick={handleLogin} loading={submitting}>
          Log in
        </Button>

        <div className="flex justify-between text-xs text-ink-400">
          <Link href="/signup" className="hover:underline">
            New here? Create an account
          </Link>
          <Link href="/forgot-password" className="hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
