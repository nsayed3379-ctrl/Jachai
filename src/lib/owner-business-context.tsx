"use client";

import { createContext, useContext } from "react";
import type { BusinessResponse } from "./types";

/**
 * The one `businessApi.mine()` fetch for the whole `/owner/[id]/*` workspace,
 * shared by the sidebar and every section page. Provided by
 * `app/(site)/owner/[id]/layout.tsx`.
 */
export interface OwnerBusinessContextValue {
  /** The business the current route is scoped to. */
  business: BusinessResponse;
  /** Every business this account owns — powers the sidebar switcher. */
  allBusinesses: BusinessResponse[];
  /** Re-run the mine() fetch (e.g. after an edit changes the name/verified state). */
  refresh: () => void;
}

const OwnerBusinessContext = createContext<OwnerBusinessContextValue | null>(null);

export const OwnerBusinessProvider = OwnerBusinessContext.Provider;

export function useOwnerBusiness(): OwnerBusinessContextValue {
  const ctx = useContext(OwnerBusinessContext);
  if (!ctx) {
    throw new Error("useOwnerBusiness must be used inside the /owner/[id] layout");
  }
  return ctx;
}
