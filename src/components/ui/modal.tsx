"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  children,
  panelClassName,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  labelledBy?: string;
}) {
  const [isBrowser, setIsBrowser] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIsBrowser(true), []);

  // Mount immediately on open; unmount only after the exit transition finishes.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timer = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(timer);
  }, [open]);

  // Lock background scroll for as long as the modal is mounted, so the page
  // behind it can't scroll and its own scroll position never changes.
  useEffect(() => {
    if (!mounted) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mounted]);

  // Focus trap + ESC-to-close, active only while the panel is actually visible.
  useEffect(() => {
    if (!visible) return;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    // Prefer the first text input (e.g. a form's phone number field) over
    // incidental controls like the close button, so typing can start immediately.
    const firstInput = panel.querySelector<HTMLElement>("input, textarea, select");
    (firstInput ?? getFocusable()[0])?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  if (!isBrowser || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-[28px] sm:rounded-[32px] bg-white shadow-2xl transition-all duration-200 ease-out",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
          panelClassName
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
