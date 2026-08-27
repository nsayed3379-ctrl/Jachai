"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/lib/auth-modal-context";
import { PageSpinner } from "@/components/ui/misc";

/**
 * The standalone /login page is gone — logging in now happens in the global
 * auth modal (components/auth/auth-modal.tsx). This route only lives on as a
 * redirect so old links and bookmarks land somewhere sensible: it bounces to
 * the home page and pops the login modal open.
 */
export default function LoginRedirect() {
  const router = useRouter();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    openLogin();
    router.replace("/");
  }, [router, openLogin]);

  return <PageSpinner />;
}
