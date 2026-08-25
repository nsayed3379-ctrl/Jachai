"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

/**
 * In-session shortcut for a logged-in personal (CONSUMER) account to create
 * its paired Business account — same phone number, its own password/name.
 * The phone is already OTP-verified from the personal signup, so no OTP step
 * here; on success the two accounts are auto-linked and this modal switches
 * the session straight into the new business account (POST
 * /auth/register-business, see AuthService#registerBusinessFromConsumer).
 */
export function CreateBusinessAccountModal({
  open,
  onClose,
  onLinkInstead,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional — when provided, offers an escape hatch to the link-accounts flow instead (for the case a Business account already exists for this phone but isn't linked yet). The caller owns showing that modal, since it needs to outlive this one closing. */
  onLinkInstead?: () => void;
}) {
  const { login } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setName("");
    setPassword("");
    setError(null);
    setBusy(false);
    onClose();
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const tokens = await authApi.registerBusiness(password, name.trim());
      login(tokens);
      show("Business account created — you're switched in.", "success");
      handleClose();
      router.push("/owner");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="create-business-account-heading" panelClassName="max-w-sm">
      <div className="p-6 sm:p-8">
        <h2 id="create-business-account-heading" className="font-display text-xl font-bold text-ink-900">
          Create your Business account
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">
          A separate account for managing your listings — same phone number, its own password and name. You&apos;ll
          be switched into it right away.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="biz-account-name">Business account name</Label>
            <Input
              id="biz-account-name"
              autoFocus
              placeholder="e.g. your name or business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="biz-account-password">Password</Label>
            <Input
              id="biz-account-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button
            className="w-full"
            onClick={submit}
            loading={busy}
            disabled={!name.trim() || password.length < 8}
          >
            Create &amp; switch
          </Button>
          {onLinkInstead && (
            <button
              type="button"
              onClick={() => {
                handleClose();
                onLinkInstead();
              }}
              className="w-full text-center text-xs text-ink-400 hover:text-ink-700 hover:underline"
            >
              Already have a Business account for this number? Link it instead.
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
