"use client";

import { useState } from "react";
import { ApiClientError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
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
  const { t } = useLanguage();

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
      setError(t("auth.error.invalid_phone"));
      return;
    }
    setSending(true);
    try {
      await authApi.requestOtp(normalizeBdPhone(phone));
      setStep("reset");
      startCooldown();
      show(t("auth.toast.otp_sent"), "success");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 429) {
        setError(t("auth.error.too_many_otp"));
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
      setError(t("auth.error.enter_code"));
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError(t("auth.error.password_min"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.error.passwords_mismatch"));
      return;
    }
    setResetting(true);
    try {
      const tokens = await authApi.resetPassword(normalizeBdPhone(phone), code.trim(), newPassword);
      login(tokens);
      show(t("auth.toast.password_reset"), "success");
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
        <p className="text-sm text-ink-500">{t("auth.sent_to", { phone: normalizeBdPhone(phone) })}</p>

        <div>
          <Label htmlFor="reset-code">{t("auth.otp_code_label")}</Label>
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
          <Label htmlFor="reset-new-password">{t("auth.new_password")}</Label>
          <Input
            id="reset-new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FieldHint>{t("auth.hint.min_8_chars")}</FieldHint>
        </div>

        <div>
          <Label htmlFor="reset-confirm-password">{t("auth.confirm_new_password")}</Label>
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
          {t("auth.reset_password_button")}
        </Button>

        <div className="flex justify-between text-sm text-ink-500">
          <button type="button" onClick={() => setStep("phone")} className="hover:underline">
            {t("auth.change_number")}
          </button>
          <button
            type="button"
            onClick={requestOtp}
            disabled={cooldown > 0 || sending}
            className="hover:underline disabled:opacity-50"
          >
            {cooldown > 0 ? t("auth.resend_in", { n: cooldown }) : t("auth.resend_code")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="forgot-phone">{t("auth.mobile_number")}</Label>
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
        {t("auth.send_code")}
      </Button>

      <p className="text-center text-sm text-ink-500">
        {t("auth.remembered_password")}{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-crimson-700 hover:underline font-medium">
          {t("nav.log_in")}
        </button>
      </p>
    </div>
  );
}