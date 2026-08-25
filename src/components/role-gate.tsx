"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { PageSpinner } from "./ui/misc";
import { Button } from "./ui/button";

export function RoleGate({
  allow,
  fallback,
  children,
}: {
  /** Omit to just require being logged in, regardless of role — most screens today are usable by any account. */
  allow?: UserRole[];
  /** Rendered instead of the generic "not available" screen when logged in but `allow` excludes this account's role — e.g. a "create/switch to your Business account" CTA. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="font-display text-xl text-ink-900">Log in required</h1>
        <p className="mt-2 text-sm text-ink-500">
          You need to log in to view this page.
        </p>
        <Link href="/login">
          <Button className="mt-5">Log in</Button>
        </Link>
      </div>
    );
  }

  if (allow && !allow.includes(user.role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="font-display text-xl text-ink-900">Not available for your account</h1>
        <p className="mt-2 text-sm text-ink-500">
          This section is only available to {allow.join(" / ").toLowerCase()} accounts.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-5">
            Back to home
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
