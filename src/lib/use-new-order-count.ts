"use client";

import { useCallback, useEffect, useState } from "react";
import { orderApi } from "./api";

const POLL_INTERVAL_MS = 45_000;

/**
 * Count of PENDING ("New") orders for one business — drives the badge on the
 * owner sidebar's "Orders" link. Silently 0 for a failed fetch or a business
 * that isn't taking orders (the endpoint 403s for non-owners).
 */
export function useNewOrderCount(businessId: string | null | undefined): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!businessId) {
      setCount(0);
      return;
    }
    orderApi
      .pendingCount(businessId)
      .then((n) => setCount(typeof n === "number" ? n : 0))
      .catch(() => setCount(0));
  }, [businessId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return count;
}
