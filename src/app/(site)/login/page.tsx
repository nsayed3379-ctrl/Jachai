"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">Log in</h1>
      <p className="mt-1.5 text-sm text-ink-500 text-center">
        Enter your mobile number and password to continue.
      </p>

      <div className="mt-6">
        <LoginForm
          onSuccess={() => router.push("/")}
          onSwitchToSignup={() => router.push("/signup")}
          onSwitchToForgotPassword={() => router.push("/forgot-password")}
        />
      </div>
    </div>
  );
}
