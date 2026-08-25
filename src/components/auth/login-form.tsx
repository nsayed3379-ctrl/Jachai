"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { isValidBdPhone, normalizeBdPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

export function LoginForm({
  onSuccess,
  onSwitchToSignup,
  onSwitchToForgotPassword,
}: {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}) {
  const { login } = useAuth();
  const { show } = useToast();
  const { t } = useLanguage();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Consumer and Business are separate accounts (same phone number can back
  // both) — this toggle picks which one to log into, mirroring Yelp's
  // separate yelp.com vs biz.yelp.com login without a second page.
  const [asBusiness, setAsBusiness] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!isValidBdPhone(phone)) {
      setError(t("auth.error.invalid_phone"));
      return;
    }
    if (!password) {
      setError(t("auth.error.enter_password"));
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await authApi.login(
        normalizeBdPhone(phone),
        password,
        asBusiness ? "BUSINESS_OWNER" : undefined
      );
      login(tokens);
      show(t("auth.toast.logged_in"), "success");
      onSuccess();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="login-phone">{t("auth.mobile_number")}</Label>
        <Input
          id="login-phone"
          inputMode="tel"
          placeholder="01712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </div>

      <div>
        <Label htmlFor="login-password">{t("auth.password")}</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setAsBusiness((v) => !v)}
          className="text-ink-500 hover:text-ink-800 hover:underline"
        >
          {asBusiness ? "Log in to your personal account instead" : "Log in to your Business account instead"}
        </button>
      </div>

      <div className="flex justify-end text-sm">
        <button type="button" onClick={onSwitchToForgotPassword} className="text-crimson-700 hover:underline font-medium">
          {t("auth.forgot_password")}
        </button>
      </div>

      <FieldError>{error}</FieldError>

      <Button className="w-full" size="lg" onClick={handleLogin} loading={submitting}>
        {t("nav.log_in")}
      </Button>

      <p className="text-center text-sm text-ink-500">
        {t("auth.no_account")}{" "}
        <button type="button" onClick={onSwitchToSignup} className="text-crimson-700 hover:underline font-medium">
          {t("nav.sign_up")}
        </button>
      </p>
    </div>
  );
}