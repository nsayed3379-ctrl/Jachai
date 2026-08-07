"use client";

import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-500 text-center">
        We&apos;ll text you a one-time code to confirm it&apos;s you.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm onSuccess={() => router.push("/")} onSwitchToLogin={() => router.push("/login")} />
      </div>
    </div>
  );
}
