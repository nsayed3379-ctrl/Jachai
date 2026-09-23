"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, Lock, LockOpen, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityQuestionStatus } from "@/lib/types";
import { ReportButton } from "./report-button";

/**
 * Three-dot overflow menu replacing the old always-visible "Delete" text
 * link — Delete for the post's own author, Report for anyone else who's
 * logged in (reuses ReportButton's existing submit/modal logic via its
 * `trigger` render-prop, no duplicated report UI). Renders nothing if
 * neither action applies (logged out, viewing someone else's post).
 */
export function PostMenu({
  isAuthor,
  canReport,
  targetId,
  onDelete,
  deleting,
  questionStatus,
  onCloseQuestion,
  onReopenQuestion,
}: {
  isAuthor: boolean;
  canReport: boolean;
  targetId: string;
  onDelete: () => void;
  deleting?: boolean;
  /** Present only for a QUESTION post — adds an author-only Close/Reopen item. */
  questionStatus?: CommunityQuestionStatus | null;
  onCloseQuestion?: () => void;
  onReopenQuestion?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!isAuthor && !canReport) return null;

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink-700 transition-colors duration-150 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onClick={(e) => {
        // The whole card navigates to the post on click — stop the menu's
        // clicks from bubbling up to that handler.
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Post options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500"
      >
        <MoreHorizontal size={17} />
      </button>

      {/*
        Kept mounted at all times (visibility toggled via the "hidden" class,
        not a `{open && ...}` JSX conditional) — ReportButton lives inside
        here, and it owns its own modal's open state. Unmounting this wrapper
        the instant "Report" is clicked (setOpen(false), same tick as
        openModal()) would destroy ReportButton before its modal ever
        painted. ReportButton's modal itself portals to document.body, so it
        renders correctly regardless of this wrapper's hidden state.
      */}
      <div
        role="menu"
        className={cn(
          "absolute right-0 top-full z-20 mt-1 w-40 origin-top-right rounded-lg border border-ink-100 bg-surface p-1 shadow-pop",
          open ? "block animate-scale-in" : "hidden"
        )}
      >
        {isAuthor && questionStatus && questionStatus !== "CLOSED" && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCloseQuestion?.();
            }}
            className={itemClass}
          >
            <Lock size={15} />
            Close question
          </button>
        )}
        {isAuthor && questionStatus === "CLOSED" && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onReopenQuestion?.();
            }}
            className={itemClass}
          >
            <LockOpen size={15} />
            Reopen question
          </button>
        )}
        {isAuthor && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            disabled={deleting}
            className={cn(itemClass, "hover:bg-rose-500/10 hover:text-rose-600")}
          >
            <Trash2 size={15} />
            Delete
          </button>
        )}
        {!isAuthor && canReport && (
          <ReportButton
            targetType="COMMUNITY_POST"
            targetId={targetId}
            trigger={(openModal) => (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  openModal();
                }}
                className={itemClass}
              >
                <Flag size={15} />
                Report
              </button>
            )}
          />
        )}
      </div>
    </div>
  );
}
