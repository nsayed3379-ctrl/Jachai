"use client";

import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">Create an account</h1>
      <p className="mt-1.5 text-sm text-ink-500 text-center">
        We&apos;ll text you a one-time code to confirm your number.
      </p>

      <div className="mt-6">
        <SignupForm onSuccess={() => router.push("/")} onSwitchToLogin={() => router.push("/login")} />
      </div>
    </div>
  );
}
