"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface CommunityUsernameModalContextValue {
  open: boolean;
  /** onComplete fires once the username is successfully set — callers use it to resume whatever they were doing (e.g. open the composer). */
  openModal: (onComplete?: () => void) => void;
  close: () => void;
  notifyComplete: () => void;
}

const CommunityUsernameModalContext = createContext<CommunityUsernameModalContextValue | null>(null);

export function CommunityUsernameModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [onCompleteCallback, setOnCompleteCallback] = useState<(() => void) | null>(null);

  const openModal = useCallback((onComplete?: () => void) => {
    setOnCompleteCallback(() => onComplete ?? null);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const notifyComplete = useCallback(() => {
    setOpen(false);
    onCompleteCallback?.();
  }, [onCompleteCallback]);

  const value = useMemo(() => ({ open, openModal, close, notifyComplete }), [open, openModal, close, notifyComplete]);

  return <CommunityUsernameModalContext.Provider value={value}>{children}</CommunityUsernameModalContext.Provider>;
}

export function useCommunityUsernameModal(): CommunityUsernameModalContextValue {
  const ctx = useContext(CommunityUsernameModalContext);
  if (!ctx) throw new Error("useCommunityUsernameModal must be used within CommunityUsernameModalProvider");
  return ctx;
}
