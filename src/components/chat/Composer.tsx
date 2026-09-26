"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useIsDesktop } from "@/components/ui/sheet";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

const MAX_LEN = 1000;
const COUNTER_THRESHOLD = 900;
const MAX_LINES = 5;
const LINE_HEIGHT_PX = 22;

export function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, LINE_HEIGHT_PX * MAX_LINES)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return;
    // Desktop: Enter sends, Shift+Enter makes a new line. Mobile (no fine pointer):
    // Enter always makes a new line — only the send button submits, since phone
    // keyboards don't have a Shift key to combine with.
    if (isDesktop && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const trimmedLen = value.trim().length;
  const canSend = trimmedLen > 0 && !disabled;

  return (
    <div
      className="shrink-0 border-t border-ink-100 bg-surface px-2.5 pt-2 dark:border-ink-700"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {value.length >= COUNTER_THRESHOLD && (
        <p className={cn("px-2 pb-1 text-right text-xs", value.length >= MAX_LEN ? "text-rose-600" : "text-ink-500")}>
          {value.length}/{MAX_LEN}
        </p>
      )}
      <div className="flex items-end gap-1.5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="min-h-11 flex-1 resize-none rounded-full bg-ink-100 px-4 py-2.5 text-base leading-[22px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-300 disabled:opacity-60 dark:bg-ink-800 dark:text-ink-100 dark:placeholder:text-ink-500 dark:focus:ring-ink-600"
        />
        <IconButton
          variant="unstyled"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "shrink-0 transition-[color,transform] duration-150",
            canSend ? "scale-100 text-crimson-600" : "scale-95 text-ink-400 opacity-40"
          )}
        >
          <Send size={22} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );
}
