"use client";

import { useEffect, useState } from "react";
import { Modal } from "./modal";
import { BottomSheet } from "./bottom-sheet";

/** True at >= 640px (Tailwind's `sm`, this app's established mobile/desktop pivot). */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mql.matches);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

/**
 * Adaptive dialog: BottomSheet (drag-to-dismiss, bottom-anchored) below 640px,
 * Modal (centered) at 640px and up. Composes the two existing primitives as-is —
 * neither is modified, so their current call sites (10 for Modal, 1 for BottomSheet)
 * are completely unaffected. New call sites should reach for this instead of picking
 * Modal or BottomSheet directly.
 */
export function Sheet({
  open,
  onClose,
  children,
  footer,
  panelClassName,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Rendered after children, inside the same scrollable panel — e.g. a sticky submit row. */
  footer?: React.ReactNode;
  /** Modal only — BottomSheet doesn't take a custom panel class. */
  panelClassName?: string;
  labelledBy?: string;
}) {
  const isDesktop = useIsDesktop();
  const content = (
    <>
      {children}
      {footer}
    </>
  );

  if (isDesktop) {
    return (
      <Modal open={open} onClose={onClose} labelledBy={labelledBy} panelClassName={panelClassName}>
        {content}
      </Modal>
    );
  }
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={labelledBy}>
      {content}
    </BottomSheet>
  );
}
