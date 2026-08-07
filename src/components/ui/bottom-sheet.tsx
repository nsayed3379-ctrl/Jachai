"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DISMISS_THRESHOLD_PX = 120;

export function BottomSheet({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const [isBrowser, setIsBrowser] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const dragState = useRef<{ startY: number; dragging: boolean } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => setIsBrowser(true), []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    setDragOffset(0);
    const timer = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  function onDragStart(clientY: number) {
    dragState.current = { startY: clientY, dragging: true };
    setDragging(true);
  }

  function onDragMove(clientY: number) {
    if (!dragState.current?.dragging) return;
    const delta = Math.max(0, clientY - dragState.current.startY);
    setDragOffset(delta);
  }

  function onDragEnd() {
    if (!dragState.current?.dragging) return;
    dragState.current.dragging = false;
    setDragging(false);
    if (dragOffset > DISMISS_THRESHOLD_PX) {
      onClose();
    } else {
      setDragOffset(0);
    }
  }

  if (!isBrowser || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/60 backdrop-blur-sm transition-opacity duration-250",
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
        style={{
          transform: `translateY(${visible ? dragOffset : 400}px)`,
          transition: dragging ? "none" : "transform 250ms ease-out",
        }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white shadow-2xl"
      >
        <div
          className="sticky top-0 z-10 flex justify-center bg-white pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            onDragStart(e.clientY);
          }}
          onPointerMove={(e) => onDragMove(e.clientY)}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="h-1.5 w-10 rounded-full bg-ink-200" />
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
}
