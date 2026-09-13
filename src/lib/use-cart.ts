"use client";

import { useSyncExternalStore } from "react";
import type { Cart } from "./types";
import {
  cartCount,
  cartSubtotal,
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeToCart,
} from "./cart";

/**
 * Reactive view of the localStorage cart. Re-renders on any add / qty change /
 * clear (same tab or another tab). Mutations go through the plain functions in
 * `lib/cart.ts`.
 */
export function useCart(): { cart: Cart | null; count: number; subtotal: number } {
  const cart = useSyncExternalStore(subscribeToCart, getCartSnapshot, getCartServerSnapshot);
  return { cart, count: cartCount(cart), subtotal: cartSubtotal(cart) };
}
