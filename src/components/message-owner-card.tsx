"use client";

import { useState } from "react";
import { messageApi } from "@/lib/api";
import { getOpenStatus } from "@/lib/business-hours";
import { useLanguage } from "@/lib/language-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { HoursExceptionEntry, OperatingHoursEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";

const MAX_LEN = 1000;

const OPEN_NOW_PROMPT_KEY = "message_owner.prompt.open_now";

const QUICK_PROMPT_KEYS = [
  "message_owner.prompt.prices",
  OPEN_NOW_PROMPT_KEY,
  "message_owner.prompt.bookings",
  "message_owner.prompt.location",
];

function OwnerAvatar({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="h-10 w-10 flex-none rounded-full border border-ink-200 object-cover"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-crimson-700 font-display text-sm font-bold text-white">
      {initial}
    </div>
  );
}

function PaperPlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Sidebar "Message the owner" panel on the business detail page. Quick-prompt
 * chips, a live character count, and an inline "sent" confirmation instead of
 * just a toast. Logged-out visitors get a prompt to sign in; owners viewing
 * their own listing get a short note instead of a compose box.
 */
export function MessageOwnerCard({
  businessId,
  businessName,
  ownerLogoUrl,
  isLoggedIn,
  isOwnBusiness,
  onLogin,
  structuredHours,
  hoursExceptions,
}: {
  businessId: string;
  businessName: string;
  ownerLogoUrl?: string | null;
  isLoggedIn: boolean;
  isOwnBusiness: boolean;
  onLogin: () => void;
  /** Power an inline auto-answer for the "Are you open right now?" quick prompt — omitted/null just skips that. */
  structuredHours?: OperatingHoursEntry[] | null;
  hoursExceptions?: HoursExceptionEntry[] | null;
}) {
  const { show } = useToast();
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [openAnswer, setOpenAnswer] = useState<string | null>(null);

  function addPrompt(key: string, prompt: string) {
    // The other 3 prompts just insert canned text; this one also shows a computed
    // answer immediately, alongside (not instead of) the normal send flow — the
    // computed answer can't cover everything (holidays, etc.), so the visitor can
    // still send a real message.
    if (key === OPEN_NOW_PROMPT_KEY) {
      const status = getOpenStatus(structuredHours, hoursExceptions);
      setOpenAnswer(
        status
          ? status.open
            ? status.changesAt
              ? t("message_owner.open_status.open_until", { time: status.changesAt })
              : t("message_owner.open_status.open_no_time")
            : status.changesAt
              ? t("message_owner.open_status.closed_opens", { time: status.changesAt })
              : t("message_owner.open_status.closed_no_time")
          : null
      );
    }
    setText((cur) => {
      const trimmed = cur.trim();
      if (!trimmed) return prompt + " ";
      return `${trimmed} ${prompt} `;
    });
  }

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await messageApi.send(businessId, body);
      setText("");
      setSent(true);
      setOpenAnswer(null);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-card">
      <div className="flex items-center gap-3 border-b border-ink-100 bg-gradient-to-br from-sand-50 to-surface px-4 py-3">
        <OwnerAvatar name={businessName} logoUrl={ownerLogoUrl} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900">{t("message_owner.heading")}</p>
          <p className="truncate text-xs text-ink-400">{t("message_owner.subheading")}</p>
        </div>
      </div>

      <div className="p-4">
        {isOwnBusiness ? (
          <p className="text-sm text-ink-500">{t("message_owner.own_business_note")}</p>
        ) : !isLoggedIn ? (
          <div className="text-center">
            <p className="text-sm text-ink-500">{t("message_owner.login_prompt", { business: businessName })}</p>
            <Button className="mt-3 w-full" size="sm" onClick={onLogin}>
              {t("message_owner.login_to_message")}
            </Button>
          </div>
        ) : sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-ink-900">{t("message_owner.sent_heading")}</p>
            <p className="text-xs text-ink-400">{t("message_owner.sent_description")}</p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setOpenAnswer(null);
              }}
              className="mt-1 text-xs font-semibold text-crimson-700 hover:underline"
            >
              {t("message_owner.send_another")}
            </button>
          </div>
        ) : (
          <>
            {openAnswer && (
              <div className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                {openAnswer} {t("message_owner.open_answer_suffix")}
              </div>
            )}

            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPT_KEYS.map((key) => {
                const promptText = t(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addPrompt(key, promptText)}
                    className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 transition-colors hover:border-crimson-300 hover:bg-crimson-50 hover:text-crimson-700"
                  >
                    {promptText}
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "rounded-xl border transition-colors",
                focused ? "border-crimson-400 ring-2 ring-crimson-500/20" : "border-ink-200"
              )}
            >
              <Textarea
                placeholder={t("message_owner.compose_placeholder")}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                rows={3}
                className="border-0 bg-transparent focus:ring-0"
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-0.5">
                <span className="text-[11px] text-ink-300">{t("message_owner.private_hint")}</span>
                <span className={cn("text-[11px]", text.length > MAX_LEN - 50 ? "text-crimson-600" : "text-ink-300")}>
                  {text.length}/{MAX_LEN}
                </span>
              </div>
            </div>

            <Button
              className="mt-2.5 w-full"
              size="sm"
              onClick={send}
              loading={sending}
              disabled={!text.trim()}
            >
              <span className="inline-flex items-center gap-1.5">
                <PaperPlaneIcon />
                {t("message_owner.send_message")}
              </span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
