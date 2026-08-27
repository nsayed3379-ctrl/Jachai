"use client";

import { useState } from "react";
import { messageApi } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";

const MAX_LEN = 1000;

const QUICK_PROMPTS = [
  "What are your prices?",
  "Are you open right now?",
  "Do you take bookings?",
  "Where exactly are you located?",
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
}: {
  businessId: string;
  businessName: string;
  ownerLogoUrl?: string | null;
  isLoggedIn: boolean;
  isOwnBusiness: boolean;
  onLogin: () => void;
}) {
  const { show } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  function addPrompt(prompt: string) {
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
          <p className="text-sm font-bold text-ink-900">Message the owner</p>
          <p className="truncate text-xs text-ink-400">Usually the fastest way to get an answer</p>
        </div>
      </div>

      <div className="p-4">
        {isOwnBusiness ? (
          <p className="text-sm text-ink-500">
            This is your listing. Customer messages arrive in your{" "}
            <span className="font-medium text-ink-700">owner inbox</span>.
          </p>
        ) : !isLoggedIn ? (
          <div className="text-center">
            <p className="text-sm text-ink-500">Log in to send {businessName} a private message.</p>
            <Button className="mt-3 w-full" size="sm" onClick={onLogin}>
              Log in to message
            </Button>
          </div>
        ) : sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-ink-900">Message sent</p>
            <p className="text-xs text-ink-400">The owner will see it in their inbox and can reply to you there.</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-1 text-xs font-semibold text-crimson-700 hover:underline"
            >
              Send another
            </button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => addPrompt(p)}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 transition-colors hover:border-crimson-300 hover:bg-crimson-50 hover:text-crimson-700"
                >
                  {p}
                </button>
              ))}
            </div>

            <div
              className={cn(
                "rounded-xl border transition-colors",
                focused ? "border-crimson-400 ring-2 ring-crimson-500/20" : "border-ink-200"
              )}
            >
              <Textarea
                placeholder="Ask about pricing, availability, or booking…"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                rows={3}
                className="border-0 bg-transparent focus:ring-0"
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-0.5">
                <span className="text-[11px] text-ink-300">Only the owner can see this</span>
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
                Send message
              </span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
